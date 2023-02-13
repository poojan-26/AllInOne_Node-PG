const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const codeHelper = require('../../utils/codeHelper')
const db = require('../../utils/db')

/**
 * This UserAuthHelper class contains all customer account related API's logic and required database operations. This class' functions are called from userAuth controller.
 */

class UserAuthHelper {
    async generateReferralCode(body) {
        try {
            let digitcode = codeHelper.getDigitCode();
            let name = body.full_name.slice(0, 4).toLowerCase();
            let referralCode = name + digitcode;
            referralCode = referralCode.replace(/\s/g, '');  // remove white space if exist in user's name.
            let result = await db.select('customer', '*', `referral_code = '${referralCode}'`)
            if (result.length > 0) {
                this.generateReferralCode(body)
            } else {
                return referralCode
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserFromReferralCode(referral_code) {
        try {
            let refer_user_id = await db.select('customer', 'customer_id', `referral_code = '${referral_code}'`)
            if (refer_user_id.length > 0) {
                return refer_user_id[0].customer_id
            } else {
                throw 'INVALID_REFERRAL_CODE'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateOTP(customer_id, otp) {
        try {
            let where = `customer_id=${customer_id}`,
                data = {
                    otp: otp,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('customer', where, data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async addOrUpdateUserDeviceRelation(user, headers) {
        try {
            let data = {
                customer_id: user.customer_id,
                allow_notification: 1,
                device_token: headers.device_token,
                device_id: headers.device_id,
                device_type: headers.device_type,
                os: headers.os,
                app_version: headers.android_app_version ? headers.android_app_version : headers.ios_app_version,
                modified_date: dateHelper.getCurrentTimeStamp()
            },
            where = ` device_id = '${headers.device_id}' and customer_id = ${user.customer_id}`,
            selectParams = '*',
            device_data = await db.select('customer_device_relation', selectParams, where)
            if (device_data.length > 0) {
                await db.update('customer_device_relation', where, data)
            } else {
                data.created_date = dateHelper.getCurrentTimeStamp()
                await db.insert('customer_device_relation', data)
            }
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async deleteUserDeviceRelation(body) {
        try {
            let condition = ` customer_id = ${body.user_id} AND device_id = '${body.device_id}'`
            await db.delete('customer_device_relation', condition)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateVerificationStatus(user) {
        try {
            let where = `customer_id=${user.customer_id}`,
                data = {
                    otp: '',
                    is_verified: 1,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('customer', where, data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async getCustomerGUID(body) {
        try {
            let selectParams = 'guid',
                where = `country_code='${body.country_code}' and phone_number='${body.phone_number}'`,
                customer = await db.select('customer', selectParams, where)
            return customer[0].guid
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async updateGuid(body) {
        try {
            let guid = await codeHelper.getUniqueCode(),
                where = `country_code='${body.country_code}' and phone_number='${body.phone_number}'`,
                data = {
                    guid: guid,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('customer', where, data)
            return guid
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async checkLink(body) {
        try {
            // console.log(body)
            let where = `guid = '${body.guid}'`,
                selectParams = 'customer_id',
                customer = await db.select('customer', selectParams, where)
            return customer
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async resetPassword(user, body) {
        try {
            let where = `customer_id=${user.customer_id}`,
                data = {
                    otp: '',
                    password: body.new_password,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('customer', where, data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async getCustomerProfile(customer_id) {
        try {
            let where = `customer_id = ${customer_id}`,
                selectParams = '*',
                customer = await db.select('customer', selectParams, where)
            return customer
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async changePassword(body) {
        try {
            let data = {
                password: body.new_password,
                modified_date: dateHelper.getCurrentTimeStamp()
            },
                where = `customer_id=${body.user_id}`
            await db.update('customer', where, data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async insertUser(body) {
        try {
            let data = {
                full_name: body.full_name,
                iso: body.iso,
                country_code: body.country_code,
                phone_number: body.phone_number,
                email: body.email,
                password: body.password,
                otp: body.otp,
                referral_code: body.referral_code,
                refer_user_id: body.refer_user_id ? body.refer_user_id : null,
                guid: body.guid,
                is_active: 1,
                is_verified: 0,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            let user = await db.insert('customer', data)
            return user
        } catch (error) {
            return promise.reject(error)
        }
    }
    async addReferralRecord(body, user, referral_code) {
        try {
            let data = {
                customer_id: user.customer_id,
                referred_by_customer_id: body.refer_user_id,
                referral_code: referral_code,
                is_successful: 0,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            await db.insert('referral', data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUser(user_id) {
        try {
            let selectParams = `customer_id, full_name, iso, country_code, phone_number, email, age, gender, profile_picture, otp, referral_code, location, latitude, longitude, building_id, has_any_active_plan`,
                where = `customer_id = ${user_id}`
            let user = await db.select('customer', selectParams, where)
            if (user.length == 0) {
                throw 'USER_NOT_FOUND'
            } else {
                return user[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateUser(body, user) {
        try {
            if (body.email != user.email) {
                let email = await db.select('customer', '*', `email = '${body.email}'`)
                if (email.length > 0) {
                    throw 'USER_WITH_EMAIL_ALREADY_EXISTS'
                }
            }
            let condition = `customer_id = ${body.user_id}`,
                data = {
                    full_name: body.full_name,
                    email: body.email,
                    age: body.age,
                    gender: body.gender,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            if (body.profile_picture) {
                data.profile_picture = body.profile_picture
            }
            let result = await db.update('customer', condition, data)
            if (result.rowCount == 0) {
                throw 'USER_NOT_FOUND'
            } else {
                let selectParams = 'c.*, b.building_name',
                joins = ` LEFT JOIN building b ON b.building_id = c.building_id`,
                user = await db.select('customer c' + joins, selectParams, condition)
                return user[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async changeMobileNumber(body) {
        try {
            let condition = `customer_id = ${body.user_id}`,
                data = {
                    iso: body.iso,
                    country_code: body.country_code,
                    phone_number: body.phone_number,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('customer', condition, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new UserAuthHelper()