<template>
  <div class="evaluate-container">
    <div class="l-table" v-if="remote == 'ON'">
      <div style="text-align: center; font-size: 48px" v-if="startflag != 2">
        当前评价时间：{{ settingTimeFlag == 1 ? totalTime / 60 + "分钟" : "不定时" }}
      </div>
      <div class="butc" v-if="startflag == 0">
        <div class="item">
          <span @click="showSettingTime()">定时</span>
        </div>
        <div class="item">
          <span @click="startEvaluate()">开始</span>
        </div>
      </div>
      <div
        v-if="settingTimePopover"
        class="settingPopover"
        style="width: 200px; left: -180px"
      >
        <div style="cursor: auto">
          <span>时间:</span>
          <el-select
            size="mini"
            style="width: 100px"
            v-model="settingTimeFlag"
            @change="changeTimeSelect"
            placeholder="请选择"
          >
            <el-option label="不定时" value="0"></el-option>
            <el-option label="定时" value="1"></el-option>
          </el-select>
        </div>
        <br />
        <div style="cursor: auto" v-if="settingTimeFlag == 1">
          <el-input
            size="mini"
            style="width: 100px"
            type="number"
            placeholder="请输入时间"
            v-model="minTotalTime"
          ></el-input>
          <span>分钟</span>
        </div>

        <div class="confirmBtn" @click="confirmBtn">确定</div>
      </div>
      <div style="margin-top: 180px" v-else-if="startflag == 1">
        <div style="text-align: center; font-size: 64px">
          <span>数据统计中... {{ dataSize }}</span>
          <br />
          <span>{{ time }}</span>
          <br />
          <span>总场强： {{ countMvm | unitCon("V/m") }}</span>
          <div
            class="button"
            v-if="Number(currentTime) > standardTime"
            style="margin-top: 20px"
          >
            <span @click="endEvaluate()">结束</span>
          </div>
        </div>
      </div>
      <div style="margin-top: 10px" v-show="startflag == 2">
        <div>
          <span>∑ 6分钟均值</span>
        </div>
        <div class="sixminuteschart" id="sixminuteschart"></div>
        <div>六分钟滑动平均</div>
        <div class="l-header">
          <div style="width: 220px; flex: none">
            <img src="./../../assets/content/operato_type.png" alt srcset />
            <span style="vertical-align: text-bottom">运营商名称</span>
          </div>
          <div style="flex: 1">
            <img src="./../../assets/content/comprehensive_intensity.png" alt srcset />
            <span style="vertical-align: text-bottom">频段</span>
          </div>
          <div style="flex: 1">
            <img src="./../../assets/content/comprehensive_intensity.png" alt srcset />
            <span style="vertical-align: text-bottom">电场强度</span>
          </div>
          <div style="flex: 1">
            <img src="./../../assets/content/comprehensive_intensity.png" alt srcset />
            <span style="vertical-align: text-bottom">标准评价</span>
          </div>
        </div>
        <div class="l-content">
          <div class="l-row" v-for="i in sixTimeBnadList" v-bind:key="i.id">
            <div style="width: 220px">
              <div>{{ i.chName }}</div>
            </div>
            <div style="flex: 1">
              <div>({{ i.start }}-{{ i.end }})</div>
            </div>
            <div style="flex: 1">
              <div>{{ i.sixMinutesMvm }} mV/m</div>
            </div>

            <div style="flex: 1">
              <div>{{ i.sixMinutesTot }}</div>
            </div>
          </div>
        </div>
        <div class="l-count-row">
          <div style="width: 420px">总场强</div>
          <div style="flex: 1">
            <span>{{ sixTimeBnadMvmCount | unitCon("V/m") }}</span>
          </div>
        </div>
        <div class="l-count-row">
          <div style="width: 420px">∑</div>
          <div style="flex: 1">
            <span>{{ sixTimeBnadTotCount }}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="no-connect" v-else>
      <img src="./../../assets/content/noConnect.png" alt srcset />
      <span>请连接设备...</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { ipcRenderer } from "electron";
import bandlist from "./band.json";
import bus from "@/utils/bus.js";
import { unitConversion, AF } from "@/utils";
import store from "@/store";
import moment from "moment";

// 引入 ECharts 主模块
import echarts from "echarts/lib/echarts";
// 引入柱状图
import "echarts/lib/chart/bar";
// 引入提示框和标题组件
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/chart/line";
import "echarts/lib/component/markPoint";

export default {
  name: "evaluate",
  computed: {
    ...mapGetters(["name", "roles"]),
  },
  data() {
    return {
      bandlist,
      safetyConfigArr: null,
      timerr: null, // 获取数据定时器
      currentTimerr: null, // 当前时间定时器
      time: "00:00", // 显示时间
      startflag: 0, // 0 未开始   1. 开始统计   2 统计结束
      totalTime: 120 * 60, // 统计时间
      minTotalTime: 12, // 统计时间选择
      standardTime: 360, // 评价时间
      sixTimeBnadList: [], // 曲线点击六分钟平均频段列表
      sixTimeBnadTotCount: 0, // 六分钟平均评价值
      sixTimeBnadMvmCount: 0, // 六分钟平均场强
      currentTime: 0, // 当前时间
      settingTimePopover: false, // 设置时间弹框
      settingTimeFlag: "0",
      dataSize: 0, // 采集数据量
      startTime: null,
      endTime: null,
      countMvm: null,
    };
  },
  computed: {
    remote() {
      return this.$store.state.app.remote;
    },

    rbw() {
      return this.$store.state.app.rbw;
    },
  },
  filters: {
    unitCon: function (value, unit) {
      return unitConversion(value, unit);
    },
  },
  created() {
    console.log("进入智能评价页面");
    let that = this;
    this.$ipcRenderer.send("command", ["MODE SPECTRUM;"]);
    this.$ipcRenderer.on("MODE SPECTRUM;", (event, arg) => {
      console.log("设置评价模式返回：", arg);
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
            this.$ipcRenderer.send("command", ["SPECTRUM_CONFIG?;", "MR_LIST?;"]);
          }, 2000);
        }
      }
    );

    this.$ipcRenderer.on("SPECTRUM_CONFIG?;", (event, arg) => {
      let sc = arg.split(",");
      this.safetyConfigArr = sc;
      console.log("评价频谱模式配置：", sc);
      if (sc[6] == "0;") {
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
    confirmBtn() {
      this.settingTimePopover = false;
      if (this.settingTimeFlag == 0) {
        this.totalTime = 120 * 60;
      } else {
        this.totalTime = Number(this.minTotalTime) * 60;
      }
    },

    // 定时方式选择
    changeTimeSelect(e) {
      console.log(e);
      this.settingTimeFlag = e;
      if (e == 1) {
        this.totalTime = Number(this.minTotalTime) * 60;
      }
    },
    // 定时窗口开关
    showSettingTime() {
      this.settingTimePopover = !this.settingTimePopover;
    },
    endEvaluate() {
      let that = this;
      that.totalTime = that.currentTime;
    },
    startEvaluate() {
      let that = this;

      // 评价时间 六分钟的
      let { totalTime } = that;
      that.startflag = 1;
      for (const b of that.bandlist) {
        b.sixMinutesArr = [];
        b.realTimeArr = [];
        b.timeArr = [];
      }

      that.currentTimerr = setInterval(() => {
        ++that.currentTime;

        let h = parseInt(that.currentTime / 60);
        let m = parseInt(that.currentTime % 60);

        that.time = that.toDub(h) + ":" + that.toDub(m);
      }, 1000);

      clearInterval(that.timerr);

      that.timesWitch();
      that.startTime = new Date();
    },
    timesWitch() {
      let that = this;
      let { currentTime, standardTime, totalTime, timerr, startTime } = that;
      console.log(
        currentTime,
        totalTime,
        currentTime >= totalTime,

        new moment(startTime).locale("zh-cn").format("YYYY-MM-DD HH:mm:ss")
      );
      if (currentTime >= totalTime) {
        that.endTime = new Date();
        that.startflag = 2;
        // 停止时间与获取数据定时器
        clearInterval(that.currentTimerr);
        clearInterval(that.timerr);

        const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);
        for (const b of that.bandlist) {
          let sixMinutesArr = [];

          for (let index = 0; index <= currentTime - standardTime; index++) {
            // let sixDataArr = b.timeArr.filter(i=> new Date(i))
            let start = new moment(startTime)
              .add(index, "second")
              .locale("zh-cn")
              .format("YYYY-MM-DD HH:mm:ss");
            let end = new moment(startTime)
              .add(index + standardTime, "second")
              .locale("zh-cn")
              .format("YYYY-MM-DD HH:mm:ss");
            let intervalArr = b.realTimeArr.filter(
              (i) => new Date(start) < new Date(i[1]) && new Date(i[1]) <= new Date(end)
            );
            console.log(start, end, intervalArr.length, intervalArr);

            let mvmArr = intervalArr.map((i) => i[0][0]);
            let totArr = intervalArr.map((i) => i[0][1]);
            // 六分钟均值数组
            sixMinutesArr.push([
              Number((sum(mvmArr) / mvmArr.length).toFixed(8)),
              Number((sum(totArr) / totArr.length).toFixed(10)),
            ]);
          }
          b.sixMinutesArr = sixMinutesArr;
        }

        that.realChart();

        console.log(that.bandlist);

        that.$ipcRenderer.send("toexcel", {
          n: currentTime,
          bandlist: that.bandlist,
          standardTime,
        });
      } else {
        that.$ipcRenderer.send("command", ["SPECTRUM? ACT;"]);
      }
    },
    toDub(n) {
      return n < 10 ? "0" + n : "" + n;
    },
    disposeListData(arg) {
      let that = this;
      ++that.dataSize;
      try {
        let cons = that.safetyConfigArr;
        let sc = {
          fmin: 0,
          fmax: 0,
        };
        sc.fmin = (Number(cons[0]) - Number(cons[1]) / 2) / 1000000;
        sc.fmax = (Number(cons[0]) + Number(cons[1]) / 2) / 1000000;

        let nRbw = that.rbw;

        console.log("当前RBW", nRbw);

        let cd = [];

        let safetyArr = arg.split(",");
        let status = safetyArr.slice(safetyArr.length - 1);
        let info = safetyArr.slice(0, 10);
        let listTemp = safetyArr.slice(10, safetyArr.length - 1);

        store.dispatch("SettingSweepTime", Number(info[1]));
        // 特别关注
        clearInterval(that.timerr);
        console.log("扫描时间", Number(info[1]), new Date());
        that.timerr = setInterval(that.timesWitch, 800);

        for (let index = 0; index < listTemp.length; index++) {
          // RBW 为1MB 的时候
          let arr = new Array(2);
          arr[1] = Number(listTemp[index]);

          arr[0] = sc.fmin + (index * nRbw) / 1000 / 1000 / 2;
          cd.push(arr);
        }
        console.log("数据长度", cd.length, cd[0][0], cd[cd.length - 1][0]);

        //-------------------------

        for (const b of this.bandlist) {
          b.tot = 0;
          b.tot2 = 0;
          b.cc = 0;
          b.sum = 0;
          b.mvm = 0;
          b.mWcm2 = 0;

          for (const a of cd) {
            if (b.start < a[0] && a[0] <= b.end) {
              b.sum += Math.pow(10, Number(a[1]) / 10);

              b.cc++;

              let dbuV_m = a[1] + 107 + AF(a[0]); //   db��V/m
              let uV_m = Math.pow(10, dbuV_m / 20); //   ��V/m
              let V_m = uV_m / (1000 * 1000); //   V/m

              let Wm2 = (V_m * V_m) / (120 * 3.1415926);

              if (a[0] < 3000) {
                let tot2 = Wm2 / 0.4;
                b.tot2 += tot2;
              } else {
                let tot2 = Wm2 / (a[0] / 7500.0);
                b.tot2 += tot2;
              }

              if (a[0] < 3000) {
                let tot = (V_m * V_m) / (12 * 12);
                b.tot += tot;
              } else {
                let tot = (V_m * V_m) / (0.22 * 0.22 * a[0]);
                b.tot += tot;
              }
            }
          }

          let ret1 = (b.sum * (b.end * 1000000 - b.start * 1000000)) / (nRbw * b.cc);
          let dBmW = 10 * Math.log10(ret1);
          let dbuV_m = dBmW + 107 + AF(b.start);
          let uV_m = Math.pow(10, dbuV_m / 20);
          b.mWcm2 = (
            (((uV_m / 1000000) * (uV_m / 1000000)) / (120 * 3.1415926)) *
            1000
          ).toFixed(6);

          b.mvm = (uV_m / 1000).toFixed(6);

          b.tot = b.tot.toFixed(10);
          b.tot2 = b.tot2.toFixed(10);

          // 实时数据

          b.realTimeArr.push([
            [Number(b.mvm), Number(b.tot)],
            moment().locale("zh-cn").format("YYYY-MM-DD HH:mm:ss"),
          ]);
        }

        const sum = (arr) => arr.reduce((acc, val) => acc + val, 0);

        let countTotArr = that.bandlist
          .slice(1, that.bandlist.length)
          .map((i) => Number(i.tot));

        // 计算总   ∑   是分 ∑ 的和
        that.bandlist[0].realTimeArr[that.bandlist[0].realTimeArr.length - 1][0][1] = sum(
          countTotArr
        );

        // 总场强值
        let mWcm2Arr = this.bandlist
          .slice(1, that.bandlist.length)
          .map((i) => Number(i.mWcm2));

        // 除于1000 转成w/m2
        let countmvm = Number(
          (Math.sqrt((Number(sum(mWcm2Arr)) / 1000) * (120 * 3.1415926)) * 1000).toFixed(
            8
          )
        );
        that.countMvm = countmvm;

        that.bandlist[0].realTimeArr[
          that.bandlist[0].realTimeArr.length - 1
        ][0][0] = countmvm;
      } catch (error) {
        console.log(error);
      }
    },
    realChart() {
      let that = this;
      let datas = [];
      let { sixMinutesArr } = that.bandlist[0];

      for (const b in sixMinutesArr) {
        datas.push([b, sixMinutesArr[b][1], b]);
      }

      that.drowChart(datas);
    },
    drowChart(datas) {
      console.log(datas);
      let that = this;
      let myChart = echarts.init(document.getElementById("sixminuteschart"));
      // 绘制图表
      myChart.setOption({
        grid: {
          left: "100", //距离左边的距离
          right: "40", //距离右边的距离
          bottom: "40", //距离下边的距离
          top: "40", //距离上边的距离
        },

        tooltip: {
          trigger: "axis",
        },
        tooltip: {
          formatter: function (param) {
            return `<div style="text-align: center;">∑ ${param.value}</div>${
              Number(param.name) + 1
            }`;
          },
        },
        backgroundColor: "#fff",
        xAxis: {
          data: datas.map((item) => {
            return item[0];
          }),
        },
        yAxis: {
          name: "∑",
          nameTextStyle: {
            align: "center",
            verticalAlign: "top",
            fontSize: 14,
          },
          nameLocation: "center",
          nameRotate: 0,
          nameGap: 80,
          splitLine: {
            show: false,
          },
        },
        toolbox: {
          show: false,
          left: "center",
          feature: {
            dataZoom: {
              yAxisIndex: "none",
            },
            restore: {},
            saveAsImage: {},
          },
        },
        dataZoom: [
          {
            startValue: datas[0][0],
          },
          {
            type: "inside",
          },
        ],

        series: {
          name: "∑",
          type: "line",
          lineStyle: {
            color: "#000",
            width: 1,
          },
          itemStyle: {
            color: "#000",
          },
          data: datas.map(function (item) {
            return item[1];
          }),

          markLine: {
            lineStyle: {
              color: "red",
              width: 1,
            },
            symbol: "none", //去掉箭头
            silent: true,
            data: [
              {
                yAxis: 1,
              },
            ],
          },
        },
      });
      let oldIndex = "";
      myChart.getZr().on("click", function (params) {
        let pointInPixel = [params.offsetX, params.offsetY];
        if (myChart.containPixel("grid", pointInPixel)) {
          let xIndex = myChart.convertFromPixel(
            {
              seriesIndex: 0,
            },
            [params.offsetX, params.offsetY]
          )[0];

          myChart.dispatchAction({
            type: "downplay",
            dataIndex: oldIndex,
          });

          myChart.dispatchAction({
            type: "highlight",
            dataIndex: xIndex,
          });
          oldIndex = xIndex;
          console.log(datas[xIndex][2]);

          let sixTimeIndex = datas[xIndex][2];
          let sixTimeBnadList = [];
          for (const b in that.bandlist) {
            sixTimeBnadList.push({
              chName: that.bandlist[b].chName,
              start: that.bandlist[b].start,
              end: that.bandlist[b].end,

              sixMinutesMvm: that.bandlist[b].sixMinutesArr[sixTimeIndex][0],
              sixMinutesTot: that.bandlist[b].sixMinutesArr[sixTimeIndex][1],
            });
          }
          // 六分钟均值总场强与Tot
          that.sixTimeBnadMvmCount = sixTimeBnadList[0].sixMinutesMvm;
          that.sixTimeBnadTotCount = sixTimeBnadList[0].sixMinutesTot;

          that.sixTimeBnadList = sixTimeBnadList
            .slice(1, sixTimeBnadList.length - 1)
            .sort(function (a, b) {
              return Number(b.sixMinutesTot) - Number(a.sixMinutesTot);
            });

          console.log(
            that.sixTimeBnadTotCount,
            that.sixTimeBnadMvmCount,
            that.sixTimeBnadList
          );
        }
      });
    },
  },

  destroyed() {
    console.log("离开评价页面");

    clearInterval(this.timerr);

    this.$ipcRenderer.removeAllListeners(["SPECTRUM? ACT;"]);
    this.$ipcRenderer.removeAllListeners(["MODE SPECTRUM;"]);
    this.$ipcRenderer.removeAllListeners(["UNIT dBm;"]);
    this.$ipcRenderer.removeAllListeners(["SPECTRUM_CONFIG?;"]);
    this.$ipcRenderer.removeAllListeners([
      "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,-28;",
    ]);
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scope>
.evaluate {
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
        line-height: 1.5;
        margin-top: 10px;
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
        height: 188px;
        overflow-y: auto;
        .l-row {
          display: flex;

          > div {
            border-bottom: 1px solid #fff;
            text-align: center;
            line-height: 1.5;
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

      .butc {
        display: flex;
        height: 64px;
        width: 60%;
        margin: 0 auto;
        margin-top: 140px;
        .item {
          flex: 1;
          text-align: center;
          cursor: pointer;
          font-size: 48px;
          > span {
            width: 150px;
            border-radius: 10px;
            background: #2f3254;
            display: inline-block;
            line-height: 1.5;
            border: 1px solid #fff;
          }
        }
      }
    }
    .button {
      text-align: center;
      cursor: pointer;
      font-size: 48px;
      > span {
        width: 200px;
        border-radius: 10px;
        background: #2f3254;
        display: inline-block;
        line-height: 1.5;
        border: 1px solid #fff;
      }
    }

    .tab-content {
      height: 90%;
    }
    .sixminuteschart {
      height: 300px;
      width: 1000px;
      margin-top: 10px;
    }
    .settingPopover {
      background: #2f3254;
      margin: 0 auto;
      z-index: 1;
      border: #fff 1px solid;
      border-radius: 4px;
      margin-top: 80px;
      min-height: 100px;
      padding: 6px;
    }
    .confirmBtn {
      width: 187px;
      border: 1px solid;
      border-radius: 6px;
      background: #4559bb;
      margin: 0 auto;
      margin-top: 10px;
      line-height: 1.5;
      text-align: center;
    }
  }
}
</style>
