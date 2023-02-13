const db = require('../utils/db')
const config = require('../utils/config')
const dateHelper = require('../utils/dateHelper')
const messages = require('../utils/messages.json')
const promise = require('bluebird')
const FCM = require('fcm-node')
let FCM_SERVER_KEY = config.FCMApiKey
let fcm = new FCM(FCM_SERVER_KEY)
const moment = require('moment')

class NotificationHelper {
  // insertNotification(notification_text, customer_id, notify_type, bold_text, language) {
  //   let data = {
  //     customer_id: customer_id,
  //     notify_type: notify_type,
  //     is_read: 0,
  //     message: [language][notification_text],
  //     bold_text: messages[language][bold_text],
  //     created_date: dateHelper.getCurrentTimeStamp(),
  //     modified_date: dateHelper.getCurrentTimeStamp()
  //   }

  //   db.insert('admin_sent_notifications', data);
  // }  

  sendNotification(data) {
    let count
    db.select('admin_message_customer_relation', 'COUNT(customer_id) as unread_count', ` customer_id = '${data.customer_id}' AND is_read = 0`)
      .then((result) => {
        count = result[0].unread_count
        return db.select('customer_device_relation', 'device_token, device_type', ` customer_id = '${data.customer_id}' AND allow_notification = 1`)
      })
      .then((result) => {
        let android_device_token = []
        let ios_device_token = []
        for (let r of result) {
          if (r.device_type == 1) {
            android_device_token.push(r.device_token)
          } else {
            ios_device_token.push(r.device_token)
          }
        }
        if (android_device_token.length > 0) {
          this.buildFCM(data.bold_text, data.notification_text, data, count, 1, android_device_token)
        }
        if (ios_device_token.length > 0) {
          this.buildFCM(data.bold_text, data.notification_text, data, count, 0, ios_device_token)
        }
      })
      .catch((error) => {
        console.log(error)
      })
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

  updateIsRead(body) {
    let data = {
      is_read: 1
    }
    return db.update('admin_message_customer_relation', `customer_id = '${body.customer_id}'`, data);   
  }

  getNotificatoinList(user_id, page_no) {
    let query = `WHERE receiver_id = ${user_id} ORDER BY notification_id DESC`
    if (page_no) {
      query += ` limit ${config.orderListLimit} offset ${(page_no - 1) * config.orderListLimit}`
    }
    let selectParams = `*`
    return db.select('lb_notifications', selectParams, query)
  }

  getUnreadCounts(user_id) {
    let query = `WHERE receiver_id = ${user_id} AND is_read = 0`
    let selectParams = `COUNT(notification_id) as unread_count`
    return db.select('lb_notifications', selectParams, query)
  }
}

module.exports = new NotificationHelper()
