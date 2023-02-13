const db = require('../../utils/db')
const bcrypt = require('bcryptjs');
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This UserAuthValidator class contains all customer account related API's validation. This class' functions are called from userAuth controller.
 */

class UserAuthValidator {
    async validateSignupForm(body) {
        try {
            let schema = joi.object().keys({
                full_name: joi.string().required(),
                iso: joi.string().required(),
                country_code: joi.string().required(),
                phone_number: joi.string().required(),
                password: joi.string().required(),                
                email: joi.string().email().allow(''),
                referral_code: joi.string().allow(''),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateResendOTPForm(body) {
        try {
            let schema = joi.object().keys({
                country_code: joi.string().required(),
                phone_number: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateVerifyOTPForm(body) {
        try {
            let schema = joi.object().keys({
                country_code: joi.string().required(),
                phone_number: joi.string().required(),
                otp: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateSigninForm(body) {
        try {
            let schema = joi.object().keys({
                country_code: joi.string().required(),
                phone_number: joi.string().required(),
                password: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
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
    async validateOldPassword(db_password, body_password) {
        try {
            if (db_password != body_password) {
                throw 'INCORRECT_OLD_PASSWORD'
            }
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateForgotPasswordForm(body) {
        try {
            let schema = joi.object().keys({
                country_code: joi.string().required(),
                phone_number: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateCheckLinkForm(body) {
        try {
            let schema = joi.object().keys({
                guid: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateResetPasswordForm(body) {
        try {
            let schema = joi.object().keys({
                new_password: joi.string().required(),
                country_code: joi.string().required(),
                phone_number: joi.string().required(),
                otp: joi.number().integer().required()            
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateChnagePasswordForm(body) {
        try {
            let schema = joi.object().keys({
                old_password: joi.string().required(),
                new_password: joi.string().required(),
                user_id: joi.required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }    
    async validateEditProfileForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                full_name: joi.string().required(),
                email: joi.string().email().allow(''),
                age: joi.number().integer().allow(''),
                gender: joi.number().integer().allow('')                
            })            
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateChangeMobileNumberForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                iso: joi.string().required(),
                country_code: joi.string().required(),
                phone_number: joi.string().required()              
            })            
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async verifyOTPForMobileChangeForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                iso: joi.string().required(),
                country_code: joi.string().required(),
                phone_number: joi.string().required(),
                otp: joi.number().integer().required()
            })            
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isUserWithPhoneExist(body, throw_error_for_exists) {
        try {
            let selectParams = 'c.*, b.building_name',
                joins = ` LEFT JOIN building b ON b.building_id = c.building_id`,
                where = `country_code='${body.country_code}' and phone_number='${body.phone_number}'`,
                user = await db.select('customer c' + joins, selectParams, where)
            if (throw_error_for_exists) {
                if (user.length > 0) {
                    throw 'USER_WITH_PHONE_ALREADY_EXISTS'
                } else {
                    return true
                }
            } else {
                if (user.length > 0) {
                    if (user[0].is_active) {
                        return user[0]
                    } else {
                        throw 'USER_BLOCKED'
                    }
                } else {
                    throw 'USER_WITH_PHONE_NOT_FOUND'
                }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isUserWithEmailExist(body, throw_error_for_exists) {
        try {
            let selectParams = '*',
                where = `email='${body.email}'`,
                user = await db.select('customer', selectParams, where)
            if (throw_error_for_exists) {
                if (user.length > 0) {
                    throw 'USER_WITH_EMAIL_ALREADY_EXISTS'
                } else {
                    return true
                }
            } else {
                if (user.length > 0) {
                    if (user[0].is_active) {
                        return user[0]
                    } else {
                        throw 'USER_BLOCKED'
                    }
                } else {
                    throw 'USER_WITH_EMAIL_NOT_FOUND'
                }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteUserDeviceRelationForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                device_id: joi.required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new UserAuthValidator()