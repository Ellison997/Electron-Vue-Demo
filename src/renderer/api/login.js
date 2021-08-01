import request from '@/utils/request'

export function login(username, password) {
    // return request({
    //   url: '/user/login',
    //   method: 'post',
    //   data: {
    //     username,
    //     password
    //   }
    // })
    return new Promise((resolve, reject) => {
        resolve({
            data: {
                token: '5gzhinengjiance'
            }
        });
    })
}

export function getInfo(token) {
    // return request({
    //   url: '/user/info',
    //   method: 'get',
    //   params: { token }
    // })
    return new Promise((resolve, reject) => {
        if (token) {
            resolve({
                data: {
                    roles: ['admin'],
                    name: '田春乐',
                    avatar: 'https://pic1.zhimg.com/v2-fda399250493e674f2152c581490d6eb_1200x500.jpg'
                }
            });
        } else {
            reject('登录失败！')
        }
    })

}

export function logout(token) {
    // return request({
    //   url: '/user/logout',
    //   method: 'post'
    // })
    return new Promise((resolve, reject) => {
        if (token) {
            resolve({
                data: true
            });
        } else {
            reject('退出登录失败！')
        }
    })
}