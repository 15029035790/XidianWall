const db = wx.cloud.database()
const userinfo = db.collection('userinfo')
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {
      avatarUrl: '',
      gender: 1,
      nickName: '西电学子',
      signature: '请完善个人签名'
    }
  },

  initUserInfo: function (openId) {
    userinfo.where({
      _openid: openId
    }).field({
      nickName: true,
      signature: true,
      avatarUrl: true,
      gender: true,
      topicNum: true,
      collectionNum: true,
    }).get().then( res => {
      console.log(res)
      let user = res.data[0]
      app.globalData.nickName = user.nickName
      app.globalData.avatarUrl = user.avatarUrl
      if (user.avatarUrl.indexOf('cloud://') > -1) {
        let imgList = []
        imgList.push(user.avatarUrl)
        wx.cloud.getTempFileURL({
          fileList: imgList
        }).then(res => {
          console.log(res.fileList)
          let imgStr = 'userInfo.avatarUrl'
          this.setData({
            [imgStr]: res.fileList[0].tempFileURL
          })
        })
      }
      if (user.signature) {
        app.globalData.signature = user.signature
      } else {
        app.globalData.signature = this.data.userInfo.signature
        user.signature = this.data.userInfo.signature
      }
      this.setData({
        userInfo: user
      })
    }).catch(console.error)
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    
  },

  onShow: function () {
    // 获取用户信息
    if (!app.globalData.openId) {
      wx.cloud.callFunction({
        name: "getOpenID"
      }).then(res => {
        console.log(res)
        app.globalData.openId = res.result.openId
        this.initUserInfo(res.result.openId)
      })
    } else {
      this.initUserInfo(app.globalData.openId)
    }
  },

  checkUpgrade: function () {
    wx.showLoading({
      title: '正在检查更新...',
      mask: true
    })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({
        title: '当前已是最新版'
      })
    }, 1500);
  }
})