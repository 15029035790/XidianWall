const db = wx.cloud.database()
const userInfo = db.collection('userinfo')
const topics = db.collection('topics')
const regeneratorRuntime = require('../../libs/regenerator-runtime/runtime')
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    nickNames: ['表白不能怂', '千与千寻', '吐槽欢乐多'],
    avatarUrl: 'http://img2.imgtn.bdimg.com/it/u=523276437,416996051&fm=26&gp=0.jpg',
    imgList: [],
    maxImageNum: 12,
    textareaValue: '',
    public: true,
    publicTip: '公开',
    locationTip: '所在位置',
    isChooseLocation: false,
    location: {
      name: "西安电子科技大学(北校区)",
      address: "陕西省西安市雁塔区太白南路2号",
      latitude: 34.23241,
      longitude: 108.91814
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options.type)
    this.data.topicType = options.type
  },

  ChooseImage: function () {
    wx.chooseImage({
      count: this.maxImageNum, //默认9
      sizeType: ['original'], //可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], //从相册选择
      success: (res) => {
        if (this.data.imgList.length != 0) {
          this.setData({
            imgList: this.data.imgList.concat(res.tempFilePaths)
          })
        } else {
          this.setData({
            imgList: res.tempFilePaths
          })
        }
      }
    });
  },
  ViewImage: function (e) {
    wx.previewImage({
      urls: this.data.imgList,
      current: e.currentTarget.dataset.url
    });
  },
  DelImg: function (e) {
    wx.showModal({
      title: '亲',
      content: '确定要删除这段回忆吗？',
      cancelText: '再看看',
      confirmText: '再见',
      success: res => {
        if (res.confirm) {
          this.data.imgList.splice(e.currentTarget.dataset.index, 1);
          this.setData({
            imgList: this.data.imgList
          })
        }
      }
    })
  },
  textareaInput: function (e) {
    this.setData({
      textareaValue: e.detail.value
    })
  },

  isPublic: function (e) {
    console.log(e.detail)
    this.setData({
      public: e.detail.value,
      publicTip: e.detail.value ? '公开' : '保密'
    })
  },

  chooseLocation: function (e) {
    wx.chooseLocation({
      success: res => {
        console.log(res)
        this.setData({
          locationTip: res.name,
          isChooseLocation: true,
          location: {
            name: res.name,
            address: res.address,
            latitude: res.latitude,
            longitude: res.longitude
          }
        })
      },
      fail: () => {
        wx.getSetting({
          success: res => {
            if (!res.authSetting['scope.userLocation']) {
              wx.showModal({
                title: '位置授权提示',
                content: '检测到您未开启位置权限，为了使用地图功能，是否前往我的页面进行授权管理',
                showCancel: false,
                success: res => {
                  if (res.confirm) {
                    wx.switchTab({
                      url: '../mine/mine'
                    })
                  }
                }
              })
            }
          },
          fail: function (res) {
            wx.showToast({
              title: '打开授权窗口失败',
              icon: 'success',
              duration: 1000
            })
          }
        })
      }
    })
  },

  publish: function (e) {
    if (this.data.textareaValue.length == 0 || this.data.textareaValue.replace(/(^s*)|(s*$)/g, "").length == 0) {
      wx.showToast({
        title: "内容不可为空",
        icon: 'none',
        mask: true
      })
    } else {
      wx.cloud.callFunction({
        name: "msgCheck",
        data: {
          content: this.data.textareaValue
        }
      }).then(res => {
        console.log(res)
        if (res.result.errCode == 87014) {
          wx.showModal({
            title: '内容安全检查',
            content: '您上传的内容中含有违法违规信息',
          })
        } else {
          wx.showLoading({
            title: '正在上传中...',
            mask: true
          })
          this.data.break = false
          this.uploadTopic()
        }
      })
    }
  },

  async uploadTopic() {
    let topic = {
      type: this.data.topicType,
      imgList: [],
      viewNum: 0,
      thumbNum: 0,
      commentNum: 0
    }
    if (this.data.public) {
      await userInfo.where({
        _openid: app.globalData.openId
      }).field({
        avatarUrl: true,
        nickName: true
      }).get().then(res => {
        console.log(res.data)
        topic.avatarUrl = res.data[0].avatarUrl
        topic.nickName = res.data[0].nickName
      })
    } else {
      topic.avatarUrl = this.data.avatarUrl
      topic.nickName = this.data.nickNames[topic.type - 1]
    }
    if (this.data.imgList.length != 0) {
      for (let i = 0; i < this.data.imgList.length; i++) {
        if (this.data.break) {
          console.log('break')
          break
        }
        let randString = Math.floor(Math.random() * 10000).toString()
        let fileName = Date.now().toString() + "_" + randString + this.data.imgList[i].match(/\.[^.]+?$/)[0]
        if (this.data.imgList[i].indexOf("cloud://") > -1) {
          topic.imgList[i] = this.data.imgList[i]
          console.log('continue')
          continue
        }
        let fileID = '';
        await wx.cloud.uploadFile({
          cloudPath: "photos/" + fileName,
          filePath: this.data.imgList[i]
        }).then(res => {
          console.log(res.fileID)
          fileID = res.fileID
        }).catch(console.error)
        await wx.cloud.callFunction({
          name: "imgCheck",
          data: {
            fileID: fileID
          }
        }).then(res1 => {
          console.log(res1)
          if (res1.result.errCode == 87014) {
            wx.showModal({
              title: '内容安全检查',
              content: '您上传的第' + i + '张图片中包含违法违规信息',
            })
            this.data.break = true
          } else {
            this.data.imgList[i] = fileID
            topic.imgList[i] = fileID
          }
        })
      }
    }
    topic.content = this.data.textareaValue
    topic.createTime = db.serverDate()
    if (this.data.isChooseLocation) {
      let location = this.data.location
      topic.point = db.Geo.Point(location.longitude, location.latitude)
      topic.location = location
    }
    topics.add({
      data: topic
    }).then(res => {
      console.log(res)
      wx.hideLoading()
      wx.showToast({
        title: '发布成功',
        mask: true,
        success: () => {
          app.globalData.hasPublish = true
          topic.createTime = new Date()
          topic._id = res._id
          topic._openid= app.globalData.openId
          app.globalData.publishTopic = topic
          setTimeout(() => {
            wx.navigateBack({
              delta: 1
            })
          }, 1000);
        }
      })
    })
  }
})