import { Page } from '../types';
import { configuration as _config } from '../data'

const longWaitTime = 20000;

const page: Page = {
    title: 'Расходы бюджета города Москвы => Главная',
    url: 'expenses',
    urlParams: [
        { key: 'autotests', value: 'on' }
    ],

    requests: {
        timeForRequestLoading: longWaitTime,
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
            {
                key: 'compareYears',
                type: 'select',
                label: 'Год сравнения:',
                value: '2022',
                url: '2022',
                validate: ['label', 'value', 'url']
            },
            {
                key: 'date',
                type: 'datepicker',
                label: 'Дата:',
                value: _config.defaults.date,
                url: _config.defaults.date,
                validate: ['label', 'value', 'url']
            }
        ],
        actions: [
            /*
            {
                key: 'date',
                action: 'set-datepicker-filter',
                picker: [
                    { action: 'next' }, // 2023-10
                    { action: 'next' }, // 2023-11
                    { action: 'next' }, // 2023-12
                    { action: 'select', select_date_index: '31' }
                ],
                waitTime: longWaitTime,
                validate: [
                    {
                        key: 'date',
                        isWidget: false,
                    }
                ]
            },
            {
                key: 'compareYears',
                action: 'set-select-filter',
                selectIndex: 'random',
                multiSelect: true,
                waitTime: longWaitTime,
                closeOverlay: true,
                validate: [
                    {
                        key: 'compareYears',
                        isWidget: false,
                    }
                ]
            },
            {
                key: 'currentUnit',
                action: 'set-select-filter',
                selectIndex: 2,
                multiSelect: false,
                waitTime: 1000,
                validate: [
                    {
                        key: 'currentUnit',
                        isWidget: false,
                    }
                ]                
            },
            */
        ]
    },

    kpis: {
        items: [
            "Расходы",
            "Расходы без межбюджетных трансфертов",
            "Межбюджетные трансферты",
            "Расходы на закупку товаров, работ, услуг",
            "Бюджетные инвестиции",
            "Субсидии бюджетным и автономным учреждениям"
        ],
        validate: ['existence', 'units']
    },

    widgets: {
        items: [
            {
                key: "NewExpensesTable",
                title: "Исполнение бюджета по расходам",
                filters: [
                    {
                        key: 'grbsFilter',
                        label: 'ГРБС: ',
                        actions: [
                            {
                                action: 'set-select-filter',
                                key: 'grbsFilter',
                                label: 'ГРБС:',
                                selectIndex: 'random',
                                multiSelect: false,
                                waitTime: 1000
                            }
                        ]
                    }
                ]
            }
        ],
        validate: [
            'existence', 
            'log', 
            'filters'
        ]
    }
}

export default page;