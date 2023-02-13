const db = require('../utils/db')
const config = require('../utils/config')
const dateHelper = require('../utils/dateHelper')
const messages = require('../utils/messages.json')
const FCM = require('fcm-node')
let FCM_SERVER_KEY = config.FCMApiKey
let fcm = new FCM(FCM_SERVER_KEY)

class NotificationHelper { 
  insertNotification (notify_id, title, text, sender_id, receiver_id, notify_type, unique_id, language, notification_table, is_from_customer) {
      let data = {
        notify_id: notify_id,
        title: messages[language][title],
        text: messages[language][text],
        sender_id: sender_id,
        receiver_id: receiver_id,
        notify_type: notify_type,
        unique_id: unique_id,
        is_read: 0,
        created_date: dateHelper.getCurrentTimeStamp(),
        modified_date: dateHelper.getCurrentTimeStamp(),
        is_deleted: 0,
        is_from_customer: is_from_customer
      }
      // if (notify_type == 6 || notify_type == 7) {
      //   data.text = messages[language][text].replace('@@MINUTES@@', time).replace('@@USER_NAME@@', user_name).replace('@@TIME@@', moment(order_request_time, 'hh:mm:ss a').format('hh:mm A'))
      // } else if (notify_type == 1 || notify_type == 3 || notify_type == 5 || notify_type == 9 || notify_type == 4 || notify_type == 10) {
      //   data.text = messages[language][text].replace('@@USER_NAME@@', user_name).replace('@@DATE@@', moment(order_request_date).format('LL')).replace('@@TIME@@', moment(order_request_time, 'hh:mm:ss a').format('hh:mm A'))
      // } 
      db.insert(notification_table, data)
      return data
  }

  async sendNotification(data, notification_table, notification_id, device_table, user_id_column_name ) {
    let count = await db.select(notification_table, ` COUNT(${notification_id}) as unread_count`, ` receiver_id = ${data.receiver_id} AND is_read = 0`)
    count = count[0].unread_count
    let devcie_data = await db.select(device_table, `device_token, device_type`, ` ${user_id_column_name} = ${data.receiver_id} AND allow_notification = 1`)
    let android_device_token = [], ios_device_token = []
    for (let d of devcie_data) {
      if (d.device_type == 1) {
        android_device_token.push(d.device_token)
      } else {
        ios_device_token.push(d.device_token)
      }
    }
    if (android_device_token.length > 0) {
      this.buildFCM(data.title, data.text, data, count, 1, android_device_token)
    }
    if (ios_device_token.length > 0) {
      this.buildFCM(data.title, data.text, data, count, 0, ios_device_token)
    }
  }

  buildFCM(title, body, data, count, device_type, device_token) {    
    let payload = {}
    payload.priority = 'high'
    payload.registration_ids = device_token

    data.sound = 'default'
    data.badge = count    
    if (device_type == 0) {
      payload.notification = {}
      payload.notification.title = title
      payload.notification.body = body
      for (let key in data) {
        payload.notification[key] = data[key]
      }
      payload.notification.badge = data.badge
    } else if (device_type == 1) {
      payload.data = data
    }

    console.log("=======Payload=======", payload)
    this.sendFCM(payload)
  }

  sendFCM(payload) {
    fcm.send(payload, (err, response) => {
      if (err) {
        console.log('====================fcm error ::', err)
      } else {
        console.log('================Notification Sent')
        console.log(response)
      }
    })
  }

  async readNotification(body, notification_table) {
    let data = {
      is_read: 1,
      modified_date: dateHelper.getCurrentTimeStamp()
    }
    if (body.type == 1) {  // single notification read (from push notification)
      return await db.update(notification_table, `unique_id = '${body.unique_id}'`, data)
    } else {  // all notifications read (from notification section)
      return await db.update(notification_table, `receiver_id = ${body.user_id}`, data);   
    }
  }

  async getNotification(body, notification_table, notification_id) {
    let condition = ` receiver_id = ${body.user_id} ORDER BY ${notification_id} DESC`
    let pagination = '', selectParams = '*'
    if (body.page_no) {
      pagination = ` LIMIT ${Number(config.notificaionCount)} OFFSET ${Number(config.notificaionCount) * (Number(body.page_no) - 1)}`
    }
    // if ('page_no' in body) {
    //   let userVehicleWashHistoryCount = await db.select('vehicle_wash_active_week aw' + join, `COUNT(*)`, where)
    //   return { userVehicleWashHistory, userVehicleWashHistoryCount: userVehicleWashHistoryCount[0].count };
    // } else {  // this is used for getVehicleWashDetail api(page no not required)
    //     return { userVehicleWashHistory };
    // }
    return await db.select(notification_table, selectParams, condition + pagination)
  }

  async getUnreadCounts(user_id) {
    let query = ` receiver_id = ${user_id} AND is_read = 0`
    let selectParams = `COUNT(notification_id) as unread_count`
    return await db.select('lb_notifications', selectParams, query)
  }
}

module.exports = new NotificationHelper()
