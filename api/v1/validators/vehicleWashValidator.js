const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')

/**
 * This VehicleWashValidator class contains all vehicle wash related API's validation. This class' functions are called from vehicleWash controller.
 */

class VehicleWashValidator {
    async validateGetWashServicesAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                wash_type: joi.number().integer().required(),
                is_for_executive: joi.number().integer().required(),
                service_provider_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateStartDayAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                building_id: joi.string().required(),
                latitude: joi.number().required(),
                longitude: joi.number().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateEndDayAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetUserVehicleWashDetailAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_wash_id: joi.number().integer().required(),
                vehicle_id: joi.number().integer().required(),
                is_completed: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateUploadVehicleImageAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_id: joi.number().integer().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetUserVehicleWashHistoryListAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                page_no: joi.number().integer(),
                is_for_executive: joi.number().integer().required(),
                service_provider_id: joi.number().integer().required(),
                vehicle_wash_date: joi.string().regex(config.dateRegex).allow('')
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetIncompletedPromotionsForm(body) {
        try {
            const schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddPreWashImagesForm(body) {
        try {
            const schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_wash_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddPostWashImagesForm(body) {
        try {
            const schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_wash_id: joi.number().integer().required(),
                promotion_ids: joi.required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAddVehicleWashDataForm(body) {
        try {
            const promotionScema = joi.object({
                id: joi.number().integer().required(),
                image: joi.string().required()
            }),
                washScema = joi.object({
                    job_status: joi.any(),
                    vehicle_wash_id: joi.number().integer().required(),
                    start_time: joi.string().required(),
                    end_time: joi.string().required(),
                    vehicle_image: joi.array(),
                    pre_wash_images: joi.array().max(2).required(),
                    post_wash_images: joi.array().max(2).required(),
                    promotions: joi.array().items(promotionScema)
                }),
                schema = joi.object().keys({
                    user_id: joi.any(),
                    wash_data: joi.array().items(washScema).required()
                })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetRaisedTicketsForm(body) {
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
    async validateGetExecutivesForTicketForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                building_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateAssignTicketForm(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                vehicle_wash_id: joi.number().integer().required(),
                executive_id: joi.number().integer().required(),
                vehicle_wash_date: joi.string().regex(config.dateRegex).required(),
                ticket_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async validateGetWashServicesForTopSupervisorAPI(body) {
        try {
            let schema = joi.object().keys({
                user_id: joi.required(),
                wash_type: joi.number().integer().required(),
                service_provider_id: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new VehicleWashValidator()