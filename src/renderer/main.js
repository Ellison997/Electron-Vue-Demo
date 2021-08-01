import Vue from 'vue'

import 'normalize.css/normalize.css' // A modern alternative to CSS resets

import 'element-ui/lib/theme-chalk/index.css'

import App from './App'
import router from './router'
import store from './store'

import '@/icons' // icon
import '@/permission' // permission control
import { electron, ipcRenderer, remote } from "electron";



if (!process.env.IS_WEB) Vue.use(require('vue-electron'))

import {
    Pagination,
    Dialog,
    Menu,
    Submenu,
    MenuItem,
    Input,
    Select,
    Option,
    Button,
    DatePicker,
    Popover,
    Tooltip,
    Breadcrumb,
    BreadcrumbItem,
    Form,
    FormItem,
    Row,
    Col,
    Progress,
    Card,
    Carousel,
    CarouselItem,
    Loading,
    MessageBox,
    Message,
    Notification,
    Scrollbar,
    Tabs,
    TabPane,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Table,
    TableColumn
} from 'element-ui';

Vue.use(Table);
Vue.use(TableColumn);
Vue.use(Tooltip);
Vue.use(Popover);
Vue.use(Scrollbar);
Vue.use(Progress);
Vue.use(Tabs);
Vue.use(TabPane);

Vue.use(Dropdown);
Vue.use(DropdownMenu);
Vue.use(DropdownItem);

Vue.use(Pagination);
Vue.use(Dialog);
Vue.use(Menu);
Vue.use(Submenu);
Vue.use(MenuItem);
Vue.use(Input);

Vue.use(Select);
Vue.use(Option);
Vue.use(Button);
Vue.use(DatePicker);
Vue.use(Breadcrumb);
Vue.use(BreadcrumbItem);
Vue.use(Form);
Vue.use(FormItem);
Vue.use(Row);
Vue.use(Col);
Vue.use(Card);
Vue.use(Carousel);
Vue.use(CarouselItem);
Vue.use(Loading.directive);

Vue.prototype.$loading = Loading.service;
Vue.prototype.$msgbox = MessageBox;
Vue.prototype.$alert = MessageBox.alert;
Vue.prototype.$confirm = MessageBox.confirm;
Vue.prototype.$prompt = MessageBox.prompt;
Vue.prototype.$notify = Notification;
Vue.prototype.$message = Message;

Vue.prototype.global = global;


function removeAll(arr) {
    //why
    for (const a of arr) {
        ipcRenderer.removeAllListeners(a);
    }
}
ipcRenderer.removeAll = removeAll

Vue.prototype.$electron = electron;
Vue.prototype.$ipcRenderer = ipcRenderer;
Vue.prototype.$remote = remote;

Vue.config.productionTip = false


new Vue({
    components: { App },
    router,
    store,
    template: '<App/>'
}).$mount('#app')