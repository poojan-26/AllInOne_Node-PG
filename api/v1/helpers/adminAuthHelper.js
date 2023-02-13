const bcrypt = require('bcryptjs')
const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')

/**
 * This AdminAuthHelper class contains admin security and auth related API's logic.
 */

class AdminAuthHelper {
    async changePassword(new_password, user_id) {
        try {
            let salt = bcrypt.genSaltSync(10),
                password = bcrypt.hashSync(new_password, salt),
                data = {
                    password: password,
                    modified_date: dateHelper.getCurrentTimeStamp()
                },
                where = `id='${user_id}'`
            await db.update('admin', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateToken(auth_token, old_token) {
        try {
            let where = `auth_token='${old_token}'`,
                data = {
                    auth_token: auth_token,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update("admin_auth_relation", where, data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async insertToken(user_id, auth_token) {
        try {
            let data = {
                user_id: user_id,
                auth_token: auth_token,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            await db.insert('admin_auth_relation', data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async selectCounts() {
        try {
            let users_count = await db.select('users', `COUNT(*)`),
                vehicle_type_count = await db.select('vehicle_types', `COUNT(*)`),
                brands_count = await db.select('brands', `COUNT(*)`),
                years_count = await db.select('years', `COUNT(*)`)
            return { users_count: users_count[0].count, vehicle_type_count: vehicle_type_count[0].count, brands_count: brands_count[0].count, years_count: years_count[0].count }
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
}

module.exports = new AdminAuthHelper()