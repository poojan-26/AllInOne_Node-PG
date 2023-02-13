const config = require('./config')
const BudgetSMSAPI = require('budgetsms-node')
const BudgetSMS = new BudgetSMSAPI({
    username: config.budget_sms_username,
    userid: config.budget_sms_user_id,
    handle: config.budget_sms_handle
})

class SmsHelper {
  sendSMS (to, msg) {
    console.log('======SMS======', to, msg)
    BudgetSMS.from('Tekoto')
    .to(to)
    .message(msg)
    .test()
    // .send()
    .then(json => console.log(json))
    .catch(error => console.error(error))
  }
}

module.exports = new SmsHelper()
