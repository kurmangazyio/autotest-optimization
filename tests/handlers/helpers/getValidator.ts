import { Page, PageWidget } from "../../types";

export default (page: Page | Page['topFilters']['items'][0] | Page['widgets'], path: string, value: string): boolean => {
    let validateItem: any = { ...page }
    path.split('.').map((item) => { validateItem = validateItem[item] });
        
    return validateItem.includes(value);
}