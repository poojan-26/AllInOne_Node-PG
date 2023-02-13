const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')
const language = config.language;


/**
 * This class contains configuration edit related API's validation.
 */


class CustomerValidator {
    async getCustomerListValidator(body) {
        try {
            let schema = joi.object().keys({
                search: joi.string().optional(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    
    async customerStatusUpdateValidator(body) {
        try {
            let schema = joi.object().keys({
                customer_id: joi.number().required(),
                is_active: joi.number().valid([1,0]).required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    
    async sendMessageValidator(body) {
        try {
            let schema = joi.object().keys({
                customer_id: joi.array().min(1).required(),
                title: joi.string().trim().required(),
                message: joi.string().trim().required(),
                type: joi.number().valid(1,2).required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new CustomerValidator();