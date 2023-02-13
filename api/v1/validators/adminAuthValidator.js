const db = require('../../utils/db')
const bcrypt = require('bcryptjs');
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')


/**
 * This AdminAuthValidator class contains admin login and auth token related API's validation.
 */


class AdminAuthValidator {
    async validateSigninForm(body) {
        try {
            let schema = joi.object().keys({
                username: joi.string().required(),
                password: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateSendForgotPasswordMailForm(body) {
        try {
            let schema = joi.object().keys({
                email: joi.string().email().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateResetPasswordForm(body) {
        try {
            let schema = joi.object().keys({
                new_password: joi.string().min(8).required(),
                confirm_new_password: joi.string().min(8).required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
            if (body.new_password != body.confirm_new_password) { throw ('PASSWORD_CONFIRM_PASSWORD_DIFFERENT') }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateChnagePasswordForm(body) {
        try {
            let schema = joi.object().keys({
                old_password: joi.string().min(8).required(),
                new_password: joi.string().min(8).required(),
                confirm_new_password: joi.string().min(8).required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
            if (body.new_password != body.confirm_new_password) { throw ('PASSWORD_CONFIRM_PASSWORD_DIFFERENT') }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isUserWithEmailExist(email, throw_error_for_exists) {
        try {
            let selectParams = '*',
                where = `email='${email}'`,
                user = await db.select('admin', selectParams, where)
            if (throw_error_for_exists) {
                if (user.length > 0) {
                    throw 'USER_WITH_EMAIL_ALREADY_EXISTS'
                } else {
                    return true
                }
            } else {
                if (user.length > 0) {
                    return user[0]
                } else {
                    throw 'USER_WITH_EMAIL_NOT_FOUND'
                }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isUserWithUserNameExist(username, throw_error_for_exists) {
        try {
            let selectParams = '*',
                where = `username='${username}'`,
                user = await db.select('admin', selectParams, where)
            if (throw_error_for_exists) {
                if (user.length > 0) {
                    throw 'USER_WITH_EMAIL_ALREADY_EXISTS'
                } else {
                    return true
                }
            } else {
                if (user.length > 0) {
                    return user[0]
                } else {
                    throw 'USER_WITH_USERNAME_NOT_FOUND'
                }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validatePassword(db_password, body_password) {
        try {            
            if (db_password != body_password) {
                throw 'INCORRECT_PASSWORD'
            }            
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isTokenExists(token) {
        try {
            let selectParams = '*',
                where = `auth_token='${token}'`,
                db_token = await db.select("admin_auth_relation", selectParams, where)
            if (db_token && db_token.length > 0) {
                return db_token
            } else {
                throw 'INVALID_TOKEN'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new AdminAuthValidator()