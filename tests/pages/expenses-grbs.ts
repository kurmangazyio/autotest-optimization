import { Page } from '../types';

const page: Page = {
    title: 'Sample => ГРБС',
    url: 'expenses/ppp',
    urlParams: [],

    requests: {
        timeForRequestLoading: 20000,
        requests: [

        ],
        validate: [
            'log',
            'status',
            'existence'
        ]
    },

    topFilters: {
        items: [
            {
                key: "currentUnit",
                type: "select",
                label: "Единицы измерения:",
                value: "0",
                url: "0",
                validate: ['label', 'value', 'url']
            },
        ],
        actions: [
            {
                key: 'currentUnit',
                action: 'set-select-filter',
                selectIndex: 2,
                multiSelect: false,
                waitTime: 2000,
                validate: []                
            }
        ]
    },

    kpis: {
        items: [],
        validate: []
    },

    widgets: {
        items: [],
        validate: []
    }
}

export default page;