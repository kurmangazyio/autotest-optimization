import { WebDriver, By, WebElement } from "selenium-webdriver";
import { Page, ReserveItemValue, TopFilterDatepickerAction, TopFilterSelectAction } from "../types";
import { getDriverUrlParams } from "./helpers";

type TopFilter = Page['topFilters']['items'][0];

const monthMapper: Record<string, string> = {
    'Янв': '01',
    'Фев': '02',
    'Мар': '03',
    'Апр': '04',
    'Май': '05',
    'Июн': '06',
    'Июл': '07',
    'Авг': '08',
    'Сен': '09',
    'Окт': '10',
    'Ноя': '11',
    'Дек': '12',
}

class TopFilterActionHandler {
    constructor (private driver: WebDriver) {
        this.driver = driver;

        if (!this.driver) throw new Error('Driver is not defined');
    }

    async validateTopFilterExistence (top: string): Promise<[boolean, string | undefined, string | undefined]> {
        let filter = await this.getTopFilter(top);
        if (!filter) return [false, undefined, undefined];
        return [true, await filter.getAttribute('test-label'), await filter.getAttribute('test-value-text')]
    }

    async validateTopFilterValue (top: string): Promise<[boolean, string | undefined]> {
        let filter = await this.getTopFilter(top);
        if (!filter) return [false, undefined];
        return [true, await filter.getAttribute('test-value')]
    }

    async validateTopFilterUrl (top: string): Promise<string | undefined> {
        let params = await getDriverUrlParams(this.driver)
        return params[top] || undefined;
    }

    async getTopFilter (top: string): Promise<WebElement> {
        return await this.driver.findElement(By.css(`.header-filter [test-key="${top}"]`))
    }

    async getTopFiltersCache (): Promise<Array<ReserveItemValue>> {
        let filters = await this.driver.findElements(By.css('.header-filter [test-key]'));
        let result: Array<ReserveItemValue> = [];
        let params = await getDriverUrlParams(this.driver)
        
        for (let filter of filters) {
            let key = await filter.getAttribute('test-key');
            let label = await filter.getAttribute('test-label');
            let value = await filter.getAttribute('test-value');
            let valueText = await filter.getAttribute('test-value-text');

            result.push({ 
                key, 
                label, 
                value,
                valueText,
                url: params[key] || null
            })
        }

        return result
    }

    async handleSetSelectFilter (top: TopFilter, action: TopFilterSelectAction): Promise<[string | undefined, string | undefined]> {
        let filter = await this.getTopFilter(top.key);

        if (filter) {
            let block = await filter.findElement(By.css('.custom-select-component__preview-text-block'));
            await this.driver.executeScript('arguments[0].scrollIntoView()', block);
            await this.driver.executeScript('arguments[0].click()', block);
            await new Promise(resolve => setTimeout(resolve, 1000));

            let selectOptions = await filter.findElements(By.css('.custom-select-component__option'));

            const handleOption = async (options: WebElement[], index: number): Promise<[string | undefined, string | undefined]> => {
                let option = options[index];
                let text = await option.getAttribute('select-text');
                let value = await option.getAttribute('select-value');

                await this.driver.executeScript('arguments[0].click()', option);
                await new Promise(resolve => setTimeout(resolve, 1000));

                if (action.closeOverlay) {
                    let overlay = filter.findElement(By.css('.custom-select-component__overlay'));
                    await this.driver.executeScript('arguments[0].click()', overlay);
                }
                
                await new Promise(resolve => setTimeout(resolve, action.waitTime));

                if (action.multiSelect) {
                    let value = await filter.getAttribute('test-value');
                    let valueText = await filter.getAttribute('test-value-text');

                    return [valueText, value];
                }

                return [text, value];
            }

            for (let i = 0; i < selectOptions.length; i++) {
                if (i === action.selectIndex) {
                    return await handleOption(selectOptions, i);
                }

                if (action.selectIndex === 'first' && i === 0) {
                    return await handleOption(selectOptions, i);
                }

                if (action.selectIndex === 'last' && i === selectOptions.length - 1) {
                    return await handleOption(selectOptions, i);
                }
            }

            if (action.selectIndex === 'random') {
                let randomIndex = Math.floor(Math.random() * selectOptions.length);
                return await handleOption(selectOptions, randomIndex);
            }
        }

        return [undefined, undefined];
    }

    async handleSetDatepickerFilter (top: TopFilter, action: TopFilterDatepickerAction): Promise<[string | undefined, string | undefined]> {
        let filter = await this.getTopFilter(top.key);

        if (filter) {
            let valueText = ''
            let value = ''
            let datepicker = await filter.findElement(By.css('.vuejs3-datepicker__value'))

            await this.driver.executeScript('arguments[0].scrollIntoView()', datepicker);
            await this.driver.executeScript('arguments[0].click()', datepicker);
            await new Promise(resolve => setTimeout(resolve, 1000));

            for (let pick of action.picker) {
                switch (pick.action) {
                    case 'prev':
                        let prevButton = await filter.findElement(By.css(`.vuejs3-datepicker__calendar .prev`))
                        await this.driver.executeScript('arguments[0].click()', prevButton);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        break;
                    case 'next':
                        let nextButton = await filter.findElement(By.css(`.vuejs3-datepicker__calendar .next`))
                        await this.driver.executeScript('arguments[0].click()', nextButton);
                        await new Promise(resolve => setTimeout(resolve, 500));
                        break;
                    case 'select':
                        let datepickerItems = await filter.findElements(By.css(`.vuejs3-datepicker__calendar .cell`))
                        
                        for (let i = 0; i < datepickerItems.length; i++) {
                            let dateValue = await datepickerItems[i].getText();
                            
                            if (dateValue === pick.select_date_index) {
                                let item = datepickerItems[i];
                                let dateContent = await filter.findElement(By.css('.day__month_btn')).getText();
                                let [month, year] = dateContent.split('. ');

                                valueText = `${pick.select_date_index.length === 1 ? '0' + pick.select_date_index : pick.select_date_index}.${monthMapper[month]}.${year}`
                                value = `${year}-${monthMapper[month]}-${pick.select_date_index.length === 1 ? '0' + pick.select_date_index : pick.select_date_index}`

                                await this.driver.executeScript('arguments[0].click()', item);
                                await new Promise(resolve => setTimeout(resolve, 1000));
                            }
                        }
                        break;
                }
            }

            await new Promise(resolve => setTimeout(resolve, action.waitTime));
            return [valueText, value];
        }

        return [undefined, undefined];
    }
}

export default TopFilterActionHandler;