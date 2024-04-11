import type { Entry } from "selenium-webdriver/lib/logging";
import { configuration as _config } from "../data";
import { BrowserRequest } from "../types";

class ValidateHandler {
    // requests
    validateRequestsExistence (requests: Array<BrowserRequest>, toValidate: Array<string>) {   
        if (toValidate.length === 0) return true;
        
        let requestLinks: Array<string> = requests.map((item) => item.url);     
        return toValidate.every((item) => requestLinks.includes(item));
    }

    validateRequestsStatuses (requests: Array<BrowserRequest>) {
        let statuses = Array.from(new Set(requests.map((item) => item.status)));

        return statuses
            .filter((item) => item !== 200)
            .length === 0;
    }
    
    validateRequestsConsoleLogs (logs: Array<Entry>) {
        return !logs
            .reduce((acc: boolean[], log) => [...acc, log.message.includes('400 (Bad Request)') ? true : false], [])
            .includes(true)
    }
}

export default ValidateHandler 