import { ipcMain, dialog, app, BrowserWindow, shell, globalShortcut, desktopCapturer } from 'electron'
// import keynode from '../scripts/keynode64.node'
// console.log('密钥原生模块：', keynode);
import Sqlite from '../utils/sqlite'
import nodeAddon from 'node-addon-demo'
import path from 'path'
import fs from 'fs'

import {
    EventEmitter
} from 'events';

let nodeEvent = new EventEmitter();

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

// 获取 Sqlite 存储对象
const db = Sqlite.getInstance()
console.log(path.join(basePath, '3006db.db'))
db.connect(path.join(basePath, '3006db.db'))

db.run(`CREATE TABLE  IF NOT EXISTS CLIENT_SIDE
        (Id char,createTime char,softwareSerial char,
        privilegedTime int,dtTime char,machineCode char,
        enterprise char,contacts char,phone char)`)

db.run(`CREATE TABLE  IF NOT EXISTS CONFIG
        (filePath char)`)

setTimeout(async function() {
    let resdata = await db.get(`SELECT * FROM CONFIG`, [])
    if (!resdata) {
        await db.run(`INSERT INTO CONFIG VALUES (?)`, [app.getPath("documents")])
    }
}, 4000)



// 通过main进程发送事件给renderer进程，提示更新信息
function sendMessage(message, o) {
    global.mainWindow.webContents.send(message, o)
}

let mediaRecorder = false
    // 屏幕录制
async function startRecording() {
    console.log("开始录制");
}


function init() {
    // 获取机器码
    ipcMain.on('machine-code', (event, arg) => {
        // let rcode = keynode.GetMachineCode();
        let rcode = '123456'
        console.log("GetMachineCode", rcode);
        event.sender.send('machine-code', rcode)
    })


    ipcMain.on('check-lic', (event, arg) => {
        let licfile = "KEY.lic"

        // let re = keynode.CheckLic(licfile);
        let re = {
            Success: 1
        }
        console.log("验证结果：", re, nodeAddon.greet('Yeuoly'));

        event.sender.send('check-lic', re)
    })


    ipcMain.on('create-lic', (event, arg) => {
        // let rcode = keynode.GetMachineCode();
        // let re = keynode.CreateLic(rcode.MachineCode, arg.privilegedTime);
        let re = '123456'
        console.log("生成结果：", re);

        event.sender.send('create-lic', re)
    })

    ipcMain.handle('execute-sql', async(event, arg) => {
        let { type, d } = arg;
        let resdata = null
        console.log(type, d)
        switch (type) {
            case 1:
                // 插入客户端数据
                resdata = await db.run(`INSERT INTO CLIENT_SIDE VALUES('${d.Id}','${d.createTime}',
                '${d.softwareSerial}',${d.privilegedTime},'${d.dtTime}','${d.machineCode}','${d.enterprise}',
                '${d.contacts}','${d.phone}')`)

                break;
            case 2:
                // 查询客户端数据
                resdata = await db.get(`SELECT * FROM CLIENT_SIDE`, [])
                console.log(resdata)
                break;
            case 3:
                // 查询配置数据
                resdata = await db.get(`SELECT * FROM CONFIG`, [])
                console.log(resdata)
                break;
            case 4:
                // 更新配置数据
                resdata = await db.run(`UPDATE CONFIG SET filePath=? WHERE TRUE`, [d.filePath])

                break;
            default:
                break;
        }

        return resdata
    })
    ipcMain.handle('get-band', (event, arg) => {
        let result = JSON.parse(fs.readFileSync(path.join(basePath, '/band.json')));
        return result
    })


    ipcMain.handle('save-band', (event, arg) => {
        try {
            fs.writeFileSync(path.join(basePath, '/band.json'), JSON.stringify(arg), {
                'flag': 'w',
                'encoding ': 'utf8'
            });
            // nodeEvent.emit('restart_band');
            return true
        } catch (error) {
            console.error(error)
            return false
        }

    })

    ipcMain.on('base-data', (event, arg) => {
        event.sender.send('base-data', app.getPath('documents'))
    })

    ipcMain.on('show-window', () => {
        global.mainWindow.show()
    })

    ipcMain.on('window-min', () => {
        console.log('最小化事件')
        global.mainWindow.minimize()
    })

    ipcMain.on('window-max', () => {
        if (global.mainWindow.isMaximized()) {
            global.mainWindow.restore()
        } else {
            global.mainWindow.maximize()
        }
    })

    ipcMain.on('window-close', () => {
        console.log('关闭所有窗口事件！')
        let wins = BrowserWindow.getAllWindows()
        for (let i = 0; i < wins.length; i++) {
            wins[i].close()
        }
    })


    ipcMain.on('resize-mini', (event, params) => {
        let height = params.height
        global.miniWindow.setBounds({ height })
    })


}
export default {
    init,
    startRecording
};