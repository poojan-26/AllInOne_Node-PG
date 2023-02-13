const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This RemarksValidator class contains all remarks related API's validation. This class' functions are called from remarks controller.
 */

class RemarksValidator {
    async validateGetAllVehiclePartsForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                is_car: joi.number().integer().required(),
                vehicle_part_type: joi.number().integer().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetAllRemarkNamesForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                remark_type: joi.number().integer().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddRemarkForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_id: joi.number().integer().required(),
                customer_id: joi.number().integer().required(),
                vehicle_part_id: joi.number().integer().required(),
                remark_ids: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteRemarkForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                remark_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetRemarksForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new RemarksValidator()