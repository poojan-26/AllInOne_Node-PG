const jwt = require('jsonwebtoken')
const semver = require('semver')
const promise = require('bluebird')

const config = require('./config')
const db = require('./db')
const responseHelper = require('./responseHelper')

class HeaderValidator {
  validateHeaders(headers) {
    let error
    if (!headers.language) {
      error = { param: 'language', type: 'required' }
    } else if (!headers.auth_token) {
      error = { param: 'auth_token', type: 'required' }
    } else if (!headers.web_app_version) {
      if (!headers.device_id) {
        error = { param: 'device_id', type: 'required' }
      } else if (!headers.device_type) {
        error = { param: 'device_type', type: 'required' }
      } else if (headers.device_type === '0' && !headers.ios_app_version) {
        error = 'APP_VERSION_MISSING'
      } else if (headers.device_type === '1' && !headers.android_app_version) {
        error = 'APP_VERSION_MISSING'
      } else if (!headers.os) {
        error = { param: 'os', type: 'required' }
      } else {
        let version = headers.android_app_version ? headers.android_app_version : headers.ios_app_version
        let currentAppVerision = headers.android_app_version ? config.androidAppVerision : config.iosAppVerision
        let tmp_version = version.split(".")
        tmp_version = tmp_version.length < 3 ? tmp_version.concat(['0', '0', '0']) : tmp_version
        tmp_version.splice(3)
        version = tmp_version.join(".")
        if (semver.valid(version) === null) {
          error = 'INVALID_APP_VERSION'
        } else {
          if (semver.satisfies(version, `>= ${currentAppVerision}`)) {
          } else {
            error = 'UPGRADE_APP'
          }
        }
      }
    }
    return error
  }

  nonAuthValidation(req, res, next) {
    console.log('======BODY========')
    console.log(req.body)
    let error = HV.validateHeaders(req.headers)
    if (error) {
      responseHelper.error(res, error, req.headers.language)
    } else if (req.headers.auth_token !== config.default_auth_token) {
      responseHelper.error(res, "INVALID_TOKEN", req.headers.language)
    } else {
      next()
    }
  }

  authValidation(req, res, next) {
    console.log('======BODY========')
    let error = HV.validateHeaders(req.headers)
    if (error) {
      responseHelper.error(res, error, req.headers.language)
    } else {
      let token = req.headers.auth_token;
      console.log('======token========', token)
      console.log('======config.JWTSecretKey========', config.JWTSecretKey)      
      jwt.verify(token, config.JWTSecretKey, (err, decoded) => {
        console.log("decodeddddd ::: ", decoded);
        if (err) {
          console.log("error==============", err);
          if (req.route.path === "/refreshToken") {
            console.log("refreshtoken next call");
            next()
          } else {
            responseHelper.error(res, 'TOKEN_EXPIRED', req.headers.language)
          }
        } else if (decoded && decoded.user_id && (decoded.user_type + 1)) {
          req.user_id = decoded.user_id
          req.body.user_id = decoded.user_id
          req.user_type = decoded.user_type
          if (decoded.is_admin) {
            delete req.body.user_id
            req.is_admin = decoded.is_admin;
            next()
          } else {
            HV.isUserActive(req, res, next, decoded)
          }
        } else {
          responseHelper.error(res, 'TOKEN_MALFORMED', req.headers.language)
        }
      })
    }
  }

  isAdmin(req, res, next) {
    if (req.is_admin) {
      next()
    } else {
      responseHelper.error(res, 'NOT_AUTHORISED', req.headers.language)
    }
  }

  isCustomer(req, res, next) {
    if (req.user_type === 0) {
      next()
    } else {
      responseHelper.error(res, 'NOT_AUTHORISED', req.headers.language)
    }
  }

  isExecutive(req, res, next) {
    if (req.user_type === 1 || req.user_type === 4) {
      next()
    } else {
      responseHelper.error(res, 'NOT_AUTHORISED', req.headers.language)
    }
  }

  isSupervisor(req, res, next) {
    if (req.user_type === 2) {
      next()
    } else {
      responseHelper.error(res, 'NOT_AUTHORISED', req.headers.language)
    }
  }

  isTopSupervisor(req, res, next) {
    if (req.user_type === 3) {
      next()
    } else {
      responseHelper.error(res, 'NOT_AUTHORISED', req.headers.language)
    }
  }

  isSupervisorOrTopSupervisor(req, res, next) {
    if (req.user_type === 2 || req.user_type === 3) {
      next()
    } else {
      responseHelper.error(res, 'NOT_AUTHORISED', req.headers.language)
    }
  }

  isExecutiveOrSupervisor(req, res, next) {
    if (req.user_type === 1 || req.user_type === 4 || req.user_type === 2) {
      next()
    } else {
      responseHelper.error(res, 'NOT_AUTHORISED', req.headers.language)
    }
  }

  isExecutiveOrSupervisorOrTopSupervisor(req, res, next) {
    if (req.user_type === 1 || req.user_type === 4 || req.user_type === 2 || req.user_type === 3) {
      next()
    } else {
      responseHelper.error(res, 'NOT_AUTHORISED', req.headers.language)
    }
  }

  async isUserActive(req, res, next, decoded) {
    let selectParams = 'is_active',
      where = `customer_id='${decoded.user_id}'`,
      user = ''
    if (decoded.user_type == 0) {
      user = await db.select('customer', selectParams, where)
    } else if (decoded.user_type == 1 || decoded.user_type == 2 || decoded.user_type == 3 || decoded.user_type == 4) {
      where = `service_provider_id='${decoded.user_id}'`
      user = await db.select('service_provider', selectParams, where)
    }
    if (user[0] && user[0].is_active) {
      next();
    } else {
      responseHelper.error(res, 'USER_BLOCKED', req.headers.language)
    }
  }

  authValidationSocket(req) {
    console.log('======BODY========')
    return new promise((resolve, reject) => {
      let error = HV.validateHeaders(req.headers)
      if (error) {
        reject(error)
      } else {
        let token = req.headers.auth_token;
        console.log('======token========', token)
        jwt.verify(token, config.JWTSecretKey, async (err, decoded) => {
          console.log("decoded ::: ", decoded);
          if (err) {
            // console.log(err);
            reject('TOKEN_EXPIRED')
          } else if (decoded && decoded.user_id && (decoded.user_type + 1)) {
            req.user_id = decoded.user_id
            req.user_type = decoded.user_type
            if (decoded.is_admin) {
              req.is_admin = decoded.is_admin;
            }
            const res_final = await HV.isUserActiveSocket(req, decoded)
            resolve(res_final)
          } else {
            reject('TOKEN_MALFORMED')
          }
        })
      }
    })
  }

  async isUserActiveSocket(req, decoded) {
    let selectParams = 'is_active ',
      where = ` service_provider_id='${decoded.user_id}' `,
      user = await db.select('service_provider', selectParams, where)
    if (user[0] && user[0].is_active) {
      return req
    } else {
      return promise.reject('USER_BLOCKED')
    }
  }

}

const HV = new HeaderValidator()
module.exports = HV
