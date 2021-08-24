# Electron-Vue-Demo

## 安装依赖

```
npm install
```

## 先卸载 sqlite3

```
npm uninstall sqlite3
```

## 编译原生模块

```
npm run rebuild
```

## 免安装版本打包

```
npm run build:dir
```

## 安装版本打包

```
npm run build

```

## 清除打包文件

```
npm run build:clean
```

## 安装 sqlite3

```
npm install sqlite3 --runtime=electron --target=5.0.7 --dist-url=https://atom.io/download/electron --save
```

## 启动程序

```
npm run dev
```



## 先卸载

./node_modules/.bin/electron-rebuild

 "target": [
    {
        "target": "nsis",
        "arch": [
            "x64",
            "ia32"
        ]
    }
]

使用模块加载原生node  native-ext-loader