<template>
  <div class="safety-container">
    <div class="l-table" v-if="remote == 'ON'">
      <div class="l-header">
        <div style="width: 220px; flex: none">
          <img src="./../../assets/content/operato_type.png" alt srcset />
          <span style="vertical-align: text-bottom">运营商名称</span>
        </div>

        <div style="flex: none; width: 220px">
          <img
            src="./../../assets/content/comprehensive_intensity.png"
            alt
            srcset
          />
          <span style="vertical-align: text-bottom">电场强度</span>
        </div>
        <div style="flex: 1">
          <img
            src="./../../assets/content/comprehensive_intensity.png"
            alt
            srcset
          />
          <span style="vertical-align: text-bottom">功率密度</span>
        </div>
        <!-- <div style="flex: 1">
          <img src="./../../assets/content/comprehensive_intensity.png" alt srcset />
          <span style="vertical-align: text-bottom">功率密度</span>
        </div> -->
        <div style="flex: 1">
          <img
            src="./../../assets/content/comprehensive_intensity.png"
            alt
            srcset
          />
          <span style="vertical-align: text-bottom">国标限值</span>
        </div>
        <div style="flex: 1">
          <img
            src="./../../assets/content/comprehensive_intensity.png"
            alt
            srcset
          />
          <span style="vertical-align: text-bottom">占比</span>
        </div>
        <div style="flex: 1">
          <img
            src="./../../assets/content/comprehensive_intensity.png"
            alt
            srcset
          />
          <span style="vertical-align: text-bottom">国标评价</span>
        </div>
      </div>
      <div class="l-content">
        <div class="l-row" v-for="i in showbandlist" v-bind:key="i.id">
          <div style="width: 220px">
            <div style="line-height: 22px">{{ i.chName }}</div>
            <div class="scope">({{ i.start }}-{{ i.end }})</div>
          </div>
          <!-- |unitCon("V/m") -->
          <div style="width: 220px">
            <!-- ||{{ i.mvm2 }} -->
            <div style="line-height: 22px">{{ i.mvm1 }}</div>
            <div class="scope">mV/m</div>
          </div>
          <div style="flex: 1">
            <div style="line-height: 22px">{{ i.mWcm21 }}</div>
            <div class="scope">mW/m²</div>
          </div>
          <!-- <div style="flex: 1">
            <div style="line-height: 22px">{{ i.mWcm2 }}</div>
            <div class="scope">mW/m²</div>
          </div> -->
          <div style="flex: 1">
            <div style="line-height: 22px">{{ i.limiting[0] }}</div>
            <div class="scope">{{ i.limiting[1] }}</div>
          </div>
          <div style="flex: 1">
            {{ i.mWcm21 | unitPercentile(showtotal[0][3]) }} %
          </div>
          <div style="flex: 1">
            {{ i.tot }}
          </div>
        </div>
      </div>

      <div class="l-count-row">
        <div style="width: 120px">综合场强</div>
        <div style="flex: 1; border-right: 1px solid">
          {{ showtotal[0][1] | unitCon("V/m") }}
        </div>

        <!-- ||  {{ showtotal[0][0] | unitCon("V/m") }} （选频带） -->
        <div style="flex: 1">
          {{ showtotal[1][1] | unitCon("V/m") }}
        </div>
        <!-- || {{ showtotal[1][0] | unitCon("V/m") }} （全频带） -->
      </div>

      <div class="l-count-row">
        <div style="width: 120px">功率密度</div>
        <div style="flex: 1; border-right: 1px solid">
          {{ showtotal[0][3] }} mW/m²（选频带）
        </div>
        <!-- || {{ showtotal[0][2] }} mW/cm²（选频带） -->
        <div style="flex: 1">{{ showtotal[1][3] }} mW/m² (全频带)</div>
        <!-- || {{ showtotal[1][2] }} mW/cm² (全频带) -->
      </div>

      <div class="l-count-row">
        <div style="width: 120px">
          ∑
          <span style="font-size: 12px">国标评价</span>
        </div>
        <div style="flex: 1">
          <span>{{ showtotal[0][4] }}</span>
        </div>
      </div>
      <el-dialog
        title="请等待六分钟"
        :visible.sync="dialogVisible"
        width="50%"
        :modal="true"
        :modal-append-to-body="false"
        :before-close="handleClose"
        top="38vh"
        custom-class="sixdialog"
        :show-close="false"
        :close-on-click-modal="false"
        :close-on-press-escape="false"
      >
        <el-progress
          :text-inside="true"
          :stroke-width="26"
          :percentage="Number(((currentTime / standardTime) * 100).toFixed(2))"
        ></el-progress>
        <div style="text-align: right; margin: 12px 0">
          <span style="color: #000; font-size: 28px">{{ time }}</span>
        </div>
        <span slot="footer">
          <el-button @click="dialogVisible = false">取 消</el-button>
        </span>
      </el-dialog>
    </div>
    <div class="no-connect" v-else>
      <img src="./../../assets/content/noConnect.png" alt srcset />
      <span>请连接设备...</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

import bandlist from "./band.json";
import bus from "@/utils/bus.js";
import { unitConversion, AF } from "@/utils";
import store from "@/store";
import moment from "moment";
/**
 * 添加国标计算频段场强
 */

export default {
  name: "safety",
  computed: {
    ...mapGetters(["name", "roles"]),
  },
  data() {
    return {
      bandlist,
      showbandlist: [],
      sixbandlist: [],
      TotalValue: "",
      OthersValue: "",
      isSend: false,
      safetyConfigArr: null,
      total: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      showtotal: [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      dataIntervalTime: null,
      dialogVisible: false,
      time: "00:00", // 显示时间
      currentTimerr: null, // 当前时间定时器
      currentTime: 0, // 当前时间
      sixDataArr: [], //六分钟数据缓存,
      standardTime: 360, // 评价时间
    };
  },
  computed: {
    remote() {
      return this.$store.state.app.remote;
    },
    safetyType() {
      return this.$store.state.app.safetyType;
    },
    rbw() {
      return this.$store.state.app.rbw;
    },
  },
  watch: {
    safetyType: function () {
      let { safetyType, standardTime,bandlist } = this;
      let that = this;
      switch (safetyType) {
        case "ACT":
          break;
        case "MAX":
          break;

        case "EVENNESS":
          this.sixbandlist=JSON.parse(JSON.stringify(bandlist))
          console.log("开始六分钟数据测量", standardTime);
          this.dialogVisible = true;
          this.sixDataArr = [];
          that.currentTimerr = setInterval(() => {
            ++that.currentTime;
            let h = 5 - parseInt(that.currentTime / 60);
            let m = 60 - parseInt(that.currentTime % 60);
            that.time = that.toDub(h) + ":" + that.toDub(m);
          }, 1000);

          setTimeout(function () {
            console.log("清除定时器，关闭弹框！");
            clearInterval(that.currentTimerr);
            that.dialogVisible = false;
          }, standardTime * 1000);
          break;

        default:
          break;
      }
    },
  },
  filters: {
    unitCon: function (value, unit) {
      return unitConversion(value, unit);
    },
    unitPercentile: function (value, countValue) {
      return ((value / countValue) * 100).toFixed(2);
    },
  },
  created() {
    console.log("进入列表页面");
    let that = this;
    this.isSend = true;

    that.$ipcRenderer.send("updateDataType", true);

    // 开始定时读取频谱数据
    this.dataIntervalTime = setInterval(() => {
      that.$ipcRenderer.send("command", ["SPECTRUM? ACT;"]);
    }, 1000);

    this.$ipcRenderer.send("command", ["MODE SPECTRUM;"]);
    this.$ipcRenderer.on("MODE SPECTRUM;", (event, arg) => {
      console.log("设置频谱模式返回：", arg);
      if (arg == "0;") {
        this.$ipcRenderer.send("command", ["UNIT dBm;"]);
      }
    });
    this.$ipcRenderer.on("UNIT dBm;", (event, arg) => {
      console.log("设置单位返回", arg);
      if (arg == "0;") {
        this.$ipcRenderer.send("command", [
          "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,-28;",
        ]);
        store.dispatch("SettingUnit", "dBm");
      }
    });
    this.$ipcRenderer.on(
      "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,-28;",
      (event, arg) => {
        console.log("设置频谱返回：", arg);
        if (arg == "0;") {
          setTimeout(() => {
            this.$ipcRenderer.send("command", [
              "SPECTRUM_CONFIG?;",
              `SPECTRUM? ACT;`,
              "MR_LIST?;",
            ]);
          }, 2000);
        }
      }
    );

    // 只是进入页面后的一个频谱配置
    this.$ipcRenderer.on("SPECTRUM_CONFIG?;", (event, arg) => {
      let sc = arg.split(",");
      this.safetyConfigArr = sc;
      console.log("频谱模式配置：", sc);
      if (sc[6] == "0;") {
        // 1252500000,1000000,50000,OFF,500,46,0;
        let safetyConfig = {
          fmin: (Number(sc[0]) - Number(sc[1]) / 2) / 1000000,
          fmax: (Number(sc[0]) + Number(sc[1]) / 2) / 1000000,
          fcent: sc[0],
          fspan: sc[1],
          rbw: sc[2],
          vbwMode: sc[3],
          vbw: sc[4],
          mr: sc[5],
        };
        store.dispatch("SettingSpectrumConfig", safetyConfig);

        store.dispatch("SettingRbw", sc[2]);
        store.dispatch("SettingMr", sc[5]);
      }
    });

    this.$ipcRenderer.on(`SPECTRUM? ACT;`, (event, arg) => {
      that.disposeListData(arg);
    });
  },
  methods: {
    handleClose() {
      store.dispatch("SettingSafetyType", "ACT");
      this.dialogVisible = false;
      clearInterval(that.currentTimerr);
      this.sixDataArr = [];

      console.log("点击关闭弹框了！");
    },
    disposeListData(arg) {
      let that = this;
      try {
        let data = JSON.parse(arg);
        that.bandlist = data.bandlist;
        that.total = data.total;
        store.dispatch("SettingSafetyIsOverload", data.isOverload);
        store.dispatch("SettingSweepTime", data.sweepTime);
        clearInterval(that.dataIntervalTime);

        that.dataIntervalTime = setTimeout(() => {
          that.$ipcRenderer.send("command", ["SPECTRUM? ACT;"]);
        }, data.sweepTime + 50);

        // 下一步数据处理
        this.typeConvert();
      } catch (error) {
        console.log(error);
      }
    },
    toDub(n) {
      return n < 10 ? "0" + n : "" + n;
    },
    // 结果类型转换
    typeConvert() {
      let { safetyType, bandlist, total, currentTime, standardTime } = this;
      let that = this;
      console.log("列表返回", safetyType, bandlist, total);

      switch (safetyType) {
        case "ACT":
          // 实时值
          this.showbandlist = JSON.parse(JSON.stringify(bandlist));
          this.showtotal = JSON.parse(JSON.stringify(total));

          break;
        case "MAX":
          // 最大值
          for (const i in this.showbandlist) {
            this.showbandlist[i].mvm1 = Math.max(
              this.showbandlist[i].mvm1,
              bandlist[i].mvm1
            );
            this.showbandlist[i].mvm2 = Math.max(
              this.showbandlist[i].mvm2,
              bandlist[i].mvm2
            );
            this.showbandlist[i].mWcm21 = Math.max(
              this.showbandlist[i].mWcm21,
              bandlist[i].mWcm21
            );
            this.showbandlist[i].mWcm2 = Math.max(
              this.showbandlist[i].mWcm2,
              bandlist[i].mWcm2
            );
            this.showbandlist[i].tot = Math.max(
              this.showbandlist[i].tot,
              bandlist[i].tot
            );
          }

          this.showtotal = [
            [
              Math.max(this.showtotal[0][0], total[0][0]),
              Math.max(this.showtotal[0][1], total[0][1]),
              Math.max(this.showtotal[0][2], total[0][2]),
              Math.max(this.showtotal[0][3], total[0][3]),
              Math.max(this.showtotal[0][4], total[0][4]),
            ],
            [
              Math.max(this.showtotal[1][0], total[1][0]),
              Math.max(this.showtotal[1][1], total[1][1]),
              Math.max(this.showtotal[1][2], total[1][2]),
              Math.max(this.showtotal[1][3], total[1][3]),
            ],
          ];
          break;

        case "EVENNESS":
          // 实时值
          let bandlistTemp = JSON.parse(JSON.stringify(bandlist));
          let totalTemp = JSON.parse(JSON.stringify(total));

          this.sixDataArr.push({
            time: moment().locale("zh-cn").format("YYYY-MM-DD HH:mm:ss"),
            bandlist: bandlistTemp,
            total: totalTemp,
          });
          console.log('六分钟数组:',this.sixDataArr)

          if (currentTime >= standardTime) {
            let start = new moment()
              .subtract(standardTime, "second")
              .locale("zh-cn")
              .format("YYYY-MM-DD HH:mm:ss");
            let end = new moment()
              .locale("zh-cn")
              .format("YYYY-MM-DD HH:mm:ss");

            // 计算滑动平均
            let intervalTimeArr = this.sixDataArr.filter(
              (i) =>
                new Date(start) <= new Date(i.time) &&
                new Date(i.time) <= new Date(end)
            );
            this.countSixMinutes(intervalTimeArr);
          } else {
            this.showbandlist = bandlistTemp;
            this.showtotal = totalTemp;
          }
          break;

        default:
          break;
      }
    },
    countSixMinutes(arr) {
      console.log("需要平均的数据", arr);
      let { sixbandlist } = this;
      for (const i in sixbandlist) {
        let mvm1datas = [];
        let mvm2datas = [];
        let totdatas = [];
        const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);

        for (const a of arr) {
          // 方
          mvm1datas.push(a.bandlist[i].mvm1 * a.bandlist[i].mvm1);
          mvm2datas.push(a.bandlist[i].mvm2 * a.bandlist[i].mvm2);
          totdatas.push(Number(a.bandlist[i].tot));
        }
        let mvm1 = Math.sqrt(sum(mvm1datas) / arr.length);
        let mvm2 = Math.sqrt(sum(mvm2datas) / arr.length);

        // 均根
        sixbandlist[i].mvm1 = Number(mvm1.toFixed(3));
        sixbandlist[i].mvm2 = Number(mvm2.toFixed(3));
        sixbandlist[i].tot = (sum(totdatas) / arr.length).toFixed(8);
        sixbandlist[i].mWcm21 = (
          (((sixbandlist[i].mvm1 / 1000) * (sixbandlist[i].mvm1 / 1000)) /
            (120 * 3.1415926)) *
          1000
        ).toFixed(6);
        sixbandlist[i].mWcm2 = (
          (((sixbandlist[i].mvm2 / 1000) * (sixbandlist[i].mvm2 / 1000)) /
            (120 * 3.1415926)) *
          1000
        ).toFixed(6);
      }
      console.log("平均后的数据", sixbandlist);
      this.showbandlist = sixbandlist;

      //----------------------------------------------------------

      let mvm1datas = [];
      let mvm2datas = [];
      let totdatas = [];
      let mvm1countdatas = [];
      let mvm2countdatas = [];

      const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);

      for (const a of arr) {
        // 方
        mvm1datas.push(a.total[0][0] * a.total[0][0]);
        mvm2datas.push(a.total[0][1] * a.total[0][1]);
        mvm1countdatas.push(a.total[1][0] * a.total[1][0]);
        mvm2countdatas.push(a.total[1][1] * a.total[1][1]);
        totdatas.push(a.total[0][4]);
      }
      let mvm1 = Math.sqrt(sum(mvm1datas) / arr.length);
      let mvm2 = Math.sqrt(sum(mvm2datas) / arr.length);
      let mvm1count = Math.sqrt(sum(mvm1countdatas) / arr.length);
      let mvm2count = Math.sqrt(sum(mvm2countdatas) / arr.length);

      let total = [
        [0, 0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      // 均根
      total[0][0] = Number(mvm1.toFixed(3));
      total[0][1] = Number(mvm2.toFixed(3));
      total[0][4] = (sum(totdatas) / arr.length).toFixed(8);
      total[0][2] = (
        (((total[0][0] / 1000) * (total[0][0] / 1000)) / (120 * 3.1415926)) *
        1000
      ).toFixed(6);
      total[0][3] = (
        (((total[0][1] / 1000) * (total[0][1] / 1000)) / (120 * 3.1415926)) *
        1000
      ).toFixed(6);

      total[1][0] = Number(mvm1count.toFixed(3));
      total[1][1] = Number(mvm2count.toFixed(3));

      total[1][2] = (
        (((total[1][0] / 1000) * (total[1][0] / 1000)) / (120 * 3.1415926)) *
        1000
      ).toFixed(6);
      total[1][3] = (
        (((total[1][1] / 1000) * (total[1][1] / 1000)) / (120 * 3.1415926)) *
        1000
      ).toFixed(6);

      this.showtotal = total;
    },
  },

  destroyed() {
    this.isSend = false;
    console.log("离开列表页面");
    clearInterval(this.dataIntervalTime);
    clearTimeout(this.dataIntervalTime);

    this.$ipcRenderer.removeAll([
      "SPECTRUM? ACT;",
      "MODE SPECTRUM;",
      "UNIT dBm;",
      "SPECTRUM_CONFIG?;",
      "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,-28;",
    ]);
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scope>
.safety {
  &-container {
    margin: 10px;
    margin-top: 16px;
    .no-connect {
      text-align: center;
      padding: 80px;
      span {
        display: block;
        font-size: 22px;
        margin-top: 20px;
      }
    }
    .l-table {
      .l-header {
        display: flex;
        height: 32px;
        line-height: 24px;
        > div {
          flex: 1;
          border-bottom: 1px solid #fff;
          text-align: center;
          img {
            width: 20px;
          }
        }
      }
      .l-content {
        height: 510px;
        overflow-y: auto;
        .l-row {
          display: flex;

          > div {
            border-bottom: 1px solid #fff;
            text-align: center;
            line-height: 44px;
            .scope {
              font-size: 14px;
              color: #53fdf5;
              line-height: 22px;
            }
          }
        }
      }
      .l-content::-webkit-scrollbar {
        width: 2px;
        background: #ebeef5;
        display: none;
      }
      .l-count-row {
        display: flex;
        height: 32px;
        line-height: 32px;
        > div {
          border-bottom: 1px solid #fff;
          text-align: center;
        }
      }
    }

    .tab-content {
      height: 90%;
    }
  }
}
.sixdialog {
  .el-dialog__body {
    padding-bottom: 0;
  }
}
</style>
