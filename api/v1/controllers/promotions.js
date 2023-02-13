const config = require('../../utils/config')
const responseHelper = require('../../utils/responseHelper')
const promotionHelper = require('../helpers/promotionHelper')
const promotionValidator = require('../validators/promotionValidator')

class Promotions {

    async getPromotions(req, res) {
		try {
            delete req.body['user_id'];
            await promotionValidator.validateGetPromotionsRequest(req.body)
            let response = await promotionHelper.getPromotions(req.body)
			responseHelper.success(res, 'GET_PROMOTION_LIST_SUCCESS', req.headers.language, response.data, '', response.total)
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
    }
    
    async addEditPromotions(req, res) {
		try {
            delete req.body['user_id'];
            await promotionValidator.validateAddEditPromotionRequest(req.body)
            if ('promotional_id' in req.body) {  // Request for edit the subscription data
                let promotionData = await promotionHelper.isPromotionExist(req.body);
                if (promotionData.length === 0){
                    throw 'PROMOTIONAL_DATA_NOT_FOUND'
                }
                if (promotionData.length > 0) {
                    req.body['created_date'] = promotionData[0].created_date;
                }
            }
            let data = await promotionHelper.addEditPromotions(req.body)
			responseHelper.success(res, req.body.promotional_id ?'EDIT_PROMOTION_SUCCESS' :  'ADD_PROMOTION_SUCCESS', req.headers.language, data)
		} catch (error) {
			console.log(error)
			responseHelper.error(res, error, req.headers.language)
		}
    }
    
    async promotionStatusUpdate(req, res) {
        try {
            delete req.body['user_id'];
            await promotionValidator.validatePromotionStatusUpdateRequest(req.body)
            let data = await promotionHelper.promotionStatusUpdate(req.body)
            responseHelper.success(res, 'EDIT_PROMOTION_SUCCESS', req.headers.language, data)
        } catch (error) {
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new Promotions()