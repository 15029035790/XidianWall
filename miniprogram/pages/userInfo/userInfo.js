const app = getApp()
const db = wx.cloud.database()
const userInfo = db.collection('userinfo')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  onShow: function () {
    this.setData({
      avatarUrl: app.globalData.avatarUrl,
      nickName: app.globalData.nickName,
      signature: app.globalData.signature
    })
  },

  modifyAvatar: function (event) {
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: res => {
        const tempFilePaths = res.tempFilePaths
        let randString = Math.floor(Math.random() * 10000).toString()
        let fileName = Date.now().toString() + "_" + randString + tempFilePaths[0].match(/\.[^.]+?$/)[0]
        wx.cloud.uploadFile({
          cloudPath: "avatars/" + fileName,
          filePath: tempFilePaths[0]
        }).then(res1 => {
          let fileID = res1.fileID
          userInfo.where({
            _openid: app.globalData.openId
          }).field({
            _id: true
          }).get().then(res2 => {
            console.log(res2.data[0]._id)
            userInfo.doc(res2.data[0]._id).update({
              data: {
                avatarUrl: fileID
              }
            }).then( res3 => {
              app.globalData.avatarUrl = fileID
              this.setData({
                avatarUrl: fileID
              })
              wx.showToast({
                title: '头像已修改成功'
              })
            }) 
          })
        }).catch(console.error)
      }
    })
  }
})