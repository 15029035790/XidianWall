const db = wx.cloud.database()
const topics = db.collection('topics')
const comments = db.collection('comments')
const _ = db.command
const app = getApp()
const common = require('../../common')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    needComment: false,
    focus: false,
    blur: false,
    pageNum: 0,
    empty: false,
    commentThumbState: false,
    loadStatus: 'loading',
    isShow: false,
    type: 0, // 评论类型：1表示对文章的评论，2表示对某条评论的回复，3表示对回复的回复
    comment_text: '',
    now_reply_to_name: '',
    placeholder: "就不说一句吗？",
    topic: {},
    comment_list: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let topic = app.globalData.detailTopic
    topic.viewNum += 1
    console.log(topic)
    this.setData({
      topic: topic,
      avatarUrl: app.globalData.avatarUrl,
      nickName: app.globalData.nickName
    })
    // 获取所有相关的评论和回复数据
    comments.orderBy('comment_time', 'asc')
    .where({
      comment_topic_id: this.data.topic._id
    }).limit(20).get().then(res => {
      console.log(res.data)
      for (let i = 0; i < res.data.length; i++) {
        // 时间格式化
        res.data[i].comment_time = common.dateFormat('yyyy年MM月dd日 hh:mm', res.data[i].comment_time)
        let replyList = res.data[i].reply_list
        if (replyList && replyList.length != 0) {
          for (let j = 0; j < replyList.length; j++) {
            const item = replyList[j];
            item.reply_time = common.dateFormat('yyyy年MM月dd日 hh:mm', item.reply_time)
          }
        }
      }
      this.setData({
        comment_list: res.data
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
      urls: this.data.topic.imgList,
      current: dataset.url
    });
  },

  /**
   * 点赞
   */
  thumb: function () {
    if (this.data.blur) {
      this.data.blur = false
      return
    }
    let doc_id = this.data.topic._id
    let topic = this.data.topic
    let thumbStr = 'topic.thumbs'
    let thumbNumStr = 'topic.thumbNum'
    let thumbStateStr = 'topic.thumbState'
    let thumbListStr = 'topic.thumbList'
    let state = !topic.thumbState
    if (state) {
      topics.doc(doc_id).update({
        data: {
          thumbList: _.push(app.globalData.nickName),
          thumbNum: _.inc(1)
        }
      }).then(res => {
        let thumbList = []
        if (topic.thumbList) {
          topic.thumbList.push(app.globalData.nickName)
          thumbList = topic.thumbList
        } else {
          thumbList.push(app.globalData.nickName)
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
    console.log(e.currentTarget.dataset.type)
    this.setData({
      needComment: true,
      focus: true,
      type: e.currentTarget.dataset.type,
      placeholder: ''
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
    let that = this;
    that.setData({
      focus: false,
      needComment: false,
      blur: true
    })
  },

  /**
   * 点击回复评论或再回复
   */
  replyComment: function (e) {
    let dataset = e.currentTarget.dataset
    this.setData({
      focus: true,
      type: dataset.type,
      now_reply_to_name: dataset.name,
      now_comment_id: dataset.cid,
      now_comment_index: dataset.index,
      needComment: true,
      placeholder: '回复' + dataset.name + ":"
    })
  },

  sendComment: function (e) {
    if (this.data.type == 1) {
      // 评论该文章
      let comment = {}
      comment.comment_user_name = app.globalData.nickName
      comment.comment_user_avatar = app.globalData.avatarUrl
      comment.comment_topic_id = this.data.topic._id
      comment.comment_text = this.data.comment_text
      comment.comment_time = db.serverDate()
      comment.comment_thumb_num = 0
      console.log(comment)
      comments.add({
          data: comment
        }).then(res => {
          console.log(res)
          topics.doc(this.data.topic._id).update({
            data: {
              commentNum: _.inc(1)
            }
          }).then(res1 => {
            let commentNumStr = 'topic.commentNum'
            let commentList = this.data.comment_list
            comment._id = res._id
            comment.comment_time = common.dateFormat('yyyy年MM月dd日 hh:mm', new Date())
            commentList.push(comment)
            this.setData({
              [commentNumStr]: this.data.topic.commentNum + 1,
              comment_list: commentList
            })
          })
        })
        .catch(console.error)
    } else if (this.data.type == 2) {
      // 回复该评论或回复某条回复
      let reply = {}
      reply.reply_from_name = app.globalData.nickName
      reply.reply_to_name = this.data.now_reply_to_name
      reply.reply_text = this.data.comment_text
      reply.reply_time = db.serverDate()
      comments.doc(this.data.now_comment_id).update({
        data: {
          reply_list: _.push(reply)
        }
      }).then(res => {
        topics.doc(this.data.topic._id).update({
          data: {
            commentNum: _.inc(1)
          }
        }).then(res => {
          comments.where({
            _id: this.data.now_comment_id
          }).field({
            reply_list: true
          }).get()
          .then(res => {
            console.log(res.data[0].reply_list)
            let commentNumStr = 'topic.commentNum'
            let replyListStr = 'comment_list[' + this.data.now_comment_index + '].reply_list'
            this.setData({
              [commentNumStr]: this.data.topic.commentNum + 1,
              [replyListStr]: res.data[0].reply_list,
              comment_text: ''
            })
          })
        })
      }).catch(console.error)
    }
  },

  /**
   * 给评论点赞
   */
  commentThumb: function (e) {
    let cid = e.currentTarget.dataset.cid
    let index = e.currentTarget.dataset.index 
    if (this.data.comment_list[index].comment_thumb_state) {
      comments.doc(cid).update({
        data: {
          comment_thumb_num: _.inc(-1)
        }
      }).then(res => {
        let commentThumbNumStr = 'comment_list[' + index + '].comment_thumb_num'
        let commentThumbStateStr = 'comment_list[' + index + '].comment_thumb_state'
        this.setData({
          [commentThumbStateStr]: false,
          [commentThumbNumStr]: this.data.comment_list[index].comment_thumb_num - 1
        })
      })
    } else {
      comments.doc(cid).update({
        data: {
          comment_thumb_num: _.inc(1)
        }
      }).then(res => {
        let commentThumbNumStr = 'comment_list[' + index + '].comment_thumb_num'
        let commentThumbStateStr = 'comment_list[' + index + '].comment_thumb_state'
        this.setData({
          [commentThumbStateStr]: true,
          [commentThumbNumStr]: this.data.comment_list[index].comment_thumb_num + 1
        })
      })
    } 
    
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    comments.orderBy('comment_time', 'asc')
    .where({
      comment_topic_id: this.data.topic._id
    }).limit(20).get().then(res => {
      console.log(res.data)
      for (let i = 0; i < res.data.length; i++) {
        // 时间格式化
        res.data[i].comment_time = common.dateFormat('yyyy年MM月dd日 hh:mm', res.data[i].comment_time)
        let replyList = res.data[i].reply_list
        if (replyList && replyList.length != 0) {
          for (let j = 0; j < replyList.length; j++) {
            const item = replyList[j];
            item.reply_time = common.dateFormat('yyyy年MM月dd日 hh:mm', item.reply_time)
          }
        }
      }
      this.setData({
        comment_list: res.data
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
      comments.orderBy('comment_time', 'asc')
      .where({
        comment_topic_id: this.data.topic._id
      })
        .skip(page * 20)
        .limit(20).get()
        .then(res => {
          console.log(res.data)
          if (res.data.length != 0) {
            for (let i = 0; i < res.data.length; i++) {
              // 时间格式化
              res.data[i].comment_time = common.dateFormat('yyyy年MM月dd日 hh:mm', res.data[i].comment_time)
              let replyList = res.data[i].reply_list
              if (replyList && replyList.length != 0) {
                for (let j = 0; j < replyList.length; j++) {
                  const item = replyList[j];
                  item.reply_time = common.dateFormat('yyyy年MM月dd日 hh:mm', item.reply_time)
                }
              }
            }
            this.setData({
              comment_list: this.data.comment_list.concat(res.data),
              pageNum: page,
              isShow: false
            })
          } else {
            this.data.empty = true
            this.setData({
              loadStatus: 'over'
            })
          }
        }).catch(err => {
          this.setData({
            loadStatus: 'erro'
          })
        })
    }
  }
})