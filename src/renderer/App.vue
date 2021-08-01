<template>
  <div id="app">
    <div class="control">
      <div class="title">
        <span style="line-height: 24px">Electron-Vue-Demo</span>
      </div>
      <div class="action">
        <i @click="goHome" class="el-icon-s-home"></i>
        <i @click="goSetting" class="el-icon-setting"></i>
        <i @click="mini" class="el-icon-remove-outline"></i>
        <i @click="close" class="el-icon-circle-close"></i>
      </div>
    </div>
    <div class="content">
      <router-view></router-view>
    </div>
    <el-dialog
      title="发现新版本"
      :visible.sync="isUpdateVisible"
      width="40%"
      top="35vh"
      custom-class="update-dialog"
    >
      <p>版本号：V {{ updateInfo.version }}</p>
      <p>更新内容：</p>
      <p v-for="t in updateInfo.texts" v-bind:key="t">{{ t }}</p>

      <span slot="footer" class="dialog-footer">
        <el-button size="small" @click="isUpdateVisible = false"
          >取 消</el-button
        >
        <el-button size="small" type="primary" @click="downloaded"
          >立即升级</el-button
        >
      </span>
    </el-dialog>
    <el-dialog
      title="下载进度"
      :visible.sync="isProgressVisible"
      width="40%"
      top="15vh"
      custom-class="update-progress"
      :show-close="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <p>
        <span>总大小：{{ updateTotalSize }}MB</span>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <span>已下载：{{ updateSize }}MB</span>
      </p>
      <el-progress
        :text-inside="true"
        :stroke-width="26"
        :percentage="downloadPercent"
      ></el-progress>
    </el-dialog>
  </div>
</template>

<script>
import store from "./store";
import { checkUpdate } from "@/api/app";
export default {
  name: "App",
  data() {
    return {
      isUpdateVisible: false,
      isProgressVisible: false,
      downloadPercent: 0,
      updateTotalSize: 0,
      updateSize: 0,

      updateInfo: {
        version: "",
        texts: [],
      },
    };
  },
  created() {
    let that = this;
    // 消息弹框
    this.$ipcRenderer.on("ALERT", (event, arg) => {
      console.log("设备连接状态：", arg.state == 0 ? false : true);
      // store.dispatch("IsConnect", arg.state == 0 ? false : true);
      // this.$message({
      //   showClose: true,
      //   message: arg.message,
      //   type: arg.type,
      // });
    });

    this.$ipcRenderer.send("checkForUpdate");
    this.$ipcRenderer.on("updateMessage", (event, obj) => {
      console.log(obj);
      if (obj.type == "available") {
        checkUpdate()
          .then((res) => {
            console.log("返回的结果", res);
            let data = res.data;
            if (data.versions == obj.info.version) {
              that.updateInfo = {
                version: obj.info.version,
                texts: data.text.split(";"),
              };
              that.isUpdateVisible = true;
            }
          })
          .catch((e) => {
            console.log("why", e);
            this.$message.error("获取版本号失败");
          })
          .finally(() => {
            this.loading = false;
          });
      }
    });
    //注意：“downloadProgress”事件可能存在无法触发的问题，只需要限制一下下载网速就好了
    this.$ipcRenderer.on("downloadProgress", (event, progressObj) => {
      console.log(progressObj);

      // total: 69647050
      // delta: 764977
      // transferred: 2025909
      // percent: 2.908822412435272
      // bytesPerSecond: 977284
      this.downloadPercent = Number(progressObj.percent.toFixed(2)) || 0;
      this.updateTotalSize = (progressObj.total / 1000000).toFixed(2);
      this.updateSize = (progressObj.transferred / 1000000).toFixed(2);
    });
    this.$ipcRenderer.on("isUpdateNow", () => {
      this.$ipcRenderer.send("isUpdateNow");
    });
  },
  methods: {
    mini() {
      console.log("最小化事件");
      this.$ipcRenderer.send("window-min");
    },
    close() {
      this.$ipcRenderer.send("window-close");
    },
    goSetting() {
      console.log("点击了设置");
      this.$router.push("/setting");
    },
    goHome() {
      if (store.getters.token) {
        this.$router.push("/");
      } else {
        this.$router.push("/login");
      }
    },
    downloaded() {
      this.isUpdateVisible = false;
      this.isProgressVisible = true;
      this.$ipcRenderer.send("downloadUpdate");
    },
  },
  destroyed() {
    this.$ipcRenderer.send("command", ["REMOTE OFF;"]);
    this.$ipcRenderer.removeAll([
      "updateMessage",
      "downloadProgress",
      "isUpdateNow",
      "ALERT",
    ]); //remove只能移除单个事件，单独封装removeAll移除所有事件
  },
};
</script>
<style lang="scss">
@import "./styles/index.scss"; // 全局自定义的css样式
#app {
  height: 100vh;
  .control {
    background: #373942;
    color: #fff;
    padding: 4px 6px;
    height: 32px;
    display: flex;
    position: relative;
    .title {
      flex: 1;
      -webkit-app-region: drag;
    }

    .action {
      width: 140px;
      text-align: right;
      font-size: 22px;
      color: dodgerblue;
    }
  }
  .content {
    height: calc(100% - 32px);
  }
  .update-dialog > .el-dialog__body {
    padding: 2px 20px;
  }
  .update-progress > .el-dialog__body {
    padding: 20px;
    padding-top: 0px;
  }
}
</style>
