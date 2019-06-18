const db = wx.cloud.database()
const userinfo = db.collection('userinfo')
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },

  login: function (event) {
    wx.cloud.callFunction({
      name: "getOpenID"
    }).then(res => {
      console.log(res)
      app.globalData.openId = res.result.openId
      app.globalData.avatarUrl = event.detail.userInfo.avatarUrl
      app.globalData.nickName = event.detail.userInfo.nickName
      userinfo.where({
        _openid: res.result.openId
      }).count().then(res => {
        console.log(res)
        if (res.total == 0) {
          userinfo.add({
            data: event.detail.userInfo
          }).then(res => {
            wx.switchTab({
              url: '../index/index'
            })
          })
        } else {
          wx.switchTab({
            url: '../index/index'
          })
        }
      })
    })
  }

})