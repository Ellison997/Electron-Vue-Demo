#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

echo '删除 node_modules'
rm -rf ./node_modules

echo '安装依赖包'
npm install

echo '卸载sqlite3'
npm uninstall sqlite3

echo '重新构建'
npm run rebuild

echo '安装sqlite3'
npm install sqlite3 --runtime=electron --target=9.4.4

echo '清除构建'
npm run build:clean

echo '打包构建'
npm run build
