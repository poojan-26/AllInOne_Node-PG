const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

class CarServiceManagementValidator {
    async getAllCarDataValidator(body) {
        try {
            let schema = joi.object().keys({
                search: joi.string().optional(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateVehicleStatusValidator(body) {
        try {
            let schema = joi.object().keys({
                vehicle_relation_id: joi.number().integer().required(),
                is_active: joi.number().integer().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}
module.exports = new CarServiceManagementValidator()