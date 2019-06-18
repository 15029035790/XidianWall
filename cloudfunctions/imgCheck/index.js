const cloud = require('wx-server-sdk')

cloud.init()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const res = await cloud.downloadFile({
      fileID: event.fileID
    })
    const result = await cloud.openapi.security.imgSecCheck({
      media: {
        contentType: 'image/' + event.fileID.match(/\.[^.]+?$/)[0].substring(1),
        value: res.fileContent
      }
    })
    return result
  } catch (err) {
    const fileIDs = [event.fileID]
    await cloud.deleteFile({
      fileList: fileIDs
    })
    return err
  }
}