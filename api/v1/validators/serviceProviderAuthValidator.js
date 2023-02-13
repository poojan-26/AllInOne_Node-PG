const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This ServiceProviderAuthValidator class contains all Service Providers(Executive, Supervisor, Top-supervisor) account related API's validation. This class' functions are called from serviceProviderAuth controller.
 */

class ServiceProviderAuthValidator {
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
    async isUserWithPhoneExist(body, throw_error_for_exists) {
        try {
            let selectParams = '*',
                where = `country_code='${body.country_code}' and phone_number='${body.phone_number}'`,
                user = await db.select('service_provider', selectParams, where)
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
    async validateSetMinimumExteriorJobsForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                minimum_exterior_jobs: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetSingleExecutiveForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                executive_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetSingleCustomerForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                customer_id: joi.number().integer().required(),
                vehicle_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetExecutivesByLatitudeLongitudeForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                latitude: joi.number().required(),
                longitude: joi.number().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetSingleSupervisorForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                supervisor_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
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
    async validateReadNotificationForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                type: joi.number().required(),
                unique_id: joi.string().allow('')
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetNotificationForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                page_no: joi.number().integer()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new ServiceProviderAuthValidator()