<template>
  <div class="app-container">
    <div class="mchart" id="mchart"></div>
    <div>
      <ol>
        <li>
          macOS下快捷键： Command+Shift+R 开始录制， Command+Shift+S停止录制；
        </li>
        <li>
          Windows下快捷键： Ctrl+Shift+R 开始录制， Ctrl+Shift+S停止录制；
        </li>
      </ol>
    </div>
    <div class="butc">
      <div class="item">
        <span @click="start">录制</span>
      </div>
      <div class="item">
        <span @click="stop">停止</span>
      </div>
    </div>
  </div>
</template>

<script>
import store from "@/store";
const path = require("path");
const fs = require("fs");
import { mapGetters } from "vuex";

export default {
  data() {
    return {
      markNum: 0,
      mediaRecorder: null,
      chunks: [],
    };
  },
  computed: {
    ...mapGetters(["localVersion", "isConnect"]),
  },

  filters: {
    statusFilter(status) {
      const statusMap = {
        published: "success",
        draft: "gray",
        deleted: "danger",
      };
      return statusMap[status];
    },
  },
  created() {
    let that = this;
    console.log("进入屏幕录制页面");

    this.$ipcRenderer.send("command", ["UNIT V/m;"]);

    this.$ipcRenderer.on("UNIT V/m;", (event, arg) => {
      console.log("设置V/m单位返回", arg);
      if (arg == "0;") {
        store.dispatch("SettingUnit", "V/m");
      }
    });
    // 更新 刷新时间 与是否过载
    store.dispatch("SettingSweepTime", 0);
  },
  mounted() {
    let that = this;

    this.$ipcRenderer.on("StartRecording", this.start);
    this.$ipcRenderer.on("StopRecording", this.stop);
  },
  methods: {
    async start() {
      const sources = await this.$desktopCapturer.getSources({
        types: ["window", "screen"],
      });
      console.log("视频源:", sources);
      var types = [
        "video/webm",
        "audio/webm",
        "video/webm;codecs=vp8",
        "video/webm;codecs=vp9",
        "video/webm;codecs=daala",
        "video/webm;codecs=h264",
        "audio/webm;codecs=opus",
        "video/mpeg",
        "video/mp4",
        "video/AV1",
      ];

      for (var i in types) {
        console.log(
          "Is " +
            types[i] +
            " supported? " +
            (MediaRecorder.isTypeSupported(types[i]) ? "Maybe!" : "Nope :(")
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "desktop",
          },
        },
        video: {
          mandatory: {
            chromeMediaSource: "desktop",
            chromeMediaSourceId: sources[0].id,
          },
        },
      });

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=h264",
      });
      this.mediaRecorder.ondataavailable = (event) => {
        event.data.size > 0 && this.chunks.push(event.data);
      };

      this.mediaRecorder.start();
      console.log("录制中...");
    },

    async stop() {
      let that=this;
      if (!this.mediaRecorder) return;

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.chunks, { type: "video/webm" });
         const buffer = Buffer.from(await blob.arrayBuffer());
       // const buffer = Buffer.from(mp4(Buffer.from(await blob.arrayBuffer())));
        const filePath = path.resolve(
          that.$remote.app.getPath("downloads"),
          `${Date.now()}.webm`
        );
        console.log("路径：", filePath);
        fs.writeFile(filePath, buffer, () => {
         that.$shell.showItemInFolder(filePath);
          this.mediaRecorder = null;
          this.chunks = [];
        });
      };
      this.mediaRecorder.stop();
      console.log("空闲");
    },
  },
  destroyed() {
    console.log("离开频谱页面，销毁定时器");
    clearInterval(this.intervalTime);
    clearInterval(this.dataIntervalTime);

    this.isSend = false;

    this.$ipcRenderer.removeAll(["SPECTRUM? ACT;", "MODE SPECTRUM;"]);
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scope>
.app {
  &-container {
    margin: 10px;
    margin-top: 16px;
    .mchart {
      width: 100%;
      height: 430px;
      margin-bottom: 40px;
    }
    .butc {
      display: flex;
      height: 64px;
      .item {
        flex: 1;
        text-align: center;
        cursor: pointer;
        > span {
          width: 150px;
          border-radius: 10px;
          background: #2f3254;
          display: inline-block;
          line-height: 40px;
          border: 1px solid #fff;
        }
      }
    }

    .listPopover {
      background: #2f3254;
      position: absolute;
      z-index: 1;
      border: #fff 1px solid;
      border-radius: 4px;
      min-height: 100px;
      padding: 6px 0;
      width: 480px;
      left: -104px;
      bottom: 70px;

      ul {
        list-style: none;
        margin: 5px;
        padding: 0;
        margin-top: 0;
        height: 300px;
        overflow-y: auto;
        li {
          padding: 6px 0;
          border-bottom: 1px solid #fff;
        }
      }
      ul::-webkit-scrollbar {
        width: 2px;
        background: #ebeef5;
        display: none;
      }
    }
  }
}
</style>
