const getters = {
    sidebar: state => state.app.sidebar,
    device: state => state.app.device,
    token: state => state.user.token,
    avatar: state => state.user.avatar,
    name: state => state.user.name,
    roles: state => state.user.roles,
    remote: state => state.app.remote,
    sweeptime: state => state.app.sweeptime,
    rbw: state => state.app.rbw,
    rbwModel: state => state.app.rbwModel,
    mp: state => state.app.mp,
    safetyConfig: state => state.app.safetyConfig,

    storagePath: state => state.setting.storagePath,
    localVersion: state => state.setting.localVersion,
    isConnect: state => state.app.isConnect
}
export default getters