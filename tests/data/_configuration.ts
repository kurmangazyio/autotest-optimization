import { Configuration } from '../types'

const configuration : Configuration = {
    baseUrl: 'http://localhost:5173/#/',
    requestPrefixes: 'http://srv-am-dsb:81/rpc/',

    defaults: {
        date: '2023-09-30',
    }
}

export default configuration