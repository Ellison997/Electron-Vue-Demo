const fs = require('fs')
const bandlist = require("./band.json");
const bandDivisorList = require("./bandDivisor.json");

function AF(x) {
    if (x <= 420) {
        return 43;
        // return 56.07
    } else if (x <= 600) {
        return 53.78;
    } else if (x <= 750) {
        return 52.74;
    } else if (x <= 900) {
        return 50.65;
    } else if (x <= 1000) {
        return 49.99;
    } else if (x <= 1200) {
        return 48.3;
    } else if (x <= 1400) {
        return 45.86;
    } else if (x <= 1600) {
        return 43.95;
    } else if (x <= 1800) {
        return 43.06;
    } else if (x <= 2000) {
        return 43.03;
    } else if (x <= 2200) {
        return 44.11;
    } else if (x <= 2450) {
        return 45.28;
    } else if (x <= 2700) {
        return 45.52;
    } else if (x <= 3000) {
        return 47.62;
    } else if (x <= 3500) {
        return 48.47;
    } else if (x <= 4000) {
        return 48.71;
    } else if (x <= 4500) {
        return 49.43;
    } else if (x <= 5000) {
        return 50.5;
    } else if (x <= 5500) {
        return 51.62;
    } else if (x <= 5800) {
        return 52.87;
    } else if (x <= 6000) {
        return 53.84;
    }
}


fs.readFile('./48967138434pinpu.log', function(err, data) {
    if (err) {
        return console.error(err);
    }
    // console.log("异步读取文件数据: " + data.toString());

    let arg = data.toString();

    let cons = ["3000004500", "5999991000", "1000000", "OFF", "50000", "-28", "0;"];
    let sc = {
        fmin: 0,
        fmax: 0
    };
    sc.fmin = (Number(cons[0]) - Number(cons[1]) / 2) / 1000000;
    sc.fmax = (Number(cons[0]) + Number(cons[1]) / 2) / 1000000;

    let nRbw = Number(cons[2]);

    console.log("当前RBW", nRbw);
    console.log("sc", sc);

    let cd = [];

    let safetyArr = arg.split(",");
    let status = safetyArr.slice(safetyArr.length - 1);
    let info = safetyArr.slice(0, 10);
    let listTemp = safetyArr.slice(10, safetyArr.length - 1);
    // console.log("获取频谱状态：", status);
    // console.log("频谱信息", info);
    // console.log("原始频谱长度", listTemp.length);

    let totalNum = 0


    for (let index = 0; index < listTemp.length; index++) {
        // RBW 为1MB 的时候

        let arr = new Array(2);
        //arr[1] = (Number(listTemp[index]) * 1000000).toFixed(3);
        arr[1] = Number(listTemp[index]);

        arr[0] = sc.fmin + (index * nRbw) / 1000 / 1000 / 2;
        cd.push(arr);
    }
    console.log("数据长度", cd.length, cd[0][0], cd[cd.length - 1][0]);

    //-------------------------

    for (const bd of bandDivisorList) {
        bd.cc = 0;
        bd.sum = 0;
        for (const a of cd) {
            if (bd.start <= a[0] && a[0] < bd.end) {
                bd.sum += Math.pow(10, Number(a[1]) / 10);
                bd.cc++;
            }
        }

        let ret1 =
            (bd.sum * (bd.end * 1000000 - bd.start * 1000000)) / (nRbw * bd.cc);
        let dBmW = 10 * Math.log10(ret1);
        let dbuV_m = dBmW + 107 + AF(bd.start);
        let uV_m = Math.pow(10, dbuV_m / 20);
        totalNum += uV_m / 1000;
    }
    console.log('总场强', totalNum)


    for (const b of bandlist) {
        b.tot = 0;
        b.tot2 = 0;
        b.cc = 0;
        b.sum = 0;
        b.mvm = 0;
        b.mWcm2 = 0;

        for (const a of cd) {
            if (b.start <= a[0] && a[0] < b.end) {
                b.sum += Math.pow(10, Number(a[1]) / 10);

                b.cc++;

                let dbuV_m = a[1] + 107 + AF(a[0]); //   db��V/m
                let uV_m = Math.pow(10, dbuV_m / 20); //   ��V/m
                let V_m = uV_m / (1000 * 1000); //   V/m


                let Wm2 = (V_m * V_m) / (120 * 3.1415926);

                if (a[0] < 3000) {
                    let tot2 = Wm2 / 0.4;
                    b.tot2 += tot2;
                } else {
                    let tot2 = Wm2 / (a[0] / 7500.0);
                    b.tot2 += tot2;
                }

                if (a[0] < 3000) {
                    let tot = (V_m * V_m) / (12 * 12);
                    b.tot += tot;
                } else {
                    let tot = (V_m * V_m) / (0.22 * 0.22 * a[0]);
                    b.tot += tot;
                }
                /*
                if (a[0] > 825 && a[0] < 835) {
                    console.log(825 + '---' + a)
                }
                if (a[0] > 870 && a[0] < 880) {
                    console.log(870 + '---' + a)
                }
                */
            }
        }

        let ret1 =
            (b.sum * (b.end * 1000000 - b.start * 1000000)) / (nRbw * b.cc);
        let dBmW = 10 * Math.log10(ret1);
        let dbuV_m = dBmW + 107 + AF(b.start);
        let uV_m = Math.pow(10, dbuV_m / 20);
        b.mWcm2 = (
            (((uV_m / 1000000) * (uV_m / 1000000)) / (120 * 3.1415926)) *
            1000
        ).toFixed(6);



        b.mvm = (uV_m / 1000).toFixed(2);

        b.tot = Number(b.tot).toFixed(6);
        b.tot2 = Number(b.tot2).toFixed(6);

        if (b.start != 0) {
            b.totalPercent = (
                Number(b.mWcm2) / Number(b.limiting.slice(0, 3))
            ).toFixed(8);
        }
        console.log(b, dBmW, dbuV_m)
    }

    // this.total[0] = this.bandlist[0].mvm;
    // let totArr = this.bandlist.slice(1).map(i => i.tot);
    // let totArr2 = this.bandlist.slice(1).map(i => i.tot2);

    // this.total[1] = Number(eval(totArr.join("+"))).toFixed(6);
    // this.total[2] = Number(eval(totArr2.join("+"))).toFixed(6);

    // let mvmArr = this.bandlist.slice(1).map(i => Number(i.mvm));

    let tota = {
            "start": 0,
            "end": 6000,
            "sum": 0,
            "cc": 0,
            "tot": 0,
            "tot2": 0,
            "name": "ALL",
            "chName": "总场强值",
            "mvm": 0,
            "mWcm2": 0,
            "limiting": [
                "12V/m",
                "400mW/m²"
            ],
            "totalPercent": 0,
            "realTimeArr": [],
            "sixMinutesArr": []
        },


});