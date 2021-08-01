import Cookies from 'js-cookie'

const app = {
    state: {
        sidebar: {
            opened: !+Cookies.get('sidebarStatus'),
            withoutAnimation: false
        },
        device: 'desktop',
        remote: 'OFF',
        sweeptime: 0,
        mr: '',
        rbw: '',
        rbwModel: '',
        unit: '',
        screenCAPType: 'ACT', // 列表模式类型
        screenCAPIsOverload: 'ACT', // 结果值是否过载
        screenCAPValueMax: 0, // 最大结果值
        safetyConfig: {
            fmin: 420000000,
            fmax: 6000000000,
            fcent: 1252500000,
            fspan: 1000000,
            rbw: 1000000,
            vbwMode: 'OFF',
            vbw: 500,
            mr: 46
        },
        isConnect: true
    },
    mutations: {
        TOGGLE_SIDEBAR: state => {
            if (state.sidebar.opened) {
                Cookies.set('sidebarStatus', 1)
            } else {
                Cookies.set('sidebarStatus', 0)
            }
            state.sidebar.opened = !state.sidebar.opened
        },
        CLOSE_SIDEBAR: (state, withoutAnimation) => {
            Cookies.set('sidebarStatus', 1)
            state.sidebar.opened = false
            state.sidebar.withoutAnimation = withoutAnimation
        },
        TOGGLE_DEVICE: (state, device) => {
            state.device = device
        },

        ACTION_REMOTE: (state, remote) => {
            state.remote = remote
        },

        SETTING_SWEEPTIME: (state, sweeptime) => {
            state.sweeptime = sweeptime
        },
        SETTING_RBW: (state, rbw) => {
            state.rbw = rbw
        },
        SETTING_MR: (state, mr) => {
            state.mr = mr
        },
        SETTING_UNIT: (state, unit) => {
            state.unit = unit
        },

        SETTING_RBWMODEL: (state, rbwModel) => {
            state.rbwModel = rbwModel
        },

        SETTING_SPECTRUM_CONFIG: (state, safetyConfig) => {
            state.safetyConfig = safetyConfig
        },
        SETTING_SAFETY_TYPE: (state, screenCAPType) => {
            state.screenCAPType = screenCAPType
        },

        SETTING_SAFETY_IS_OVERLOAD: (state, screenCAPIsOverload) => {
            state.screenCAPIsOverload = screenCAPIsOverload
        },
        SETTING_SAFETY_VALUE_MAX: (state, screenCAPValueMax) => {
            state.screenCAPValueMax = screenCAPValueMax
        },
        IS_CONNECT: (state, isConnect) => {
            state.isConnect = isConnect
        }
    },
    actions: {
        ToggleSideBar: ({ commit }) => {
            commit('TOGGLE_SIDEBAR')
        },
        CloseSideBar({ commit }, { withoutAnimation }) {
            commit('CLOSE_SIDEBAR', withoutAnimation)
        },
        ToggleDevice({ commit }, device) {
            commit('TOGGLE_DEVICE', device)
        },
        ActionRemote({ commit }, remote) {
            commit('ACTION_REMOTE', remote)
        },
        SettingSweepTime({ commit }, sweeptime) {
            commit('SETTING_SWEEPTIME', sweeptime)
        },
        SettingRbw({ commit }, rbw) {
            commit('SETTING_RBW', rbw)
        },
        SettingRbwModel({ commit }, rbwModel) {
            commit('SETTING_RBWMODEL', rbwModel)
        },
        SettingMr({ commit }, mr) {
            commit('SETTING_MR', mr)
        },
        SettingUnit({ commit }, unit) {
            commit('SETTING_UNIT', unit)
        },

        SettingSpectrumConfig({ commit }, safetyConfig) {
            commit('SETTING_SPECTRUM_CONFIG', safetyConfig)
        },
        SettingSafetyType({ commit }, screenCAPType) {
            commit('SETTING_SAFETY_TYPE', screenCAPType)
        },

        SettingSafetyIsOverload({ commit }, screenCAPIsOverload) {
            commit('SETTING_SAFETY_IS_OVERLOAD', screenCAPIsOverload)
        },
        SettingSafetyValueMax({ commit }, screenCAPValueMax) {
            commit('SETTING_SAFETY_VALUE_MAX', screenCAPValueMax)
        },
        IsConnect({ commit }, isConnect) {
            commit('IS_CONNECT', isConnect)
        },

    }
}

export default app