// BudgetSMS Error Codes Documentation
// https://www.budgetsms.net/sms-http-api/error-code/

// SAMPLE Response
// OK 1234567 0.055 1 20416
//
// Breakdown
// ==========
// OK = successful submitted
// 1234567 = SMSid
// 0.055 = SMS price
// 1 = Number of SMS parts
// 20416 = mcc & mnc code combined (204 = Netherlands, 16 = T-Mobile)

const fetch = require('node-fetch')
const querystring = require('querystring')

function BudgetSMSAPI (auth) {
  // private members
  _httpOptions = {
    hostname: 'https://api.budgetsms.net',
    method: 'GET',
    path: 'sendsms'
  }

  _optionsShape = {
    userid: null,
    username: null,
    handle: null,
    from: null,
    to: null,
    msg: null
  }

  _options = auth || {}

  function _checkOptionsValidity () {
    Object.keys(_options).forEach(optionKey => {
      if (!_optionsShape.hasOwnProperty(optionKey)) {
        throw new Error(`Option '${optionKey}' does not exist`)
      }
    })
  }

  function _buildURL () {
    return `${_httpOptions.hostname}/${
      _httpOptions.path
    }?${querystring.stringify(_options)}`
  }

  // public members
  this.from = function (from) {
    _options = Object.assign({}, _options, { from })
    return this
  }

  this.to = function (to) {
    _options = Object.assign({}, _options, { to })
    return this
  }

  this.message = function (message) {
    _options = Object.assign({}, _options, { msg: message })
    return this
  }

  this.send = function () {
    _checkOptionsValidity()
    const URL = _buildURL()

    return fetch(URL).then(res => res.text())
  }

  this.test = function () {
    _checkOptionsValidity()
    const URL = _buildURL().replace('sendsms', 'testsms')

    return fetch(URL).then(res => res.text())
  }
}

module.exports = BudgetSMSAPI
