import { app, BrowserWindow, Menu, dialog, globalShortcut } from 'electron'

import mSerialPort from './modules/mserialport'
import initIpcEvent from './modules/ipcEvent'
import path from 'path'

// 注意这个autoUpdater不是electron中的autoUpdater
import { autoUpdater } from "electron-updater"

import Sqlite from './utils/sqlite'

/**
 * Set `__static` path to static files in production  hahah
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
    global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\')
}

const winURL = process.env.NODE_ENV === 'development' ?
    `http://localhost:9080` :
    `file://${__dirname}/index.html`

import {
    ipcMain
} from 'electron'


let mainWindow;

function createWindow() {
    console.log('Electron版本：', process.version)
        /**
         * Initial window options
         */
    mainWindow = new BrowserWindow({
        useContentSize: true,
        height: 800,
        width: 1200,
        minWidth: 1200,
        minHeight: 660,
        show: false,

        frame: false, //隐藏导航栏
        backgroundColor: '#ffffff',
        webPreferences: {
            nodeIntegration: true
        }
    })

    mainWindow.loadURL(winURL)

    mainWindow.webContents.openDevTools()

    mainWindow.on('ready-to-show', function() {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => {
            mainWindow = null
        })
        // 尝试更新
    updateHandle()

    global.mainWindow = mainWindow


}

app.on('ready', () => {
    createWindow();
    mSerialPort();
    initIpcEvent.init();
    // 设置快捷键
    globalShortcut.register('CommandOrControl+Shift+R', () => {
        mainWindow.webContents.send("StartRecording")
        initIpcEvent.startRecording()
    })
    globalShortcut.register('CommandOrControl+Shift+S', () => {
        mainWindow.webContents.send("StopRecording")
    })



})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow()
    }
})


app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})


/*隐藏electron创建的菜单栏*/
Menu.setApplicationMenu(null)


// 参考地址
// https://segmentfault.com/a/1190000012904543

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
function updateHandle() {

    let message = {
        error: '检查更新出错',
        checking: '正在检查更新……',
        updateAva: '检测到新版本',
        updateNotAva: '现在使用的就是最新版本，不用更新',
    };


    autoUpdater.setFeedURL('http://xtroms.com:5000/uploads/software');
    autoUpdater.autoDownload = false;

    autoUpdater.on('error', function(error) {
        sendUpdateMessage({
            type: 'error',
            text: message.error
        })
    });
    autoUpdater.on('checking-for-update', function() {
        sendUpdateMessage({
            type: 'checking',
            text: message.checking
        })


    });
    autoUpdater.on('update-available', function(info) {
        console.log('检查更新可用消息：', info)
        sendUpdateMessage({
            type: 'available',
            text: message.updateAva,
            info
        })
    });
    autoUpdater.on('update-not-available', function(info) {
        sendUpdateMessage({
            type: 'notAvailable',
            text: message.updateNotAva
        })
    });

    // 更新下载进度事件
    autoUpdater.on('download-progress', function(progressObj) {
            mainWindow.webContents.send('downloadProgress', progressObj)
        })
        // 开始下载
    autoUpdater.on('update-downloaded', function(event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate) {
        console.log('update-downloaded', event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate)
        ipcMain.on('isUpdateNow', (e, arg) => {
            console.log(arguments);
            console.log("开始更新");
            //some code here to handle event
            autoUpdater.quitAndInstall();
        });

        mainWindow.webContents.send('isUpdateNow')
    });

    ipcMain.on("downloadUpdate", () => {
        //执行自动更新检查
        autoUpdater.downloadUpdate();
    })

    ipcMain.on("checkForUpdate", () => {
        //执行自动更新检查
        autoUpdater.checkForUpdates();
    })

}

// 通过main进程发送事件给renderer进程，提示更新信息
function sendUpdateMessage(o) {
    mainWindow.webContents.send('updateMessage', o)
}