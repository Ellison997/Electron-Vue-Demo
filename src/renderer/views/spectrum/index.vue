<template>
  <div class="app-container">
    <div class="mchart" id="mchart"></div>
    <div class="butc">
      <div class="item">
        <span @click="markNum = 1">标记最大值</span>
      </div>
      <div class="item">
        <span @click="markNum = 3">标记前三值</span>
      </div>
      <div class="item">
        <span @click="markNum = 0">清除标记</span>
      </div>
      <div class="item" style="position: relative" @click="showList">
        <span>峰值列表</span>
        <div v-if="listPopover" class="listPopover">
          <ul style="height: 160px">
            <li v-for="(i, index) of sortData" v-bind:key="index">
              <span style="display: inline-block; width: 44%; text-align: left"
                >{{ index + 1 }}: {{ i.coord[0] }} MHz</span
              >
              |
              <span style="display: inline-block; width: 44%"
                >{{ i.coord[1] }} {{ unit == "dBm" ? "dBm" : "mV/m" }}</span
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { getList } from "@/api/table";
// 引入 ECharts 主模块
import echarts from "echarts/lib/echarts";
// 引入柱状图
import "echarts/lib/chart/bar";
// 引入提示框和标题组件
import "echarts/lib/component/tooltip";
import "echarts/lib/component/title";
import "echarts/lib/chart/line";
import "echarts/lib/component/markPoint";

import bus from "@/utils/bus.js";
import { unitConversion } from "@/utils";
import store from "@/store";

export default {
  data() {
    return {
      list: null,
      listLoading: true,
      chartsData: [],
      sortData: [],
      intervalTime: null,
      markNum: 0,
      listPopover: false,
      isSend: false,
      dataIntervalTime: null,
    };
  },
  computed: {
    sweeptime() {
      return this.$store.state.app.sweeptime;
    },
    spectrumConfig() {
      return this.$store.state.app.spectrumConfig;
    },
    rbw() {
      return this.$store.state.app.rbw;
    },
    unit() {
      return this.$store.state.app.unit;
    },
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
    that.isSend = true;
    console.log("进入频谱页面");
    that.$ipcRenderer.send("updateDataType", false);

    this.dataIntervalTime = setInterval(() => {
      that.$ipcRenderer.send("command", ["SPECTRUM? ACT;"]);
    }, 1000);

    this.$ipcRenderer.send("command", ["UNIT V/m;"]);

    this.$ipcRenderer.on("UNIT V/m;", (event, arg) => {
      console.log("设置V/m单位返回", arg);
      if (arg == "0;") {
        this.$ipcRenderer.send("command", [
          "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,2;",
        ]);
        store.dispatch("SettingUnit", "V/m");
      }
    });
    this.$ipcRenderer.on(
      "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,2;",
      (event, arg) => {
        console.log("设置频谱返回：", arg);
        if (arg == "0;") {
          setTimeout(() => {
            that.$ipcRenderer.send("command", [
              "SPECTRUM_CONFIG?;",
              "MR_LIST?;",
              "RBW_LIST?;",
            ]);
          }, 1000);
        }
      }
    );

    this.$ipcRenderer.on("UNIT dBm;", (event, arg) => {
      console.log("设置dBm单位返回", arg);
      if (arg == "0;") {
        this.$ipcRenderer.send("command", [
          "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,-24;",
        ]);
        store.dispatch("SettingUnit", "dBm");
      }
    });
    this.$ipcRenderer.on(
      "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,-24;",
      (event, arg) => {
        console.log("设置频谱返回：", arg);
        if (arg == "0;") {
          setTimeout(() => {
            that.$ipcRenderer.send("command", [
              "SPECTRUM_CONFIG?;",
              "MR_LIST?;",
              "RBW_LIST?;",
            ]);
          }, 1000);
        }
      }
    );

    this.$ipcRenderer.on("SPECTRUM_CONFIG?;", (event, arg) => {
      console.log("频谱模式配置：", arg);
      let sc = arg.split(",");
      if (sc[6] == "0;") {
        // 1252500000,1000000,50000,OFF,500,46,0;
        let spectrumConfig = {
          fmin: (Number(sc[0]) - Number(sc[1]) / 2) / 1000000,
          fmax: (Number(sc[0]) + Number(sc[1]) / 2) / 1000000,
          fcent: sc[0],
          fspan: sc[1],
          rbw: sc[2],
          vbwMode: sc[3],
          vbw: sc[4],
          mr: sc[5],
        };
        store.dispatch("SettingSpectrumConfig", spectrumConfig);

        store.dispatch("SettingRbw", sc[2]);
        store.dispatch("SettingMr", sc[5]);
      }
    });

    this.$ipcRenderer.on("SPECTRUM? ACT;", (event, arg) => {
      let that = this;
      let sc = that.spectrumConfig;
      let spectrumArr = arg.split(",");
      let status = spectrumArr.slice(spectrumArr.length - 1);
      let info = spectrumArr.slice(0, 10);
      let listTemp = spectrumArr.slice(10, spectrumArr.length - 1);
      // console.log("获取频谱状态：", status);
      // console.log("频谱信息", info);
      // console.log("频谱原始数据", listTemp);

      this.chartsData = [];
      for (let index = 0; index < listTemp.length; index++) {
        // RBW 为1MB 的时候
        let arr = new Array(2);
        if (that.unit == "V/m") {
          arr[1] = (Number(listTemp[index]) * 1000).toFixed(3);
        } else {
          arr[1] = Number(listTemp[index]).toFixed(3);
        }
        arr[0] = sc.fmin + (index * that.rbw) / 1000 / 1000 / 2;
        this.chartsData.push(arr);
      }
      console.log("频谱长度：", this.chartsData.length);

      // 更新 刷新时间 与是否过载
      store.dispatch("SettingSweepTime", info[1]);
      store.dispatch("SettingSafetyIsOverload", info[8]);
      that.painting();
    });
  },
  mounted() {
    console.log(this.sortData);
    let that = this;

    this.intervalTime = setInterval(() => {
      that.sortData = [];

      if (that.markNum != 0) {
        let sortChartsData = JSON.parse(JSON.stringify(that.chartsData));
        sortChartsData.sort((a, b) => {
          return b[1] - a[1];
        });

        sortChartsData = sortChartsData.splice(0, that.markNum);
        for (const i of sortChartsData) {
          that.sortData.push({ coord: i });
        }
      }
    }, 2000);
    //that.sweeptime == 0 ? 2000 : that.sweeptime + 200
  },
  methods: {
    showList() {
      console.log("显示了吗");
      this.markNum = 16;
      this.listPopover = !this.listPopover;
    },
    painting() {
      let that = this;
      let sc = that.spectrumConfig;
      let myChart = echarts.init(document.getElementById("mchart"));
      // 绘制图表
      let yAxis;
      if (that.unit == "V/m") {
        yAxis = {
          name: "电场强度 / mV/m",
          nameTextStyle: {
            align: "center",
            verticalAlign: "bottom",
            fontSize: 14,
          },
          nameLocation: "center",
          nameGap: 50,
          type: "log",
          min: 0.001,
          max: 10000,
          logBase: 10,
        };
      } else {
        yAxis = {
          name: "电平 / dbm",
          nameTextStyle: {
            align: "center",
            verticalAlign: "bottom",
            fontSize: 14,
          },
          nameLocation: "center",
          nameGap: 50,
          type: "value",
          min: -130,
          max: 10,
        };
      }

      yAxis.minorTick = {
        show: true,
      };
      yAxis.minorSplitLine = {
        show: true,
      };

      myChart.setOption({
        grid: {
          left: "8%", //距离左边的距离
          right: "1%", //距离右边的距离
          bottom: "6%", //距离下边的距离
          top: "4%", //距离上边的距离
        },

        backgroundColor: "#fff",
        xAxis: {
          name: "频率 / GHz",
          nameTextStyle: {
            align: "center",
            verticalAlign: "bottom",
            fontSize: 14,
          },
          nameLocation: "center",
          nameGap: 50,
          type: "value",
          min: sc.fmin,
          max: sc.fmax,
          splitNumber: 6,
          // 格式化显示
          axisLabel: {
            formatter: function (value, index) {
              // 格式化成月/日，只在第一个刻度显示年份
              let val = value / 1000;
              return val;
            },
          },
          // 设置次要的网格标线
          minorSplitLine: {
            show: true,
            lineStyle: {
              color: "#ddd",
            },
          },
        },

        yAxis,
        series: [
          {
            type: "line",
            symbol: "none",
            lineStyle: {
              color: "#000",
              width: 1,
            },
            //标记点
            markPoint: {
              symbol: "circle",
              symbolSize: 10,
              itemStyle: {
                color: "red",
              },
              label: {
                show: true,
                position: "top",
                formatter: function (param) {
                  return param.data.coord[1];
                },
              },
              data:
                that.sortData.length > 3
                  ? that.sortData.splice(0, 3)
                  : that.sortData,
            },
          },
        ],
        dataset: {
          source: that.chartsData,
        },
      });
    },
  },
  destroyed() {
    console.log("离开频谱页面，销毁定时器");
    clearInterval(this.intervalTime);
    clearInterval(this.dataIntervalTime);

    this.isSend = false;

    this.$ipcRenderer.removeAll([
      "SPECTRUM? ACT;",
      "MODE SPECTRUM;",
      "UNIT dBm;",
      "UNIT V/m;",
      "SPECTRUM_CONFIG?;",
      "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,-28;",
      "SPECTRUM_CONFIG 3000000000,6000000000,1000000,OFF,50000,2;",
    ]);
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
