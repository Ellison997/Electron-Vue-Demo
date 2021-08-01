import request from '@/utils/request'

export function checkUpdate() {
    return request({
        url: '/psoftware/checkUpdate?type=1',
        method: 'get'
    })
}

export function getList(params) {
    return request({
        url: '/table/list',
        method: 'get',
        params
    })
}

export function checkSoftSerial(params) {
    return request({
        url: '/pclient/check',
        method: 'get',
        params
    })
}