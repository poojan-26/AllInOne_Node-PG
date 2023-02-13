const carServiceManagementHelper = require('../helpers/carServiceManagementHelper')
const carServiceManagementValidator = require('../validators/carServiceManagementValidator')
const responseHelper = require('../../utils/responseHelper')

class CarServiceManagement {
   async getAllCarData(req, res) {
        try {
            delete req.body['user_id'];
            await carServiceManagementValidator.getAllCarDataValidator(req.body);
            let response = await carServiceManagementHelper.getAllCarData(req.body,req.headers.language);
            console.log('getAllCarData', response)
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }
    async updateVehicleStatus(req, res) {
        try {
            delete req.body['user_id'];
            await carServiceManagementValidator.updateVehicleStatusValidator(req.body);
            let response = await carServiceManagementHelper.updateVehicleStatus(req.body,req.headers.language);
            console.log('updateVehicleStatus', response)
            responseHelper.success(res, 'VEHICLE_STATUS_UPDATED_SUCCESSFULLY', req.headers.language, '', '', '');
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }
}
module.exports = new CarServiceManagement()