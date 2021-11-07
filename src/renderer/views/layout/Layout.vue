<template>
  <div class="app-wrapper">
    <el-row style="height: 100%">
      <el-col :span="21">
        <app-main></app-main>
      </el-col>
      <el-col :span="3">
        <div class="action">
          <div class="select" style="position: relative">
            <img src="./../../assets/content/cap.png" alt srcset />
            <span class="text">录屏</span>
          </div>
          <div class="select" style="position: relative">
            <div @click="closePopover('rbwSetting')">
              <img src="./../../assets/content/voice.png" alt srcset />
              <span class="text">声音转换</span>
            </div>
            <div v-if="rbwSettingPopover" class="settingPopover">
              <div v-if="modelText != '频谱模式'">
                <ul class="auto-ul">
                  <li style="cursor: auto">手动RBW</li>
                </ul>
                <ul class="manual-ul" style="height: 60px">
                  <li @click="settingRbw('1000000', 'MANUAL', '1 MHz')">
                    1 MHz
                  </li>
                  <li @click="settingRbw('500000', 'MANUAL', '500 KHz')">
                    500 KHz
                  </li>
                </ul>
              </div>
              <div v-else>
                <ul class="manual-ul" v-if="rbwList.length != 0">
                  <li
                    v-for="rl in rbwList"
                    v-bind:key="rl.value"
                    @click="settingRbw(rl.value, 'MANUAL', rl.lable)"
                  >
                    {{ rl.lable }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { Navbar, Sidebar, AppMain } from "./components";
import ResizeMixin from "./mixin/ResizeHandler";

import { unitConversion } from "@/utils";
import store from "@/store";
import { mapGetters } from "vuex";
export default {
  name: "layout",
  components: {
    Navbar,
    Sidebar,
    AppMain,
  },
  mixins: [ResizeMixin],
  data() {
    return {
      connectText: "关闭",
      modelText: "",
      connectPopover: false,
      modelPopover: false,
      rbwSettingPopover: false,
      resuleSettingPopover: false,
      serial_number: "", // 序列号
      type: "", // 设备型号
      quantity: "", //电量
      models: {
        SPECTRUM: "频谱模式",
        SAFETY: "列表模式",
        "\rSPECTRUM": "频谱模式",
        "\rSAFETY": "列表模式",
      },

      rbwList: [],
      mrList: [],
      rbwConfigCommand: "",
      mrConfigCommand: "",
      baseDataTime: "",
      fMin: 700,
      fMax: 5000,
    };
  },

  watch: {
    // fMin: function() {
    //   console.log(this.fMin);
    //   this.fMin = this.fMin.replace(/[^\d]/g, "");
    // },
  },

  computed: { ...mapGetters(["localVersion", "isConnect"]) },
  created() {
    let that = this;
    // 发送远程命令
    this.$ipcRenderer.send("command", ["REMOTE ON;"]);
    // 监听数据返回
    this.listening();
  },
  filters: {
    unitCon: function (value, unit) {
      return unitConversion(value, unit);
    }
  },
  methods: {
    // 设置结果类型
    settingResult(value) {
      store.dispatch("SettingSafetyType", value);
      this.resuleSettingPopover = false;
    },
    // 设置频谱范围
    confirmBtn() {
      let scopeConfigCommand;
      let fcent = ((Number(this.fMax) - Number(this.fMin)) / 2) * 1000000;
      let fspan = Number(this.fMax) * 1000000 - fcent;
      let sc = this.safetyConfig;

      scopeConfigCommand = `SPECTRUM_CONFIG ${fcent},${fspan},${this.rbw},${sc.vbwMode},${sc.vbw},${this.mr};`;
      this.$ipcRenderer.send("command", [scopeConfigCommand]);
      this.resuleSettingPopover = false;
      // 监听rbw 设置
      this.$ipcRenderer.on(scopeConfigCommand, (event, arg) => {
        this.$message({
          showClose: true,
          message: `设置频谱范围成功`,
          type: "success",
        });
      });
    },
    settingUnit(value) {
      console.log(value);
      switch (value) {
        case 0:
          this.$ipcRenderer.send("command", ["UNIT V/m;"]);
          console.log("发送设置v/m 单位命令");
          break;
        case 1:
          this.$ipcRenderer.send("command", ["UNIT dBm;"]);
          break;

        default:
          break;
      }
      this.resuleSettingPopover = false;
    },
    // 设置RBW
    settingRbw(value, model, lable) {
      let rbwConfigCommand;
      let sc = this.safetyConfig;
      rbwConfigCommand = `SPECTRUM_CONFIG ${sc.fcent},${sc.fspan},${value},${sc.vbwMode},${sc.vbw},${this.mr};`;

      console.log("设置的频谱", rbwConfigCommand);
      this.$ipcRenderer.send("command", [rbwConfigCommand]);
      this.rbwSettingPopover = false;
      // 监听rbw 设置
      this.$ipcRenderer.on(rbwConfigCommand, (event, arg) => {
        store.dispatch("SettingRbw", value);
        this.$message({
          showClose: true,
          message: `设置分辨率成功`,
          type: "success",
        });
      });
    },

    // 设置MR  量程
    settingMr(value, model) {
      let that = this;
    },

    listening() {
      this.$ipcRenderer.on("BATTERY?;", (event, arg) => {
        let quantitys = arg.split(",");
        console.log("设备当前电量：", quantitys);
        this.quantity = quantitys[0];
      });
      this.$ipcRenderer.on("DEV_INFO?;", (event, arg) => {
        let info = arg.split(",");
        console.log("设备信息：", info);
        this.type = info[0].substring(1, info[0].length - 1);
        this.serial_number = info[2].substring(1, info[2].length - 1);
      });

      this.$ipcRenderer.on("MODE?;", (event, arg) => {
        let model = arg.split(",");
        console.log("当前模式：", model);
        if (model[1] == "0;") {
          this.modelText = "列表模式";

          console.log("设置了吗？", this.modelText);
        }
      });

      this.$ipcRenderer.on("MR_LIST?;", (event, arg) => {
        let mrs = arg.split(",");
        mrs = mrs.slice(1, mrs.length - 1);

        this.mrList = [];
        for (let index = 0; index < mrs.length / 2; index++) {
          if (this.modelText != "频谱模式") {
            this.mrList.push({
              lable:
                mrs[2 * index].substring(2, mrs[2 * index].length - 1) +
                " (" +
                this.mrDV.get(Number(mrs[2 * index + 1])) +
                "V/m)",
              value: mrs[2 * index + 1],
            });
          } else {
            this.mrList.push({
              lable: mrs[2 * index].substring(2, mrs[2 * index].length - 1),
              value: mrs[2 * index + 1],
            });
          }
        }
        this.mrList.reverse();
        console.log("MR可选列表：", this.mrList);
      });
      this.$ipcRenderer.on("RBW_LIST?;", (event, arg) => {
        let rbws = arg.split(",");
        rbws = rbws.slice(1, rbws.length - 1);
        this.rbwList = [];
        for (let index = 0; index < rbws.length / 2; index++) {
          this.rbwList.push({
            lable: rbws[2 * index].substring(2, rbws[2 * index].length - 1),
            value: rbws[2 * index + 1],
          });
        }
        this.rbwList.reverse();
        console.log("RBW可选列表：", arg, this.rbwList);
      });

      this.$ipcRenderer.on("REMOTE OFF;", (event, arg) => {
        if (arg == "0;") {
          this.type = "";
          this.serial_number = "";
          this.quantity = "";
          this.rbw = "";
          this.mr = "";
          this.modelText = "";
          store.dispatch("ActionRemote", "OFF");
          this.$message({
            message: "关闭连接成功！",
            type: "success",
          });
        } else {
          this.$message({
            message: "关闭连接失败！",
            type: "error",
          });
        }
      });

      this.$ipcRenderer.on("REMOTE ON;", (event, arg) => {
        if (arg == "0;") {
          this.$message({
            showClose: true,
            message: `设备远程成功！`,
            type: "success",
          });

          this.connectText = "打开";
          store.dispatch("ActionRemote", "ON");
          this.$ipcRenderer.send("command", [
            "BATTERY?;",
            "DEV_INFO?;",
            "MODE?;",
            "RBW_LIST?;",
          ]);
        }
      });
    },
    connectAction(event) {
      switch (event) {
        case 0:
          this.connectText = "关机";
          this.$ipcRenderer.send("command", ["REMOTE OFF;"]);
          break;
        case 1:
          this.$ipcRenderer.send("command", ["REMOTE ON;"]);
          break;
        case 2:
          this.connectText = "关闭";
          this.$ipcRenderer.send("command", ["REMOTE OFF;"]);
          break;
        default:
          break;
      }
      this.connectPopover = false;
    },
    modelAction(event) {
      switch (event) {
        case 1:
          this.modelText = "列表模式";
          this.$router.push("/screenCAP");
          break;
        case 2:
          this.modelText = "频谱模式";
          this.$router.push("/safety");
          break;
        case 3:
          this.modelText = "评价模式";
          this.$router.push("/evaluate");
          break;
        default:
          break;
      }
      this.modelPopover = false;
    },
    closePopover(text) {
      this[text + "Popover"] = !this[text + "Popover"];
      let pops = [
        "connect",
        "model",
        "mrSetting",
        "rbwSetting",
        "resuleSetting",
      ];
      for (const p of pops) {
        if (p != text) {
          this[p + "Popover"] = false;
        }
      }
    },
  },

  destroyed() {
    // 关闭刷新基础数据
    clearInterval(this.baseDataTime);
    console.log("Layout 组件销毁");

    this.$ipcRenderer.removeAll([
      "BATTERY?;",
      "DEV_INFO?;",
      "MODE?;",
      "MR_LIST?;",
      "RBW_LIST?;",
      "REMOTE OFF;",
      "REMOTE ON;",
    ]);
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import "../../styles/mixin.scss";
$bg: #2d3a4b;
$dark_gray: #889aa4;
$light_gray: #eee;
.app-wrapper {
  position: fixed;
  height: 100%;
  width: 100%;
  background-color: $bg;
  color: #fff;
  letter-spacing: 2px;

  .action {
    display: flex;
    flex-direction: column;
    height: 410px;
    margin-top: 30px;
    text-align: center;
    align-items: center;
    > div {
      height: 90px;
      margin: auto;
      .text {
        display: block;
        margin: 8px auto;
        width: 140px;
      }
    }
  }
  .select {
    cursor: pointer;
    display: inline-block;
  }
  ul {
    list-style: none;
    margin: 5px;
    padding: 0;
    li {
      padding: 6px 0;
      border-bottom: 1px solid #fff;
    }
    li:last-child {
      border-bottom: none;
    }
  }
  .connectPopover {
    background: #2f3254;
    position: absolute;
    top: 40px;
    z-index: 1;
    border: #fff 1px solid;
    border-radius: 4px;
    li {
      width: 48px;
    }
  }
  .modelPopover {
    background: #2f3254;
    position: absolute;
    top: 26px;
    left: -1%;
    z-index: 1;
    border: #fff 1px solid;
    border-radius: 4px;
    li {
      width: 120px;
    }
  }
  .settingPopover {
    background: #2f3254;
    position: absolute;
    top: -2px;
    left: -160px;
    z-index: 1;
    border: #fff 1px solid;
    border-radius: 4px;
    width: 190px;
    min-height: 100px;
    padding: 6px 0;
    .auto-ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .manual-ul {
      margin-top: 0;
      height: 200px;
      overflow-y: auto;
    }
    .manual-ul::-webkit-scrollbar {
      width: 2px;
      background: #ebeef5;
      display: none;
    }
  }
  input {
    outline-style: none;
    border: 1px solid #ccc;
    border-radius: 3px;
    padding: 2px;
    width: 60px;
    height: 22px;
    font-family: "Microsoft soft";
  }
  .confirmBtn {
    width: 187px;
    border: 1px solid;
    border-radius: 6px;
    background: #4559bb;
    margin: 0 auto;
    margin-top: 10px;
  }
}
</style>
