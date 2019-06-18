const db = wx.cloud.database()
const topics = db.collection('topics')
const comments = db.collection('comments')
const _ = db.command
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    pageNum: 0,
    empty: false,
    emptyTip: '你还没有发布任何说说！',
    loadStatus: 'loading',
    isShow: false,
    nickName: '个人用户',
    avatarUrl: 'http://qlogo3.store.qq.com/qzone/1954690602/1954690602/100?1514975404',
    topicList: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.data.topicListComponent = this.selectComponent('#topic-list')
    wx.showLoading({
      title: '加载中...',
      mask: true
    })
    topics.orderBy('createTime', 'desc')
      .where({
        _openid: app.globalData.openId
      }).limit(20).get().then(res => {
        console.log(res.data)
        this.data.topicListComponent.handleData(res.data)
        this.setData({
          topicList: res.data,
          nickName: app.globalData.nickName,
          avatarUrl: app.globalData.avatarUrl
        })
        wx.hideLoading()
      })

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    topics.orderBy('createTime', 'desc')
      .where({
        _openid: app.globalData.openId
      }).limit(20).get().then(res => {
        console.log(res.data)
        this.data.topicListComponent.handleData(res.data)
        this.setData({
          topicList: res.data
        })
        wx.stopPullDownRefresh()
      })
  },

  onReachBottom: function () {
    console.log(this.data.empty)
    if (this.data.empty) {
      console.log("没有更多数据")
    } else {
      this.setData({
        isShow: true,
        loadStatus: 'loading'
      })
      let page = this.data.pageNum + 1
      topics.orderBy('createTime', 'desc')
        .where({
          _openid: app.globalData.openId
        })
        .skip(page * 20)
        .limit(20).get()
        .then(res => {
          console.log(res.data)
          if (res.data.length != 0) {
            this.data.topicListComponent.handleData(res.data)
            this.setData({
              topicList: this.data.topicList.concat(res.data),
              pageNum: page,
              isShow: false
            })
          } else {
            this.data.empty = true
            this.setData({
              loadStatus: 'over'
            })
            if (this.data.topicList.length == 0) {
              this.setData({
                isShow: false
              })
            }
          }
        }).catch(err => {
          this.setData({
            loadStatus: 'erro'
          })
        })
    }
  }
})