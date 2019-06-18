const db = wx.cloud.database()
const userInfo = db.collection('userinfo')
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    emptyTip: "爱就大声说，可别藏着",
    nickName: '西电表白墙',
    avatarUrl: 'http://qlogo1.store.qq.com/qzone/206748176/206748176/100?1420389646'
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.getSetting({
      success: res => {
        console.log(res.authSetting)
        if (!res.authSetting['scope.userInfo']) {
          wx.navigateTo({
            url: '../login/login'
          })
        } else {
          if (!app.globalData.openId) {
            wx.cloud.callFunction({
              name: "getOpenID"
            }).then(res => {
              console.log(res)
              app.globalData.openId = res.result.openId
              this.getUserInfo()
            })
          } else {
            this.getUserInfo()
          }
        }
      }
    })
  },

  /**
   * 获取用户信息：头像和昵称
   */
  getUserInfo() {
    userInfo.where({
      _openid: app.globalData.openId
    }).field({
      avatarUrl: true,
      nickName: true
    }).get().then(res => {
      console.log(res.data)
      app.globalData.avatarUrl = res.data[0].avatarUrl
      app.globalData.nickName = res.data[0].nickName
      this.setData({
        nickName: res.data[0].nickName,
        avatarUrl: res.data[0].avatarUrl
      })
    })
  }
})