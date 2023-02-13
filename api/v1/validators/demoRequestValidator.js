const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')
const language = config.language;


/**
 * This DemoRequestValidator class contains demo request add edit list related API's validation.
 */


class DemoRequestValidator {

    async getDemoRequestValidator(body) {
        try {
            let schema = joi.object().keys({
                search: joi.string().optional(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required(),
                is_assigned: joi.number().optional()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    async assignDemoToCustomerValidator(body) {
        try {
            let schema = joi.object().keys({
                final_date: joi.string().required(),
                final_time: joi.string().required(),
                is_assigned: joi.number().optional(),
                demo_request_id:joi.number().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new DemoRequestValidator()