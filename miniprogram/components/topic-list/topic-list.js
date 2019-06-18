const db = wx.cloud.database()
const topics = db.collection('topics')
const comments = db.collection('comments')
const _ = db.command
const app = getApp()
const common = require('../../common')
Component({
  options: {
    addGlobalClass: true
  },
  /**
   * 组件的属性列表
   */
  properties: {
    topicList: {
      type: Array,
      value: []
    },
    topicType: String,
    nickName: String,
    avatarUrl: String,
    // 页面获取的说说类型，1表示表白墙，2表示寻物志，3表示吐槽屋
    topicType: {
      type: String,
      value: '1'
    },
    needWrite: {
      type: Boolean,
      value: true
    },
    emptyTip: {
      type: String,
      value: '数据为空'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    totalCount: 0,
    loading: true,
    //上划刷新时，如果全部加载完成，则该值为true，显示'没有更多'
    noMore: false,
    //上划加载完成的处理函数
    callback: {
      success: function () {},
      fail: function () {}
    },
    //判断是否是第一次加载
    isEmpty: true,
    needComment: false,
    focus: false,
    blur: false,
    comment_text: '',
    placeholder: "就不说一句吗？"
  },

  lifetimes: {
    // 在组件在视图层布局完成后执行,它与attached不同：attached执行在页面onLoad()之前，ready执行在页面onLoad()之后
    attached: function() {
      setTimeout(() => {
        this.setData({
          loading: true
        })
        this.getList()
      }, 400)
    }
  },

  pageLifetimes: {
    show: function () {
      if (app.globalData.hasPublish) {
        let list = [app.globalData.publishTopic]
        this.handleData(list)
        this.properties.topicList.unshift(list[0])
        console.log(this.properties.topicList)
        this.setData({
          topicList: this.properties.topicList
        })
        app.globalData.hasPublish = false
      }
      if (this.data.detailId) {
        topics.orderBy('createTime', 'desc')
          .where({
            _id: this.data.detailId
          }).field({
            thumbNum: true,
            thumbList: true,
            viewNum: true,
            commentNum: true
          }).get().then(res => {
            console.log(res.data)
            for (let i = 0; i < res.data.length; i++) {
              const item = res.data[i]
              item.thumbState = false
              item.thumbs = ''
              if (item.thumbList && item.thumbList.length != 0) {
                item.thumbs = item.thumbList.join('、')
                if (item.thumbList.indexOf(app.globalData.nickName) > -1) {
                  item.thumbState = true
                }
              } else {
                item.thumbList = []
              }
              let thumbStr = 'topicList[' + i + '].thumbs'
              let thumbNumStr = 'topicList[' + i + '].thumbNum'
              let thumbStateStr = 'topicList[' + i + '].thumbState'
              let thumbListStr = 'topicList[' + i + '].thumbList'
              let viewNumStr = 'topicList[' + i + '].viewNum'  
              let commentNumStr = 'topicList[' + i + '].commentNum'
              this.setData({
                [thumbStateStr]: item.thumbState,
                [thumbNumStr]: item.thumbNum,
                [thumbStr]: item.thumbs,
                [thumbListStr]: item.thumbList,
                [viewNumStr]: item.viewNum,
                [commentNumStr]: item.commentNum
              })
            }
          })
      }
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {

    /**
     * 处理点赞相关的数据
     */
    handleThumb: function (list) {
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        item.thumbState = false
        item.thumbs = ''
        if (item.thumbList && item.thumbList.length != 0) {
          item.thumbs = item.thumbList.join('、')
          if (item.thumbList.indexOf(app.globalData.nickName) > -1) {
            item.thumbState = true
            console.log(item.thumbState)
          }
        }
      }
    },

    /**
     * 处理获取到的数据，图片加载应当分开进行以提高性能
     * @param {} list 
     */
    handleData: function (list) {
      this.handleThumb(list)
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        // 时间格式化
        item.createTime = common.dateFormat('yyyy年MM月dd日 hh:mm', item.createTime)
        // 图片处理，使用云文件ID换取临时URL
        wx.cloud.getTempFileURL({
          fileList: item.imgList
        }).then(res => {
          console.log(res.fileList)
          for (let i = 0; i < res.fileList.length; i++) {
            item.imgList[i] = res.fileList[i].tempFileURL
          }
          let imgStr = 'topicList[' + i + '].imgList'
          this.setData({
            [imgStr]: item.imgList
          })
        }).catch(console.error)
      }
    },

    getList: function () {
      topics.orderBy('createTime', 'desc')
        .where({
          type: this.properties.topicType
        }).skip(this.data.totalCount).limit(20).get().then(res => {
          console.log(res)
          let totalTopicList = []
          this.setData({
            loading: false
          })
          this.handleData(res.data)
          let topicList = res.data
          if (topicList.length == 0) {
            this.setData({
              noMore: true
            })
            this.data.callback.success();
            //如果是第一次加载，且从数据库加载数据为空，则表示数据库还没有数据
            if (this.data.isEmpty) {
              this.setData({
                emptyTip: "没有数据~"
              })
            }
          } else {
            if (!this.data.isEmpty) {
              //在上划刷新时通过totalExpList.concat将返回的Array数组链接到原有的数组后边，再传递给totalExpList，达到上划刷新的功能。只有在非第一次请求时才执行该语句，如果第一次执行的话进入else分支
              totalTopicList = this.properties.topicList.concat(topicList);
            } else {
              totalTopicList = topicList
              this.data.isEmpty = false
            }
            this.setData({
              topicList: totalTopicList
            })
            this.data.callback.success()
          }
        }).catch(err => {
          console.error(err)
          this.setData({
            loading: false
          })
          this.data.callback.fail()
        })
    },

    /**
     * 跳转到详情页
     */
    viewDetail: function (e) {
      if (this.data.blur) {
        this.data.blur = false
        return
      }
      let doc_id = e.currentTarget.dataset.id
      let index = e.currentTarget.dataset.index
      topics.doc(doc_id).update({
        data: {
          viewNum: _.inc(1)
        }
      }).then(res => {
        this.data.detailId = doc_id
        app.globalData.detailTopic = this.properties.topicList[index]
        wx.navigateTo({
          url: '/pages/detail/detail'
        })
      })

    },

    /**
     * 预览图片
     */
    viewImage: function (e) {
      if (this.data.blur) {
        this.data.blur = false
        return
      }
      let dataset = e.currentTarget.dataset
      wx.previewImage({
        urls: this.properties.topicList[dataset.index].imgList,
        current: dataset.url
      });
    },

    /**
     * 点赞
     */
    thumb: function (e) {
      if (this.data.blur) {
        this.data.blur = false
        return
      }
      let doc_id = e.currentTarget.dataset.id
      let index = e.currentTarget.dataset.index
      let topic = this.properties.topicList[index]
      let thumbStr = 'topicList[' + index + '].thumbs'
      let thumbNumStr = 'topicList[' + index + '].thumbNum'
      let thumbStateStr = 'topicList[' + index + '].thumbState'
      let thumbListStr = 'topicList[' + index + '].thumbList'
      let state = !topic.thumbState
      if (state) {
        topics.doc(doc_id).update({
          data: {
            thumbList: _.push(this.properties.nickName),
            thumbNum: _.inc(1)
          }
        }).then(res => {
          let thumbList = []
          if (topic.thumbList) {
            topic.thumbList.push(this.properties.nickName)
            thumbList = topic.thumbList
          } else {
            thumbList.push(this.properties.nickName)
          }
          let thumbs = thumbList.join('、')
          console.log(thumbList)
          console.log(thumbs)
          this.setData({
            [thumbStateStr]: state,
            [thumbNumStr]: topic.thumbNum + 1,
            [thumbStr]: thumbs,
            [thumbListStr]: thumbList
          })
        })
      } else {
        topics.doc(doc_id).update({
          data: {
            thumbList: _.pop(),
            thumbNum: _.inc(-1)
          }
        }).then(res => {
          topic.thumbList.pop()
          let thumbList = topic.thumbList
          console.log(thumbList)
          let thumbs = thumbList.join('、')
          console.log(thumbs)
          this.setData({
            [thumbStateStr]: state,
            [thumbNumStr]: topic.thumbNum - 1,
            [thumbListStr]: thumbList,
            [thumbStr]: thumbs
          })
        })
      }
    },

    /**
     * 点击评论按钮
     */
    comment: function (e) {
      let doc_id = e.currentTarget.dataset.id
      let index = e.currentTarget.dataset.index
      this.setData({
        needComment: true,
        focus: true,
        avatarUrl: this.properties.avatarUrl,
        comment_index: index,
        comment_topic_id: doc_id
      })
    },

    /**
     * 获取评论内容
     */
    getCommentText: function (e) {
      this.setData({
        comment_text: e.detail.value
      })
    },

    /**
     * 评论框失去焦点
     */
    onReplyBlur: function (e) {
      this.setData({
        focus: false,
        needComment: false,
        blur: true
      })
    },

    writeTopic: function (e) {
      console.log(this.properties.topicType)
      wx.navigateTo({
        url: '/pages/publish/publish?type=' + this.properties.topicType
      })
    },

    sendComment: function () {
      let comment_detail = {}
      comment_detail.comment_user_name = this.properties.nickName
      comment_detail.comment_user_avatar = this.properties.avatarUrl
      comment_detail.comment_topic_id = this.data.comment_topic_id
      comment_detail.comment_text = this.data.comment_text
      comment_detail.comment_time = db.serverDate()
      comment_detail.reply_id = 0
      comment_detail.parent_id = 0
      comment_detail.comment_thumb_num = 0
      console.log(comment_detail)
      comments.add({
          data: comment_detail
        }).then(res => {
          console.log(res)
          topics.doc(this.data.comment_topic_id).update({
            data: {
              commentNum: _.inc(1)
            }
          }).then(res => {
            let commentNumStr = 'topicList[' + this.data.comment_index + '].commentNum'
            this.setData({
              [commentNumStr]: this.data.topicList[this.data.comment_index].commentNum + 1,
              comment_text: ''
            })
          })
        })
        .catch(console.error)
    },

    //自定义下拉刷新事件
    onRefresh: function (e) {
      console.log(e)
      var that = this
      that.setData({
        noMore: false,
        callback: e.detail
      })
      setTimeout(function () {
        that.properties.topicList = []
        that.data.totalCount = 0
        that.data.isEmpty = true
        that.getList();
      }, 500)
    },
    //自定义上拉加载事件 
    onLoadMore: function (e) {
      console.log(e)
      var that = this;
      that.setData({
        noMore: false,
        callback: e.detail
      })
      setTimeout(function () {
        that.data.totalCount += 20;
        that.getList();
      }, 500)
    }
  }
})