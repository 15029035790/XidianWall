const db = wx.cloud.database()
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    emptyTip: "爱就大声说，可别藏着"
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
        }
      }
    })
  }
})