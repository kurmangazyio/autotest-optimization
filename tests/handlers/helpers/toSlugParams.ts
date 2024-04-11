import { Page } from "../../types";

export default (page: Page): string => {
    let params = '';
    
    page.urlParams.forEach((param) => {
        params += `${param.key}=${param.value}&`
    })
    
    page.topFilters.items.forEach((filter) => { 
        if (filter.url) {
            params += `${filter.key}=${filter.url}&`
        }
    })

    return params.slice(0, -1);
}