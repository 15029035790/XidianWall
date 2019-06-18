const app = getApp()
const db = wx.cloud.database()
const userInfo = db.collection('userinfo')
Page({
  data: {
    title: "更改昵称",
    info: "用户昵称"
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.nickName)
    this.setData({
      info: options.nickName
    })
  },

  getNewValue: function (event) {
    this.info = event.detail.value
  },

  confirm: function (event) {
    let nickName = this.info
    console.log(nickName)
    userInfo.where({
      _openid: app.globalData.openId
    }).field({
      _id: true
    }).get().then(res => {
      console.log(res.data[0]._id)
      userInfo.doc(res.data[0]._id).update({
        data: {
          nickName: nickName
        }
      }).then( res => {
        app.globalData.nickName = nickName
        this.setData({
          info: nickName
        })
        wx.showToast({
          title: '昵称已修改成功'
        })
      }) 
    })
  }
})