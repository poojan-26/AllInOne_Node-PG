const config = require('../../utils/config')
const responseHelper = require('../../utils/responseHelper')
const remarkHelper = require('../helpers/remarkHelper')
const remarkValidator = require('../validators/remarkValidator')

class Remarks {

    async getRemarks(req, res) {
        try {
            delete req.body['user_id']
            await remarkValidator.validateGetRemarksRequest(req.body)
            let response = await remarkHelper.getRemarks(req.body)
            responseHelper.success(res, 'GET_REMARK_SUCCESS', req.headers.language, response.data, '', response.total)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }

    async addEditRemark(req, res) {
        try {
            delete req.body['user_id']
            await remarkValidator.validateAddEditRemarkRequest(req.body)
            if ('remark_id' in req.body) {  // Request for edit the vehicle Part data
                let remarkData = await remarkHelper.isRemarkExist(req.body);
                if (remarkData.length === 0) {
                    throw 'REMARK_DATA_NOT_FOUND'
                }
                if (remarkData.length > 0) {
                    req.body['created_date'] = remarkData[0].created_date;
                }
            }
            let response = await remarkHelper.addEditRemark(req.body)
            responseHelper.success(res, req.body.vehicle_part_id ? 'EDIT_REMARK_SUCCESS' : 'ADD_REMARK_SUCCESS', req.headers.language, response)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }

    async updateRemarkStatus (req, res) {
        try {
            delete req.body['user_id'];
            await remarkValidator.validateUpdateRemarkStatusRequest(req.body)
			let response = await remarkHelper.updateRemarkStatus(req.body);
            responseHelper.success(res, 'EDIT_REMARK_SUCCESS', req.headers.language, response)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new Remarks()