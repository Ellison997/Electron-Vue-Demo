<template>
  <div class="container">
    <div class="l-table">
      <div class="l-header">
        <div style="width: 220px; flex: none">
          <span style="vertical-align: text-bottom">运营商名称</span>
        </div>
        <div style="width: 220px; flex: none">
          <span style="vertical-align: text-bottom">运营商别名</span>
        </div>

        <div style="flex: none; width: 180px">
          <span style="vertical-align: text-bottom">起止带宽</span>
        </div>
        <div style="flex: none; width: 240px">
          <span style="vertical-align: text-bottom">国标限值</span>
        </div>
        <div style="flex: 1">
          <span style="vertical-align: text-bottom">类别</span>
        </div>
        <!-- <div style="flex: 1">
          <span style="vertical-align: text-bottom">操作</span>
        </div> -->
      </div>
      <div class="l-content">
        <div class="l-row" v-for="i in bandlist" v-bind:key="i.id">
          <div style="width: 220px">
            <div>{{ i.name }}</div>
          </div>
          <div style="width: 220px">
            <div>{{ i.chName }}</div>
          </div>
          <div style="width: 180px">
            <div class="scope">{{ i.start }} MHz - {{ i.end }}MHz</div>
          </div>
          <div style="width: 240px">
            <div>{{ i.limiting[0] }} / {{ i.limiting[1] }}</div>
          </div>
          <div style="flex: 1">
            {{ i.type | transitionType }}
          </div>
          <!-- <div style="flex: 1">
            <el-button type="danger" size="mini" @click="goDelete(i)" round
              >删除</el-button
            >
          </div> -->
        </div>
      </div>
    </div>
    <div class="butc">
      <div class="item">
        <span @click="goBack()">返回</span>
      </div>
      <div class="item">
        <!-- <span>新增</span> -->
      </div>
      <div class="item">
        <span @click="goSave()">保存</span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import store from "@/store";

export default {
  name: "dashboard",

  computed: {},
  data() {
    return {
      bandlist: [],
    };
  },
  filters: {
    transitionType: function (value) {
      let typeName = "";
      switch (value) {
        case 1:
          typeName = "移动";
          break;
        case 2:
          typeName = "联通";
          break;
        case 3:
          typeName = "电信";
          break;
        case 4:
          typeName = "广电";
          break;
        case 5:
          typeName = "电信/联通5G共建";
          break;
        case 6:
          typeName = "电信联通室内5G";
          break;
        default:
          break;
      }
      return typeName;
    },
  },
  async created() {
    let that = this;

    // 初始化数据存储位置
    let resdata = await that.$ipcRenderer.invoke("get-band", null);

    console.log(resdata);
    that.bandlist = resdata;
  },
  methods: {
    goBack: function () {
      this.$router.push({
        path: `/setting`,
      });
    },
    goDelete: function (i) {
      let index = this.bandlist.findIndex((b) => b.name == i.name);
      console.log(this.bandlist[index]);
      this.$confirm("此操作将删除该频段, 是否继续?", "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      })
        .then(() => {
          this.bandlist.splice(index, 1);
          this.$message({
            type: "success",
            message: "删除成功!",
          });
        })
        .catch(() => {
          this.$message({
            type: "info",
            message: "已取消删除",
          });
        });
    },
    goSave: async function () {
      let resdata = await this.$ipcRenderer.invoke("save-band", this.bandlist);
      if (resdata) {
        this.$message({
          type: "success",
          message: "保存成功,请重新打开软件！",
        });
      } else {
        this.$message({
          type: "error",
          message: "保存失败",
        });
      }
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.container {
  height: 100%;
  width: 100%;
  background-color: #2d3a4b;
  color: #fff;
  letter-spacing: 2px;
  padding: 10px;

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
    margin-bottom: 20px;
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
      height: 630px;
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
}
</style>
