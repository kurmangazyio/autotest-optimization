import { WebDriver, By } from "selenium-webdriver";
import { PageKpi } from "../types";

class StepHandler {
    private driver: WebDriver;

    constructor (driver: WebDriver) {
        this.driver = driver;

        if (!this.driver) {
            throw new Error('Driver not found');
        }
    }

    async runDriver (url: string) {
        await this.driver.get(url);
    }

    async waitForSomeTime (time: number) {
        await new Promise(resolve => setTimeout(resolve, time));
    }

    async getPageKpiItems (): Promise<Array<PageKpi>> {
        let kpis: Array<PageKpi> = [];
        let smallKpis = await this.driver.findElements(By.css('.small-kpi'))

        for (let kpi of smallKpis) {
            let units: Array<string> = [];
            let title = await kpi.findElement(By.css('.small-kpi__title')).getText();
            let unitItems = await kpi.findElements(By.css('.ps-1'))

            for (let unitItem of unitItems) {
                units.push((await unitItem.getText()).replace('к ', ''))
            }

            kpis.push({ title, units })
        }

        return kpis;
    }
}

export default StepHandler;
