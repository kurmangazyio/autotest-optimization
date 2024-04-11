
export type TopFilterSelectActionValidationWidget = {
    key: string;
    isWidget: true;
    widget: string;
}

export type TopFilterSelectActionValidation = {
    key: string;
    isWidget: false;
}

export type TopFilterSelectAction = {
    key: string;
    action: 'set-select-filter';
    selectIndex: number | 'first' | 'last' | 'random';
    multiSelect: boolean;
    waitTime: number;
    closeOverlay?: boolean;

    validate: Array<TopFilterSelectActionValidationWidget | TopFilterSelectActionValidation>
}

export type TopFilterDatepickerAction = {
    key: string;
    action: 'set-datepicker-filter';
    picker: Array<{ action: 'next' | 'prev'} | { action: 'select', select_date_index: string }>;
    waitTime: number;
    validate: Array<TopFilterSelectActionValidationWidget | TopFilterSelectActionValidation>
}

export type PageTopFilters = {
    items: Array<{
        key: string;
        type: 'select' | 'datepicker';
        label: string;
        value: string;
        url?: string;
        validate: Array<'label' | 'value' | 'url'>
    }>;
    actions: Array<TopFilterSelectAction | TopFilterDatepickerAction>
}


export type BrowserRequest = {
    url: string;
    status: number;
}

export type ReserveItemValue = {
    key: string;
    label: string;
    valueText: string;
    value: unknown;
    url: string | null;
}

export type ReserveWidgetItemValue = ReserveItemValue & {
    widget: string;
    filters: Array<{
        key: string,
        title: string,
        valueText: string,
        value: unknown,
    }>
}

export type PageCache = {
    requests: Array<BrowserRequest>;
    reserve: {
        topFilters: Array<ReserveItemValue>;
        widgets: Array<ReserveWidgetItemValue>;
    }
}

export type PageKpi = {
    title: string;
    units: Array<string>;
}

export type PageWidgetFilterSelectAction = {
    action: 'set-select-filter';
    label: string;
    key: string;
    selectIndex: number | 'first' | 'last' | 'random';
    multiSelect: boolean;
    waitTime: number;
    closeOverlay?: boolean;
}

export type PageWidgetFilterDatePickerAction = {
    action: 'set-datepicker-filter';
    label: string;
    picker: Array<{ action: 'next' | 'prev'} | { action: 'select', select_date_index: string }>;
    waitTime: number;
    validate: Array<{
        widget: string;
        key: string;
    }>
}

export type PageWidgetFilter = {
    key: string;
    label: string;
    actions: Array<PageWidgetFilterSelectAction | PageWidgetFilterDatePickerAction>;
}

export type PageWidget = {
    key: string;
    title: string;

    filters: Array<PageWidgetFilter>;
}

export type Page = {
    title: string;
    url: string;
    urlParams: Array<{ key: string, value: string }>;

    requests: {
        timeForRequestLoading: number;
        requests: Array<string>;
        validate: Array<'existence' | 'log' | 'status'>
    }

    topFilters: PageTopFilters;

    kpis: {
        items: Array<string>;
        validate: Array<'existence' | 'units'>
    }

    widgets: {
        items: Array<PageWidget>,
        validate: Array<'existence' | 'log' | 'filters'>
    }
}