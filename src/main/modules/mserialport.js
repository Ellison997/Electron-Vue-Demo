import SerialPort from 'serialport'
import fs from 'fs'
import {
    EventEmitter
} from 'events';
import path from 'path'

import { ipcMain, dialog, app, BrowserWindow, shell } from 'electron'
import xlsx from 'node-xlsx';
import moment from 'moment';
import { unitConversion, AF } from "../utils";

import { disposeListData } from "./dispose";

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



// 方均根方式

function MSerialPort() {

    let portPath = 'COM'
    let event = new EventEmitter();

    // 消息栈
    let commandStack = []


    let tempData = '';
    let resultDate = '';
    let resultArr = [];
    let commandArr = [];
    let resultMap = new Map()

    let open = null;
    let send = null;
    let syncSend = null;

    let isOpen = false;

    let port = null;

    let isDbmSpectrum = true;

    function mapToArrayJson(map) {
        return JSON.stringify([...map]);
    }


    //替换所有的回车换行  
    function TransferString(content) {
        var string = content;
        try {
            string = string.replace(/\r\n/g, ",")
            string = string.replace(/\n/g, ",");
        } catch (e) {
            alert(e.message);
        }
        return string;
    }


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // 通过main进程发送事件给renderer进程，提示更新信息
    function sendMessage(message, o) {
        global.mainWindow.webContents.send(message, o)
    }

    function createSerial() {
        console.log('需要打开的端口', portPath)
        port = new SerialPort(portPath, {
            baudRate: 115200,
            autoOpen: false,
            // dataBits: 8,
            hupcl: true,
            lock: false, //若为true ，则重插usb线，再次open时会出现access denied
            parity: 'none',
            rtscts: false,
            // stopBits: 1,
            xany: false,
            xoff: false,
            xon: false,
        })
        port.on('open', () => {
            console.log('端口打开 Port opened:\t', port.path)
        })


        // Open errors will be emitted as an error event
        port.on('error', function(err) {
            console.log('出现错误: ', err.message)

        })

        port.on('data', data => {
            let utf8Data = data.toString('utf8');
            // console.log('每次返回的数据长度：', utf8Data.length)

            if (utf8Data.indexOf(';') != -1) {
                let command = commandStack.shift()
                    // 如果返回的有 ； 号就拆分成多个,可能是多个命令同时返回的
                let utf8DataArr = utf8Data.split(';')
                utf8DataArr.pop()

                for (let rd in utf8DataArr) {
                    utf8DataArr[rd] += ';'
                }
                if (tempData == '') {
                    console.log(`返回的指令:${command},,,${utf8DataArr.length}`)
                    resultDate = utf8DataArr.toString()
                } else {
                    console.log(`返回的指令:${command},,,${(tempData + utf8DataArr.toString()).length}`)
                    resultDate = tempData + utf8DataArr.toString()
                    tempData = '';
                }
                if (command == 'SPECTRUM? ACT;' && isDbmSpectrum) {
                    // 频谱转列表，并携带频谱
                    console.log('频谱转列表，并携带频谱')
                    resultDate = disposeListData(resultDate)
                }

                // 统一返回
                sendMessage(command, resultDate);
                console.log(new Date())
                if (commandStack.length != 0) {
                    send(commandStack[0])
                }

            } else {
                tempData += utf8Data
            }

        })


        // 异步写数据
        send = function(data) {
            port.write(data, function(err) {
                if (err) {
                    console.log("mserialport.send 错误:");
                } else {
                    console.log(`写入${data}命令成功`)
                }
            })
        }

        open = function() {
            return new Promise((resolve, reject) => {
                port.open(function(err) {
                    if (err) {
                        console.log("mserialport.open 错误:", err);
                        reject(false);
                    } else {
                        console.log('打开方法执行成功');
                        resolve(true);
                    }
                })
            })
        }

    }

    event.on('port_open', async function() {
        console.log('port_open 事件触发');
        createSerial();
        try {
            isOpen = await open()
            setTimeout(function() {
                sendMessage("ALERT", {
                    type: 'success',
                    state: 1,
                    message: "欢迎使用5G智能监测，USB连接成功。"
                });
            }, 2000)
        } catch (error) {
            console.log(error)
        }
    });

    ipcMain.on('updateDataType', (event, arg = true) => {
        console.log('更新数据类型：', arg) // prints "ping"
        isDbmSpectrum = arg;

    })

    ipcMain.on('command', (event, arg = []) => {
        console.log('写入命令', arg) // prints "ping"
        if (isOpen) {
            commandArr = arg
            if (commandStack.length == 0 && commandArr.length != 0) {
                send(commandArr[0])
            }
            commandStack = commandStack.concat(commandArr)
        } else {
            console.log('设备没有连接！')
            sendMessage("ALERT", {
                type: 'error',
                state: 0,
                message: "设备没有连接！"
            });
        }
    })


    ipcMain.on('toexcel', (event, arg) => {
        console.log(arg)
        console.log('生成Excel') // prints "ping"
        let realTimeDatas = []
        let sixMinutesDatas = []
        let bandlist = arg.bandlist;
        let rtitle = ['时间', '总∑', '总场强'];
        let stitle = ['工况', '总∑', '总场强'];

        // 设置列宽度
        let colsWidthArr = [];

        for (const b in bandlist) {
            // title.push(bandlist[b].chName)
            if (b > 0) {
                rtitle = rtitle.concat([bandlist[b].chName + '场强', bandlist[b].chName + '占标比', bandlist[b].chName + '∑'])
                stitle = stitle.concat([bandlist[b].chName + '场强', bandlist[b].chName + '占标比', bandlist[b].chName + '∑'])
                colsWidthArr = colsWidthArr.concat([{ wch: 20 }, { wch: 20 }, { wch: 20 }])
            }
        }
        // title[1] = '总∑'
        realTimeDatas.push(rtitle)
        sixMinutesDatas.push(stitle)

        for (let index = 0; index < bandlist[0].realTimeArr.length; index++) {
            let realArrInner = [bandlist[0].realTimeArr[index][1]]

            for (const b in bandlist) {
                if (b == 0) {
                    realArrInner.push(bandlist[b].realTimeArr[index][0][1])
                    realArrInner.push(unitConversion(bandlist[b].realTimeArr[index][0][0], 'V/m'))
                } else {
                    let limit = Number(bandlist[b].limiting[0].substring(0, bandlist[b].limiting[0].length - 3))
                    let mvm = unitConversion(bandlist[b].realTimeArr[index][0][0], 'V/m')
                    let tot = bandlist[b].realTimeArr[index][0][1]
                    let ratio = (bandlist[b].realTimeArr[index][0][0] / (limit * 1000) * 100).toFixed(6)
                    realArrInner = realArrInner.concat([mvm, ratio + '%', tot])
                }
            }
            // realArrInner[1] = realArrInner[1].split(',')[1]
            realTimeDatas.push(realArrInner)

        }
        console.log(bandlist[0].timeArr.length, arg.n, arg.standardTime, arg.n - arg.standardTime)
        let number = 100 / (arg.n - arg.standardTime)
        for (let index = 0; index <= arg.n - arg.standardTime; index++) {
            let itemNum = 100 - index * number;
            let sixMinuArrInner = [(itemNum > 0 ? itemNum.toFixed(3) : 0) + '%']
            for (const b in bandlist) {
                if (b == 0) {
                    sixMinuArrInner.push(bandlist[b].sixMinutesArr[index][1])
                    sixMinuArrInner.push(unitConversion(bandlist[b].sixMinutesArr[index][0], "V/m"))
                } else {
                    let limit = Number(bandlist[b].limiting[0].substring(0, bandlist[b].limiting[0].length - 3))
                    let mvm = unitConversion(bandlist[b].sixMinutesArr[index][0], "V/m")
                    let tot = bandlist[b].sixMinutesArr[index][1]
                    let ratio = (bandlist[b].sixMinutesArr[index][0] / (limit * 1000) * 100).toFixed(6)
                    sixMinuArrInner = sixMinuArrInner.concat([mvm, ratio + '%', tot])
                }
            }

            sixMinutesDatas.push(sixMinuArrInner)
        }
        let realOptions = { '!cols': [{ wch: 20 }, { wch: 12 }, { wch: 20 }] };
        let sixOptions = { '!cols': [{ wch: 6 }, { wch: 12 }, { wch: 20 }] };
        realOptions['!cols'] = realOptions['!cols'].concat(colsWidthArr)
        sixOptions['!cols'] = sixOptions['!cols'].concat(colsWidthArr)
        let buffer = xlsx.build([{
            name: '实时值',
            data: realTimeDatas,
            options: realOptions
        }, {
            name: '六分钟均值',
            data: sixMinutesDatas,
            options: sixOptions
        }]);

        let time = moment().locale('zh-cn').format('YYYYMMDD&&HHmmss')

        let excelPath = path.join(basePath, "/data/" + time + ".xlsx")
        fs.writeFileSync(excelPath, buffer, {
            'flag': 'w'
        });

    })

    SerialPort.list().then(ports => {
        console.log(moment().locale('zh-cn').format('YYYY-MM-DD HH:mm:ss'))
            // 假设选择第一个串口实例化
        console.log('串口个数：', ports)

        let index = ports.findIndex(port => {
            return port.manufacturer == 'Narda'
        })
        if (index == -1) {

            setTimeout(function() {
                sendMessage("ALERT", {
                    type: 'error',
                    state: 0,
                    message: "USB连接失败，请检查USB线是否连接！"
                });
            }, 2000)
        } else {
            ports.forEach(port => { //FTDI
                if (port.manufacturer == 'Narda') {
                    portPath = port.path
                    event.emit('port_open');
                }
            });
        }

    }).catch(err => console.log(err))

}

export default MSerialPort;