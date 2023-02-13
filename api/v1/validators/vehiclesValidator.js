const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This VehiclesValidator class contains all vehicle related API's validation. This class' functions are called from vehicles controller.
 */

class VehiclesValidator {
    async validateGetVehicleBrands(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                is_car: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetVehicleModels(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                is_car: joi.number().integer().required(),
                brand_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetVehicleTypes(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                is_car: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetVehicleColors(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddVehicleForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                is_car: joi.number().integer().required(),
                vehicle_brand: joi.number().integer().required(),
                vehicle_model: joi.number().integer().required(),
                vehicle_color: joi.number().integer().required(),
                vehicle_number: joi.string().required(),
                building_id: joi.number().integer().required()
            })                
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async isVehicleExist(body, throw_error_for_exists) {
        try {
            let selectParams = '*',
                where = `vehicle_number='${body.vehicle_number}' AND is_deleted = 0`,
                vehicle = await db.select('customer_vehicle_relation', selectParams, where)
            if (throw_error_for_exists) {
                if (vehicle.length > 0) {
                    throw 'VEHICLE_ALREADY_EXISTS'
                } else {
                    return true
                }
            } else {
                if (vehicle.length > 0) {
                    if (vehicle[0].is_active) {
                        return vehicle[0]
                    } else {
                        throw 'VEHICLE_BLOCKED'
                    }
                } else {
                    throw 'VEHICLE_NOT_FOUND'
                }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }    
    async validateGetAllVehiclesForm(body) {
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
    async validateGetSingleVehicleForm(body) {
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
    async validateEditVehicleForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_id: joi.number().integer().required(),
                is_car: joi.number().integer().required(),
                vehicle_brand: joi.number().integer().required(),
                vehicle_model: joi.number().integer().required(),
                vehicle_color: joi.number().integer().required(),
                vehicle_number: joi.string().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateDeleteVehicleForm(body) {
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

module.exports = new VehiclesValidator()