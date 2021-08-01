/**
 * Created by jiachenpan on 16/11/18.
 */

export function parseTime(time, cFormat) {
    if (arguments.length === 0) {
        return null
    }
    const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
    let date
    if (typeof time === 'object') {
        date = time
    } else {
        if (('' + time).length === 10) time = parseInt(time) * 1000
        date = new Date(time)
    }
    const formatObj = {
        y: date.getFullYear(),
        m: date.getMonth() + 1,
        d: date.getDate(),
        h: date.getHours(),
        i: date.getMinutes(),
        s: date.getSeconds(),
        a: date.getDay()
    }
    const time_str = format.replace(/{(y|m|d|h|i|s|a)+}/g, (result, key) => {
        let value = formatObj[key]
        if (key === 'a') return ['一', '二', '三', '四', '五', '六', '日'][value - 1]
        if (result.length > 0 && value < 10) {
            value = '0' + value
        }
        return value || 0
    })
    return time_str
}

export function formatTime(time, option) {
    time = +time * 1000
    const d = new Date(time)
    const now = Date.now()

    const diff = (now - d) / 1000

    if (diff < 30) {
        return '刚刚'
    } else if (diff < 3600) { // less 1 hour
        return Math.ceil(diff / 60) + '分钟前'
    } else if (diff < 3600 * 24) {
        return Math.ceil(diff / 3600) + '小时前'
    } else if (diff < 3600 * 24 * 2) {
        return '1天前'
    }
    if (option) {
        return parseTime(time, option)
    } else {
        return d.getMonth() + 1 + '月' + d.getDate() + '日' + d.getHours() + '时' + d.getMinutes() + '分'
    }
}
export function AF(x) {
    let arr = [0, 0]
    if (x <= 420) {
        arr = [43, 43, 0, 420];
        // return 56.07
    } else if (x <= 600) {
        arr = [43, 53.78, 420, 600];
    } else if (x <= 750) {
        arr = [53.78, 52.74, 600, 750];
    } else if (x <= 900) {
        arr = [52.74, 50.65, 750, 900];
    } else if (x <= 1000) {
        arr = [50.65, 49.99, 900, 1000];
    } else if (x <= 1200) {
        arr = [49.99, 48.3, 1000, 1200];
    } else if (x <= 1400) {
        arr = [48.3, 45.86, 1200, 1400];
    } else if (x <= 1600) {
        arr = [45.86, 43.95, 1400, 1600];
    } else if (x <= 1800) {
        arr = [43.95, 43.06, 1600, 1800];
    } else if (x <= 2000) {
        arr = [43.06, 43.03, 1800, 2000]
    } else if (x <= 2200) {
        arr = [43.03, 44.11, 2000, 2200];
    } else if (x <= 2450) {
        arr = [44.11, 45.28, 2200, 2450];
    } else if (x <= 2700) {
        arr = [45.28, 45.52, 2450, 2700];
    } else if (x <= 3000) {
        arr = [45.52, 47.62, 2700, 3000];
    } else if (x <= 3500) {
        arr = [47.62, 48.47, 3000, 3500];
    } else if (x <= 4000) {
        arr = [48.47, 48.71, 3500, 4000];
    } else if (x <= 4500) {
        arr = [48.71, 49.43, 4000, 4500];
    } else if (x <= 5000) {
        arr = [49.43, 50.5, 4500, 5000];
    } else if (x <= 5500) {
        arr = [50.5, 51.62, 5000, 5500];
    } else if (x <= 5800) {
        arr = [51.62, 52.87, 5500, 5800];
    } else if (x <= 6000) {
        arr = [52.87, 53.84, 5800, 6000];
    }
    return arr[0] + (x - arr[2]) * ((arr[1] - arr[0]) / (arr[3] - arr[2]))
}




export function unitConversion(num, unit) {
    num = Number(num);
    let numLength;
    switch (unit) {
        case 'V/m':
            numLength = (num.toString().indexOf('.') != -1) ? num.toString().split(".")[0].length : 0;
            if (numLength > 3) {
                num = (num / 1000).toFixed(6) + ' V/m'
            } else {
                num = num.toFixed(6) + ' mV/m'
            }
            break;
        case 'KHz':
            numLength = num.toString().length;
            if (numLength > 6) {
                num = (num / 1000000).toFixed(2) + 'MHz'
            } else if (numLength > 3) {
                num = (num / 1000).toFixed(2) + 'KHz'
            } else {
                num = num.toFixed(2) + 'Hz'
            }
            break;

        default:
            break;
    }


    return num
}