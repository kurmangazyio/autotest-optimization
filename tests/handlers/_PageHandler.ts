import type { Page, BrowserRequest, PageCache, PageKpi, PageWidget } from '../types';
import type { Entry } from 'selenium-webdriver/lib/logging';

import { WebDriver, Builder } from "selenium-webdriver";
import { Options } from 'selenium-webdriver/chrome';

import { StepHandler, TopFilterActionHandler, ValidateHandler, WidgetActionHandler } from "./index";
import { configuration as _config } from "../data";
import { getValidator, toSlugParams } from './helpers';

const cacheDefault: PageCache = { 
    requests: [],
    reserve: {
        topFilters: [],
        widgets: []
    }
}

type PageTopFilter = Page['topFilters']['items'][0];
type PageTopFilterAction = Page['topFilters']['actions'][0];

class PageHandler {
    private driver: WebDriver;
    private page: Page;
    private steps: StepHandler;
    private val: ValidateHandler;
    private cache: PageCache;
    private topFilter: TopFilterActionHandler;
    private widgets: WidgetActionHandler;

    constructor (page: Page) {
        let options = new Options();
        options.setLoggingPrefs({ browser: 'ALL', performance: 'ALL' })

        let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
        driver.manage().window().maximize();

        this.driver = driver;
        this.page = page;
        this.cache = cacheDefault;
        this.val = new ValidateHandler();
        this.steps = new StepHandler(driver);
        this.topFilter = new TopFilterActionHandler(driver);
        this.widgets = new WidgetActionHandler(driver);
    }

    initialize () {
        afterAll(async () => await this.driver.quit())

        describe(`"${this.page.title}" is running`, () => {
            this.handlePage()
            this.handleRequests()
            this.handleTopFilters()
            this.handleKpis()
            this.handleWidgets()
        })
    }

    // getters
    async getRequests (): Promise<Array<BrowserRequest>> {
        const logs: Entry[] = await this.driver.manage().logs().get('performance');

        return logs
            .filter((item) => item.message.includes(`"method":"Network.responseReceived"`))
            .map((item) => JSON.parse(item.message))
            .map((item) => ({ url: item.message.params.response.url, status: item.message.params.response.status }))
            .filter((item) => item.url.startsWith(_config.requestPrefixes))
    }

    async getBrowserLogs (): Promise<Array<Entry>> {
        let logs: Entry[] = await this.driver.manage().logs().get('browser');

        return logs
            .filter((log) => log.level.name_ === 'SEVERE');
    }

    async getKpiItems (): Promise<Array<PageKpi>> {
       return this.steps.getPageKpiItems();
    }

    async getCache (): Promise<PageCache> {
        return this.cache;
    }

    // Running the driver
    handlePage () {
        it('Launching the driver', async () => {
            let url = _config.baseUrl + this.page.url;
            let params = toSlugParams(this.page);
            
            this.steps.runDriver(url + '?' + params);
        })
    }

    // Running the requests
    handleRequests () {
        describe('Running the requests and validations', () => {
            it('Waiting for till requests are loaded', async () => {
                await this.steps.waitForSomeTime(this.page.requests.timeForRequestLoading);
                await this.cacheItems('requests');
                await this.cacheItems('widgets');
             });
            
            describe('Validating the requests', () => {
                this.requestsValidateExistence()
                this.requestsValidateStatuses()
                this.requestsValidateLogs()
            })
        })
    }

    // Running the top filters
    handleTopFilters () {
        describe('Running the NAVIGATION FILTERS', () => {
            this.page.topFilters.items.forEach((top) => {
                let topLabel = top.label.replace(':', '')

                describe(`Initializing the "${topLabel} => (${top.key})"`, () => {
                    this.topFilterValidateExistence(topLabel, top)
                    this.topFilterValidateValues(topLabel, top)
                    this.topFilterValidateUrls(topLabel, top)
                })
            })

            this.page.topFilters.actions.forEach((action) => {
                let top = this.page.topFilters.items.find((top) => top.key === action.key);

                if (top !== undefined) {
                    let topLabel = top.label.replace(':', '')

                    describe(`Handling actions the "${topLabel} => (${top.key})"`, () => {
                        this.topFilterHandleAction(topLabel, top as PageTopFilter, action)
                    })
                }
            })
        })
    }

    // Running the KPIs
    handleKpis () {
        describe('Running the TOP KPI-s', () => {
            this.kpiValidateExistence()
            this.kpiValidateUnits()
        })
    }

    // Running the widgets
    handleWidgets () {
        describe('Running the WIDGET-s', () => {
            for (let widget of this.page.widgets.items) {
                describe(`Initializing/Validating the "${widget.title} => (${widget.key})"`, () => {
                    this.widgetValidateExistence(widget)
                    this.widgetValidateWidgetLogs(widget)
                    this.widgetValidateFilters(widget)
                })
            }
        })
    }

    private async cacheItems (mode: 'requests' | 'topFilters' | 'widgets' | 'all' = 'all') {
        if (mode === 'requests' || mode === 'all') {
            this.cache.requests = await this.getRequests();
        }

        if (mode === 'topFilters' || mode === 'all') {
            this.cache.reserve.topFilters = await this.topFilter.getTopFiltersCache();
        }

        if (mode === 'widgets' || mode === 'all') {
            this.cache.reserve.widgets = await this.widgets.getWidgetsCache();
        }
    }

    private requestsValidateExistence () {
        let existence = getValidator(this.page, 'requests.validate', 'existence');
        
        if (existence) {
            it('Validating the existence of the requests', async () => {
                let requestToValidate = this.page.requests.requests;                
                let isValid = this.val.validateRequestsExistence(this.cache.requests, requestToValidate);

                expect(isValid).toBeTruthy();
            })
        }
    }

    private requestsValidateStatuses () {
        let status = getValidator(this.page, 'requests.validate', 'status');

        if (status) {
            it('Validating the statuses of the requests', async () => {
                let requests = this.cache.requests;
                let isValid = this.val.validateRequestsStatuses(requests);

                expect(isValid).toBeTruthy();
            })
        }
    }

    private requestsValidateLogs () {
        let log = getValidator(this.page, 'requests.validate', 'log');

        if (log) {
            it('Validating the logs of the requests', async () => {
                let logs = await this.getBrowserLogs();
                let isValid = this.val.validateRequestsConsoleLogs(logs);

                expect(isValid).toBeTruthy();
            })
        }
    }

    private topFilterValidateExistence (topLabel: string, top: PageTopFilter) {
        let hasValidator = getValidator(top, 'validate', 'label');
        
        if (hasValidator) {
            it(`Validating the existence of the "${topLabel}"`, async () => {
                let [isValid, label] = await this.topFilter.validateTopFilterExistence(top.key);

                expect(isValid).toBeTruthy();
                expect(label).toBe(top.label);
            })
        }
    }

    private topFilterValidateValues (topLabel: string, top: PageTopFilter) {
        let hasValidator = getValidator(top, 'validate', 'value');

        if (hasValidator) {
            it(`Validating the values of the "${topLabel}"`, async () => {
                let [isValid, value] = await this.topFilter.validateTopFilterValue(top.key);

                expect(isValid).toBeTruthy();
                expect(value).toBe(top.value);
            })
        }
    }

    private topFilterValidateUrls (topLabel: string, top: PageTopFilter) {
        let hasValidator = getValidator(top, 'validate', 'url');

        if (hasValidator && top.url !== undefined) {
            it(`Validating the urls of the "${topLabel}"`, async () => {
                let url = await this.topFilter.validateTopFilterUrl(top.key);

                expect(url).toBe(top.url as string);
            })
        }
    }

    private topFilterHandleAction (topLabel: string, top: PageTopFilter, action: PageTopFilterAction) {
        it(`(${action.action}) New action item to "${topLabel}"`, async () => {
            switch (action.action) {
                case 'set-select-filter': 
                    let [newValueText, newValue] = await this.topFilter.handleSetSelectFilter(top, action);
                    let [isValid, label, valueText] = await this.topFilter.validateTopFilterExistence(top.key);
                    let [isValidValue, value] = await this.topFilter.validateTopFilterValue(top.key);
                    let url = await this.topFilter.validateTopFilterUrl(top.key);

                    expect(newValueText).not.toBeUndefined()
                    expect(newValue).not.toBeUndefined()
                    expect(value).toBe(newValue)
                    expect(url).toBe(newValue)
                    
                    action.multiSelect
                        ? expect(newValueText).toContain(valueText)
                        : expect(newValueText).toBe(valueText)                        
                    break;
                case 'set-datepicker-filter':
                    let [nvt, nv] = await this.topFilter.handleSetDatepickerFilter(top, action);
                    let [isValidDp, labelDp, valueTextDp] = await this.topFilter.validateTopFilterExistence(top.key);
                    let [isValidValueDp, valueDp] = await this.topFilter.validateTopFilterValue(top.key);
                    let urlDp = await this.topFilter.validateTopFilterUrl(top.key);

                    expect(nvt).not.toBeUndefined()
                    expect(nv).not.toBeUndefined()
                    expect(valueDp).toBe(nv)
                    expect(urlDp).toBe(nv)   
                    expect(nvt).toBe(valueTextDp)                 
                    break;
            }

            await this.cacheItems('topFilters')
            
            for (let validate of action.validate) {
                switch (validate.isWidget) {
                    case false:
                        let top = this.cache.reserve.topFilters.find((top) => top.key === validate.key);

                        if (top) {
                            let [isValid, label, valueText] = await this.topFilter.validateTopFilterExistence(top.key);
                            let [isValidValue, value] = await this.topFilter.validateTopFilterValue(top.key);
                            let url = await this.topFilter.validateTopFilterUrl(top.key);
                                                        
                            expect(top.valueText).toContain(valueText as string)
                            expect(top.value).toBe(value)
                            expect(top.url).toBe(url as string)
                        }
                        break;
                    case true:
                        break;
                }
            }
        })
    }

    private kpiValidateExistence() {
        let existence = getValidator(this.page, 'kpis.validate', 'existence');

        if (existence) {
            it('Validating the existence of the KPIs', async () => {
                let kpis = this.page.kpis.items;
                let kpiItems = await this.getKpiItems()
                let kpiTitles = kpiItems.map((kpi) => kpi.title);

                for (let pKpi of kpis) {
                    expect(kpiTitles).toContain(pKpi);
                }
            })
        }
    }

    private kpiValidateUnits() {
        let units = getValidator(this.page, 'kpis.validate', 'units');
        
        if (units) {
            it('Validating the compare units of the KPIs', async () => {
                let kpis = this.page.kpis.items;
                let kpiItems = await this.getKpiItems()
                let { reserve: { topFilters }} = await this.getCache();
                let compareYears = (topFilters.find((top) => top.key === 'compareYears')?.value as string || '').split(',');
                
                for (let pKpi of kpis) {
                    let kpi = kpiItems.find((kpi) => kpi.title === pKpi);

                    if (kpi) {
                        for (let unit of kpi.units) {
                            expect(compareYears).toContain(unit)
                        }
                    }
                }
            })
        }
    }

    private widgetValidateExistence (widget: PageWidget) {
        let existence = getValidator(this.page.widgets, 'validate', 'existence');

        if (existence) {
            describe(`Validating the existence of the "${widget.title}"`, () => {
                it('Checking the existence of the widget', async () => {
                    await this.widgets.goToWidget(widget.key);

                    let [exists, title] = await this.widgets.validateWidgetExistence(widget.key);

                    expect(exists).toBeTruthy();
                    expect(title).toBe(widget.title);
                    
                })
            })
        }
    }

    private widgetValidateWidgetLogs (widget: PageWidget) {
        let log = getValidator(this.page.widgets, 'validate', 'log');

        if (log) {
            describe(`Validating the logs of the "${widget.title}"`, () => {
                it('Checking the logs of the widget', async () => {
                    let logs = await this.getBrowserLogs();
                    let isValid = this.widgets.validateWidgetConsoleLogs(logs, widget);

                    expect(isValid).toBeTruthy();
                })
            })
        }
    }

    private widgetValidateFilters (widget: PageWidget) {
        let filters = getValidator(this.page.widgets, 'validate', 'filters');

        if (filters) {
            describe(`Validating the filters of the "${widget.title}"`, () => {
                for (let filter of widget.filters) {
                    describe(`Validating & Handling action of the filter "${filter.key}"`, () => {
                        it('Checking the existence of the filter', async () => {
                            let { reserve: { widgets }} = await this.getCache()
                            let widgetCache = widgets.find((item) => item.widget === widget.key);
                            let filterCache = widgetCache?.filters.find((filter) => filter.key === filter.key)
                                                        
                            if (widgetCache && filterCache) {
                                let [exists, label, valueText] = await this.widgets.validateWidgetFilterExistence(widget.key, filter.key);

                                expect(exists).toBeTruthy();
                                expect(label).toContain(filterCache.title);
                                expect(valueText).toContain(filterCache.valueText);
                            }
                        })

                        it(`Handling the actions of the filter "${filter.key}"`, async () => {
                            let modalWrapper = await this.widgets.openModalWrapper(widget.key, filter.key);
                            await new Promise((resolve) => setTimeout(resolve, 500));

                            for (let action of filter.actions) {
                                switch (action.action) {
                                    case 'set-select-filter': 
                                        await this.widgets.openSelectorInModal(modalWrapper, action) 
                                        let [label, value] = await this.widgets.selectActionItemInSelector(modalWrapper, action)

                                        console.log(label, value, action);
                                        
                                        break;
                                }
                            }
                        })
                    })
                }
            })
        }
    }
}

export default PageHandler;