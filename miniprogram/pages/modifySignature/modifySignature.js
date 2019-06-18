const app = getApp()
const db = wx.cloud.database()
const userInfo = db.collection('userinfo')
Page({
  data: {
    title: "个性签名",
    info: "(从此处开始填写新签名)"
  },

  onLoad: function (options) {
    console.log(options.signature)
    this.setData({
      info: options.signature
    })
  },

  getNewValue: function (event) {
    this.info = event.detail.value
  },

  confirm: function (event) {
    let signature = this.info
    console.log(signature)
    userInfo.where({
      _openid: app.globalData.openId
    }).field({
      _id: true
    }).get().then(res => {
      console.log(res.data[0]._id)
      userInfo.doc(res.data[0]._id).update({
        data: {
          signature: signature
        }
      }).then( res => {
        app.globalData.signature = signature
        this.setData({
          info: signature
        })
        wx.showToast({
          title: '签名已修改成功'
        })
      }) 
    })
  }
})