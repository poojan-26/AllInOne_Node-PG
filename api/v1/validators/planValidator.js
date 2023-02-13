const db = require('../../utils/db')
const bcrypt = require('bcryptjs');
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

class PlanValidator {
	async validateGetPlanRequest(body) {
		try {
			let schema = joi.object().keys({
				limit: joi.number().required(),
				page_no: joi.number().required(),
				user_id: joi.number().optional(),
				search: joi.string().optional()                               
			})
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
	}

	async validateAddEditPlan(body) {
		try {
			// Plan, details, and wash details data will extract from each lang objects...
			let schema = {
				subscription_plan_id: joi.number().required().optional(),
				// subscription_plan: joi.string().strict().trim().required(),
				// subscription_details: joi.string().strict().trim().required(),				
				// interior_wash_details: joi.string().strict().trim().required(),
				subscription_plan_lang: joi.object().keys({
					en: joi.string().trim().label('Plan name in english').required(),
					tr: joi.string().trim().label('Plan name in turkish').required(),
					fa: joi.string().trim().label('Plan name in farsi').required(),
					ar: joi.string().trim().label('Plan name in arabic').required(),
				}).required(),
				subscription_details_lang: joi.object().keys({
					en: joi.string().trim().label('Subscription details in english').required(),
					tr: joi.string().trim().label('Subscription details in turkish').required(),
					fa: joi.string().trim().label('Subscription details in farsi').required(),
					ar: joi.string().trim().label('Subscription details in arabic').required(),
				}).required(),
				interior_wash_details_lang: joi.object().keys({
					en: joi.string().trim().label('Interior wash details in english').required(),
					tr: joi.string().trim().label('Interior wash details in turkish').required(),
					fa: joi.string().trim().label('Interior wash details in farsi').required(),
					ar: joi.string().trim().label('Interior wash details in arabic').required(),
				}).required(),
				exterior_wash_counts: joi.number().required(),
				interior_wash_counts: joi.number().required(),
			}
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
	}

	async validatePlanStatusUpdate(body){
		try {
			let keys = {	
				subscription_plan_id: joi.number().required(),			
				is_active: joi.number().valid([0,1]).required()
			}
			let schema = joi.object().keys(keys)
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
	}

	async validateAddEditDurationRequest(body) {
		try {
			let keys = {				
				subscription_plan_duration_id: joi.number().optional(),
				duration_month: joi.number().min(1).max(12).required(),
				duration_title_lang:  joi.object().keys({
					en: joi.string().trim().label('Duration in english').required(),
					tr: joi.string().trim().label('Duration in turkish').required(),
					fa: joi.string().trim().label('Duration in farsi').required(),
					ar: joi.string().trim().label('Duration in arabic').required(),
				}).required()
			}
			let schema = joi.object().keys(keys)
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
	}

	async validateGetDurationsRequest(body) {
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

	async validateDurationStatusUpdate(body){
		try {
			let keys = {	
				subscription_plan_duration_id: joi.number().required(),			
				is_active: joi.number().valid([0,1]).required()
			}
			let schema = joi.object().keys(keys)
			await joiValidator.validateJoiSchema(body, schema);
		} catch (error) {
			return promise.reject(error)
		}
	}
}

module.exports = new PlanValidator()