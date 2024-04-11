import { WebDriver, By, WebElement } from "selenium-webdriver";
import { Page, PageWidget, PageWidgetFilterSelectAction, ReserveWidgetItemValue } from "../types";
import { getDriverUrlParams } from "./helpers";
import { Entry } from "selenium-webdriver/lib/logging";

class WidgetActionHandler {
    constructor (private driver: WebDriver) {
        this.driver = driver;

        if (!this.driver) throw new Error('Driver is not defined');
    }

    async getWidgetsCache (): Promise<Array<ReserveWidgetItemValue>> {
        let result: Array<ReserveWidgetItemValue> = [];
        let logs = await this.driver.manage().logs().get('browser');

        logs = logs
            .filter((log) => log.level.name_ === 'INFO')
            .filter((log) => log.message.includes('widgetParams'))

        logs.forEach((log, index) => {
            let line = log.message.split(' ')
            let [source_tow, json] = log.message.split(`${line[1]} `)

            result.push(JSON.parse(JSON.parse(json)) as ReserveWidgetItemValue);
        })
        
        return result
    }

    async validateWidgetExistence (widget: string): Promise<[boolean, string]> {
        let widgetElement = await this.driver.findElement(By.xpath(`//article[@widget-key="${widget}"]`));
        let widgetTitle = await widgetElement.findElement(By.xpath('.//h3[@class="card__header"]')).getText();
        return [widgetElement ? true : false, widgetTitle];
    }

    async validateWidgetConsoleLogs (logs: Array<Entry>, widget: PageWidget): Promise<boolean> {
        let widgetLogs = logs.filter(log => log.message.includes(widget.key));

        return widgetLogs.length === 0;
    }

    async validateWidgetFilterExistence (widget: string, filter: string): Promise<[boolean, string | undefined, string | undefined]> {
        let widgetElement = await this.driver.findElement(By.xpath(`//article[@widget-key="${widget}"]`));
        let filterElement = await widgetElement.findElement(By.css(`[test-block-name="${filter}"]`));

        if (filterElement) {
            let filterLabel = await filterElement.getAttribute('test-block-title')
            let filterValue = await filterElement.getAttribute('test-block-value')

            return [true, filterLabel, filterValue]
        }
        return [false, undefined, undefined]
    }

    async goToWidget (widget: string): Promise<void> {
        let widgetElement = await this.driver.findElement(By.xpath(`//article[@widget-key="${widget}"]`));
        await this.driver.executeScript('arguments[0].scrollIntoView()', widgetElement);
        await new Promise((resolve) => setTimeout(resolve, 500));
    }

    async openModalWrapper (widget: string, filter: string): Promise<WebElement> {
        let btn = await this.driver.findElement(By.css(`[widget-key="${widget}"] [test-modal-opener="btn"]`))
        await this.driver.actions().move({origin: btn})
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.driver.executeScript('arguments[0].click()', btn);

        return await this.driver.findElement(By.css(`[widget-key="${widget}"] [class="modal-wrapper"]`))
    }

    async openSelectorInModal (wrapper: WebElement, action: PageWidgetFilterSelectAction): Promise<void> {
        let item = await wrapper.findElement(By.css(`[test-label="${action.label}"] .custom-select-component__block`))
        await this.driver.executeScript('arguments[0].click()', item);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async selectActionItemInSelector (wrapper: WebElement, action: PageWidgetFilterSelectAction): Promise<[string | undefined, string | undefined]> {
        let selectOptions = await wrapper.findElements(By.css(`[test-label="${action.label}"] .custom-select-component__option`))
        let filter = await wrapper.findElement(By.css(`[test-label="${action.label}"]`))

        const handleOption = async (options: WebElement[], index: number): Promise<[string | undefined, string | undefined]> => {
            let option = options[index];
            let text = await option.getAttribute('select-text');
            let value = await option.getAttribute('select-value');

            await this.driver.executeScript('arguments[0].click()', option);
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (action.closeOverlay) {
                let overlay = wrapper.findElement(By.css(`[test-label="${action.label}"] .custom-select-component__overlay`));
                await this.driver.executeScript('arguments[0].click()', overlay);
            }
            
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
        
        return [undefined, undefined]
    }
}

export default WidgetActionHandler;