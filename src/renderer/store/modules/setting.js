import { remote } from 'electron'
const setting = {
    state: {
        storagePath: remote.app.getPath("documents"),
        localVersion: remote.app.getVersion()
    },

    mutations: {
        SET_STORAGE_PATH: (state, storagePath) => {
            state.storagePath = storagePath
        },
        SET_lOCAL_VERSION: (state, localVersion) => {
            state.localVersion = localVersion
        },

    },

    actions: {
        StoragePath: ({ commit }, storagePath) => {
            commit('SET_STORAGE_PATH', storagePath)
        },
        LocalVersion: ({ commit }, localVersion) => {
            commit('SET_lOCAL_VERSION', localVersion)
        }
    }
}

export default setting