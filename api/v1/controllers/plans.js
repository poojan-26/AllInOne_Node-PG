const config = require('../../utils/config')
const responseHelper = require('../../utils/responseHelper')
const planHelper = require('../helpers/planHelper')
const planValidator = require('../validators/planValidator')

class Plan {
	//plans

	async getPlans(req, res) {
		try {
			console.log(req.body)
			await planValidator.validateGetPlanRequest(req.body);
			let response = await planHelper.getPlans(req.body);
			responseHelper.success(res, 'GET_VEHICLE_BRANDS_SUCCESS', req.headers.language, response.data,'',response.total);
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
	}

	async addEditPlan(req, res) {
		try {
			delete req.body['user_id'];
			await planValidator.validateAddEditPlan(req.body);
			if ("subscription_plan_id" in req.body){
				let subscription_type = await planHelper.getLastSubscriptionTypeOrById(1, req.body);
				if(subscription_type.length == 0){
				throw 'PLAN_NOT_FOUND'
				}
				req.body['subscription_type'] = subscription_type[0].subscription_type;
				req.body['created_date'] = subscription_type[0].created_date;
			}else{
				let subscription_type = await planHelper.getLastSubscriptionTypeOrById(0, '');
				req.body['subscription_type'] = parseInt(subscription_type[0].subscription_type) + 1; // Increment last value + 1 
			}							
			await planHelper.addEditPlan(req.body);
			responseHelper.success(res, req.body.subscription_plan_id ? 'UPDATE_PLAN_SUCCESS' : 'ADD_PLAN_SUCCESS', req.headers.language, '');
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
	}

	async planStatusUpdate(req, res){
		try {
			delete req.body['user_id'];
			await planValidator.validatePlanStatusUpdate(req.body);
			let subscription_type = await planHelper.getLastSubscriptionTypeOrById(1, req.body);
			if(subscription_type.length === 0){
				throw 'PLAN_NOT_FOUND'
			}							
			await planHelper.planStatusUpdate(req.body);
			responseHelper.success(res, 'UPDATE_PLAN_SUCCESS', req.headers.language, '');
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
	}

	async getDurations(req, res) {
		try {
			delete req.body['user_id'];
			await planValidator.validateGetDurationsRequest(req.body);
			let data = await planHelper.getDurationList(req.body);
			responseHelper.success(res, 'GET_DURATION_LIST_SUCCESS', req.headers.language, data, '')
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
	}

	async addEditDuration(req, res) {
		try {			
			delete req.body['user_id'];
			await planValidator.validateAddEditDurationRequest(req.body);
			if ("subscription_plan_duration_id" in req.body){
				let duration_details = await planHelper.getDurationDetails(req.body);
				if(duration_details.length == 0){
				throw 'DURATION_NOT_FOUND'
				}				
				req.body['created_date'] = parseInt(duration_details[0].created_date);
			}
			let response = await planHelper.addEditDuration(req.body);
			responseHelper.success(res, req.body.subscription_plan_duration_id ? 'UPDATE_DURATION_SUCCESS' : 'ADD_DURATION_SUCCESS', req.headers.language, '')
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
	}

	async durationStatusUpdate(req, res){
		try {
			delete req.body['user_id'];
			await planValidator.validateDurationStatusUpdate(req.body);
			let subscription_type = await planHelper.getDurationDetails(req.body);	
			if(subscription_type.length === 0){
				throw 'DURATION_NOT_FOUND'
			}							
			await planHelper.durationStatusUpdate(req.body);
			responseHelper.success(res, 'UPDATE_DURATION_STAUTS', req.headers.language, '');
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
	}

	async getPromotions(req, res) {
		try {
			delete req.body['user_id'];
			await planValidator.validateDurationStatusUpdate(req.body)
			let data = await planHelper.durationStatusUpdate(req.body)
			responseHelper.success(res, 'UPDATE_DURATION_SUCCESS', req.headers.language, data, '')
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
	}
}

module.exports = new Plan()