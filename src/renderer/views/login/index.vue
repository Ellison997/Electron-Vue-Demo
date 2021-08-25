<template>
  <div class="login-container">
    <el-row type="flex" align="middle" class="content">
      <el-col :span="12">
        <div class="left-img">
          <img src="@/assets/login/left_img.png" alt />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="login-form">
          <h3 class="title">
            Electron-Vue-Demo &nbsp;&nbsp;V{{ localVersion }}
          </h3>
          <div class="formbg" v-if="isLic">
            <!-- <div class="unit">{{ enterprise }}</div> -->
            <div>
              <el-button
                type="primary"
                style="width: 100%"
                :disabled="!isConnect"
                @click.native.prevent="handleSafety"
                >进入</el-button
              >
            </div>
          </div>
          <div class="formbg" v-else>
            <div class="tips">请输入软件序列号</div>
            <el-form
              autocomplete="on"
              :model="loginForm"
              :rules="loginRules"
              ref="loginForm"
              label-position="left"
            >
              <el-form-item prop="softwareSerial">
                <span class="svg-container svg-container_login">
                  <i class="el-icon-edit-outline"></i>
                </span>
                <el-input
                  name="softwareSerial"
                  type="text"
                  style="width: 280px"
                  v-model="loginForm.softwareSerial"
                  autocomplete="on"
                  placeholder="请输入软件序列号"
                />
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  style="width: 100%"
                  :loading="loading"
                  :disabled="!isConnect"
                  @click.native.prevent="handleCheck"
                  >验证</el-button
                >
              </el-form-item>
            </el-form>
          </div>
        </div>
      </el-col>
    </el-row>
    <div class="footer">XXX科技 © 2021</div>
  </div>
</template>

<script>
import { validateLic } from "@/utils/validate";
import { checkSoftSerial } from "@/api/app";
import { mapGetters } from "vuex";
export default {
  name: "login",
  data() {
    const validateSoftwareSerial = (rule, value, callback) => {
      console.log("校验");
      if (!validateLic(value)) {
        callback(new Error("请输入36位格式正确的序列号"));
      } else {
        callback();
      }
    };

    return {
      loginForm: {
        softwareSerial: "",
      },
      loginRules: {
        softwareSerial: [
          {
            required: true,
            trigger: "blur",
            validator: validateSoftwareSerial,
          },
        ],
      },
      loading: false,
      isLic: false,
      machineCode: "",
      enterprise: "",
    };
  },
  computed: {
    ...mapGetters(["localVersion", "isConnect"]),
  },
  async created() {
    let that = this;
    this.$ipcRenderer.send("check-lic", null);
    this.$ipcRenderer.send("machine-code", null);

    this.$ipcRenderer.on("check-lic", (event, arg) => {
      that.isLic = arg.Success == 1 ? true : false;
      console.log("验证证书返回：", arg.Success);
    });

    this.$ipcRenderer.on("machine-code", (event, arg) => {
      console.log("获取机器码返回：", arg);
      that.machineCode = arg.MachineCode;
    });

    this.$ipcRenderer.on("create-lic", (event, arg) => {
      console.log("创建证书返回：", arg.Success);
    });

    // 查询登记信息
    let resdata = await that.$ipcRenderer.invoke("execute-sql", {
      type: 2,
      d: null,
    });
    console.log(resdata);
    if (resdata) {
      that.enterprise = resdata.enterprise;
    }
  },
  methods: {
    handleSafety() {
      let that = this;
      that.$store
        .dispatch("Login", null)
        .then(() => {
          this.loading = false;
          this.$router.push({ path: "/" });
        })
        .catch(() => {
          this.loading = false;
        });
    },
    handleCheck() {
      let that = this;
      this.$refs.loginForm.validate(async (valid) => {
        console.log(valid);
        if (valid) {
          this.loading = true;
          // 校验序列号
          let i = await checkSoftSerial({
            machineCode: that.machineCode,
            softwareSerial: that.loginForm.softwareSerial,
          });
          console.log(i);
          if (!i.data) {
            that.$alert(i.msg, "提示", {
              confirmButtonText: "确定",
              callback: (action) => {
                console.log(action);
                that.loading = false;
              },
            });
            return;
          } else {
            this.$message({
              type: "success",
              message: i.msg,
            });
          }
          let d = i.data;
          // 校验成功生成序列号
          that.$ipcRenderer.send("create-lic", {
            privilegedTime: d.privilegedTime,
          });
          d.machineCode = that.machineCode;
          console.log(d);

          // 保存公司名称
          await that.$ipcRenderer.invoke("execute-sql", {
            type: 1,
            d,
          });
          // 跳转到列表页面
          that.$store
            .dispatch("Login", null)
            .then(() => {
              this.loading = false;
              this.$router.push({ path: "/" });
            })
            .catch(() => {
              this.loading = false;
            });
        } else {
          console.log("error submit!!");
          return false;
        }
      });
    },
  },
  destroyed() {
    console.log("离开登录页面");

    this.$ipcRenderer.removeAll(["check-lic", "machine-code", "create-lic"]);
  },
};
</script>



<style rel="stylesheet/scss" lang="scss" scoped>
$bg: #2d3a4b;
$dark_gray: #889aa4;
$light_gray: #eee;
.login-container {
  position: fixed;
  height: 100%;
  width: 100%;
  background-color: $bg;
  // background-image: url("./../../assets/login/bg.png");
  // background-repeat: no-repeat;
  // background-size: 100% 100%;
  .login-form {
    padding: 2px;
    margin: 20px auto;
    width: 400px;
  }
  .tips {
    font-size: 18px;
    color: #fff;
    margin-bottom: 10px;
    padding: 10px;
    text-align: center;
  }
  .svg-container {
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
    &_login {
      font-size: 20px;
    }
  }
  .title {
    line-height: 1.2;
    font-size: 26px;
    font-weight: 400;
    color: $light_gray;
    margin: 0px auto 20px auto;
    letter-spacing: 4px;
    text-align: center;
  }
  .formbg {
    height: 100%;
    width: 100%;
    background-image: url("./../../assets/login/login.png");
    background-repeat: no-repeat;
    background-size: 100% 100%;
    padding: 14px 24px;
  }
  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }
  .left-img {
    text-align: center;
    padding-top: 30px;

    img {
      width: 60%;
      max-width: 500px;
      border-radius: 50%;
    }
  }
  .footer {
    text-align: center;
    color: #fff;
    position: fixed;
    width: 100%;
    bottom: 0;
    line-height: 60px;
    letter-spacing: 4px;
  }
}
</style>
