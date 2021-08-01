import path from 'path'
import fs from 'fs'

import {
    EventEmitter
} from 'events';

let event = new EventEmitter();

let basePath = ''
switch (process.env.NODE_ENV) {
    case 'development':
        console.log('开发环境')
        basePath = __static
        break
    case 'production':
        console.log('生产环境')
        basePath = process.resourcesPath + '/static' // 生产环境
        break
}


let bandlist = JSON.parse(fs.readFileSync(path.join(basePath, '/band.json')));
let bandDivisor = JSON.parse(fs.readFileSync(path.join(basePath, '/bandDivisor.json')));
console.log('频段个数：', bandlist.length)

event.on('restart_band', async function() {
    console.log('restart_band 事件触发');

});

export function disposeListData(arg) {
    let sweepTime;
    let isOverload;

    let total = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0],
    ];
    try {
        let safetyArr = arg.split(",");

        let info = safetyArr.slice(0, 10);
        let listTemp = safetyArr.slice(10, safetyArr.length - 1);

        // console.log("频谱信息", info);
        console.log("原始频谱长度", listTemp.length);
        console.log("扫描时间：", Number(info[1]) + 50, new Date());

        let fmin = Number(info[4]) / 1000;
        let rbw = Number(info[5]) * 2;
        sweepTime = Number(info[1])
        isOverload = info[8]

        let cd = [];

        for (let index = 0; index < listTemp.length; index++) {
            // RBW 为1MB 的时候
            let arr = new Array(2);
            arr[1] = Number(listTemp[index]);

            arr[0] = fmin + (index * rbw) / 1000 / 1000 / 2;
            cd.push(arr);
        }
        console.log("数据长度", cd.length, cd[0][0], cd[cd.length - 1][0]);


        //-------------------------
        for (const b of bandlist) {
            // 初始化数据
            b.tot = 0;
            b.cc = 0;
            b.sum = 0;
            b.mvm1 = 0;
            b.mvm2 = 0;
            b.mWcm2 = 0;
            b.mWcm21 = 0;

            let wm2Sum = 0;
            let vm2Sum = 0;
            // 循环数据
            for (const a of cd) {
                if (b.start < a[0] && a[0] <= b.end) {
                    b.sum += Math.pow(10, Number(a[1]) / 10); // 10的频点电平次方累加

                    b.cc++; // 频点个数累加

                    let dbuV_m = a[1] + 107 + AF(a[0]); // 单频点电平值 加107 加天线因子校准
                    let uV_m = Math.pow(10, dbuV_m / 20); // 单位转化 为uV/m
                    let V_m = uV_m / (1000 * 1000); // 单位转化   单位转化为 V/m

                    let Wm2 = (V_m * V_m) / (120 * 3.1415926); // 单位转化为 W/m²

                    wm2Sum += Wm2;
                    vm2Sum += V_m * V_m;

                    // 分频点区间  计算频点 ∑  之后频段累加
                    if (a[0] < 3000) {
                        let tot = (V_m * V_m) / (12 * 12);
                        b.tot += tot;
                    } else {
                        let tot = (V_m * V_m) / (0.22 * 0.22 * a[0]);
                        b.tot += tot;
                    }
                }
            }

            let ret1 =
                (b.sum * (b.end * 1000000 - b.start * 1000000)) / (rbw * b.cc);
            let dBmW = 10 * Math.log10(ret1); // 10 的对数
            let dbuV_m = dBmW + 107 + AF(b.start);
            let uV_m = Math.pow(10, dbuV_m / 20);

            // 积分功率密度
            b.mWcm21 = (
                (((uV_m / 1000000) * (uV_m / 1000000)) / (120 * 3.1415926)) *
                1000
            ).toFixed(6);
            // 相加功率密度
            b.mWcm2 = (wm2Sum * 1000).toFixed(6);

            // 功率相加综合场强
            b.mvm2 = Number((Math.sqrt(vm2Sum) * 1000).toFixed(3));
            // 积分方式综合场强
            b.mvm1 = (uV_m / 1000).toFixed(3);

            b.tot = Number(b.tot).toFixed(8);
        }
        // ----------- 计算总 -------------------------

        // 功率相加 总场强值
        let mWcm2Arr = bandlist.map((i) => i.mWcm2);
        // 除于1000 转成w/m2
        total[0][0] = Number(
            (
                Math.sqrt(
                    (Number(eval(mWcm2Arr.join("+"))) / 1000) * (120 * 3.1415926)
                ) * 1000
            ).toFixed(3)
        );

        // 积分方式总场强值
        let mWcm21Arr = bandlist.map((i) => i.mWcm21);
        // 除于1000 转成w/m2
        total[0][1] = Number(
            (
                Math.sqrt(
                    (Number(eval(mWcm21Arr.join("+"))) / 1000) * (120 * 3.1415926)
                ) * 1000
            ).toFixed(3)
        );

        // 总功率密度
        total[0][2] = Number(eval(mWcm2Arr.join("+")).toFixed(6));
        total[0][3] = Number(eval(mWcm21Arr.join("+")).toFixed(6));

        let totArr = bandlist.map((i) => i.tot);
        // 总国标评价
        total[0][4] = Number(eval(totArr.join("+")).toFixed(8));

        // --------- 计算全频带综合场强与功率密度--------------
        for (const bd of bandDivisor) {
            bd.cc = 0;
            bd.sum = 0;

            bd.mWcm2 = 0;
            bd.mWcm21 = 0;
            let wm2Sum = 0;

            for (const a of cd) {
                if (bd.start <= a[0] && a[0] < bd.end) {
                    bd.sum += Math.pow(10, Number(a[1]) / 10);
                    bd.cc++;
                    let dbuV_m = a[1] + 107 + AF(a[0]); // 单频点电平值 加107 加天线因子校准
                    let uV_m = Math.pow(10, dbuV_m / 20); // 单位转化 为uV/m
                    let V_m = uV_m / (1000 * 1000); // 单位转化   单位转化为 V/m

                    let Wm2 = (V_m * V_m) / (120 * 3.1415926); // 单位转化为 W/m²

                    wm2Sum += Wm2;
                }
            }
            let ret1 =
                (bd.sum * (bd.end * 1000000 - bd.start * 1000000)) /
                (rbw * bd.cc);
            let dBmW = 10 * Math.log10(ret1);
            let dbuV_m = dBmW + 107 + AF(bd.start);
            let uV_m = Math.pow(10, dbuV_m / 20);

            // 积分功率密度
            bd.mWcm21 = (
                (((uV_m / 1000000) * (uV_m / 1000000)) / (120 * 3.1415926)) *
                1000
            ).toFixed(6);
            // 相加功率密度
            bd.mWcm2 = (wm2Sum * 1000).toFixed(6);
        }
        // 功率相加 总场强值
        let mWcm2ArrAll = bandDivisor.map((i) => i.mWcm2);
        // 除于1000 转成w/m2
        total[1][0] = Number(
            (
                Math.sqrt(
                    (Number(eval(mWcm2ArrAll.join("+"))) / 1000) * (120 * 3.1415926)
                ) * 1000
            ).toFixed(3)
        );

        // 积分方式总场强值
        let mWcm21ArrAll = bandDivisor.map((i) => i.mWcm21);
        // console.log(mWcm21ArrAll);

        // 除于1000 转成w/m2
        total[1][1] = Number(
            (
                Math.sqrt(
                    (Number(eval(mWcm21ArrAll.join("+"))) / 1000) * (120 * 3.1415926)
                ) * 1000
            ).toFixed(3)
        );

        // 总功率密度
        total[1][2] = Number(eval(mWcm2ArrAll.join("+")).toFixed(6));
        total[1][3] = Number(eval(mWcm21ArrAll.join("+")).toFixed(6));

    } catch (error) {
        console.log('频谱数据错误：', error)
    }

    return JSON.stringify({
        sweepTime,
        isOverload,
        bandlist,
        total
    })
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