const db = require('../../utils/db')
const bcrypt = require('bcryptjs');
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

class SubscriptionValidator {

	async validateGetSubscriptionsRequest(body) {
		try {
			let schema = joi.object().keys({
				limit: joi.number().required(),
				page_no: joi.number().required(),				
				search: joi.string().optional()
			})
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
	}

	async validateGetAddSubscriptionsRequest(body) {
		try {
			let schema = joi.object().keys({
				
			})
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
	}

	async validateAddEditSubscriptionRequest(body) {
		try {
			let keys = {				
				subscription_promotional_relation_id: joi.number().optional(),
				type_id: joi.number().required(),
				subscription_plan_id: joi.number().required(),
				subscription_duration_id: joi.number().required(),
				promotional_ids: joi.array().required(),
				original_price: joi.number().min(0).required(),
				promotional_price: joi.number().min(0).required()
			}
			let schema = joi.object().keys(keys)
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
    }

}

module.exports = new SubscriptionValidator()