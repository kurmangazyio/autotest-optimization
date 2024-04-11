import { WebDriver } from "selenium-webdriver";

export default async (driver: WebDriver): Promise<Record<string, string>> => {
    let url = await driver.getCurrentUrl();
    let params = url.split('?')
    
    return (params.length > 1 ? params[1] : '')
        .split('&')
        .reduce((acc: Record<string, string>, params) => {
            let [key, value] = params.split('=');
            acc[key] = value;
            return acc;
        }, {})
}