<template>
  <div class="container">
    <div class="item">
      <span>数据存储位置:</span>
      <span>
        <i class="el-icon-folder-opened"></i>
        {{ storagePath }}
      </span>
      <el-button size="mini" @click="select" style="margin-left: 10px" plain
        >更改目录</el-button
      >
      <el-button size="mini" @click="reset" plain>恢复默认</el-button>
    </div>
    <div class="item">
      <span>当前版本:</span>
      <span>{{ localVersion }}</span>
      <!-- <el-button
        @click="checkVersion"
        size="mini"
        type="primary"
        style="margin-left: 10px"
        >检查更新</el-button
      > -->
    </div>
    <div class="item" @click="goBandm">
      <span>频段管理</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import store from "@/store";
import { checkUpdate } from "@/api/app";

export default {
  name: "dashboard",

  computed: {
    localVersion() {
      return this.$store.state.setting.localVersion;
    },
    storagePath() {
      return this.$store.state.setting.storagePath;
    },
  },
  data() {
    return {
      remoteVersion: "",
    };
  },
  async created() {
    let that = this;
    // 初始化数据存储位置
    let resdata = await that.$ipcRenderer.invoke("execute-sql", {
      type: 3,
      d: null,
    });
    store.dispatch("StoragePath", resdata.filePath);
    console.log(resdata);
  },
  methods: {
    goBandm() {
      this.$router.push({
        path: `/bandm`,
      });
    },
    async select() {
      let that = this;
      let res = await this.$remote.dialog.showOpenDialog({
        properties: ["openDirectory"],
      });
      if (res.filePaths.length > 0) {
        await that.$ipcRenderer.invoke("execute-sql", {
          type: 4,
          d: {
            filePath: res.filePaths[0],
          },
        });

        store.dispatch("StoragePath", res.filePaths[0]);
      }
    },
    reset() {
      let folder = `${this.$remote.app.getPath("documents")}`;
      store.dispatch("StoragePath", folder);
    },
    checkVersion() {
      this.loading = true;
      checkUpdate()
        .then((res) => {
          console.log("返回的结果", res);
          let data = res.data;
          this.remoteVersion = data.versionNumber;
          // this.$store.commit(
          //   "Update/SET_UPDATE_CONTENT",
          //   this.converter.makeHtml(data.body)
          // );
          console.log(this.remoteVersion);
        })
        .catch((e) => {
          console.log("why", e);
          this.$message.error("获取版本号失败");
        })
        .finally(() => {
          this.loading = false;
        });
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.container {
  padding: 0 250px;
  padding-top: 20px;

  height: 100%;
  width: 100%;
  background-image: url("./../../assets/content/line.png");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  color: #fff;
  letter-spacing: 2px;

  .item {
    line-height: 3;
    border-bottom: 1px solid #ddd;
    cursor: pointer;
  }
}
</style>
