import { Builder, By, WebDriver, until } from 'selenium-webdriver';

export let driver: WebDriver;

export const quit = async (driver: WebDriver): Promise<void> => {
    await driver.quit();
}