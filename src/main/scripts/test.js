// Modules to control application life and create native browser window

//const sam = require('./build/Debug/keynode')
const sam = require('./keynode')
console.log("sam111111");
console.log(sam);

//
//1、APP得到机器码
let r = sam.GetMachineCode();
console.log("GetMachineCode", r);
//2、后台通过机器码 获取30天的授权文件
r = sam.CreateLic(r.MachineCode, 30);
console.log("CreateLic", r);
//3、APP 监测授权文件
let licfile = "KEY.lic"
setTimeout(function() {
    r = sam.CheckLic(licfile);
    console.log("CheckLic", r);
}, 3000);

// 如果授权无效，
//let lic = sam.GetLicence(r.Result,'1234');

//
//console.log(r);