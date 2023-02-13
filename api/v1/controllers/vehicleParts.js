const config = require('../../utils/config')
const responseHelper = require('../../utils/responseHelper')
const vehiclePartHelper = require('../helpers/vehiclePartHelper')
const vehiclePartValidator = require('../validators/vehiclePartValidator')

class VehicleParts {

    async getVehicleParts(req, res) {
        try {
            delete req.body['user_id']
            await vehiclePartValidator.validateGetVehiclePartsRequest(req.body)
            let response = await vehiclePartHelper.getVehicleParts(req.body)
            responseHelper.success(res, 'GET_VEHICLE_PART_SUCCESS', req.headers.language, response.data, '', response.total)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }

    async addEditVehiclePart(req, res) {
        try {
            delete req.body['user_id']
            await vehiclePartValidator.validateAddEditVehiclePartRequest(req.body)
            if ('vehicle_part_id' in req.body) {  // Request for edit the vehicle Part data
                let vehiclePartData = await vehiclePartHelper.isVehiclePartExist(req.body);
                if (vehiclePartData.length === 0) {
                    throw 'VEHICLE_PART_DATA_NOT_FOUND'
                }
                if (vehiclePartData.length > 0) {
                    req.body['created_date'] = vehiclePartData[0].created_date;
                }
            }
            let response = await vehiclePartHelper.addEditVehiclePart(req.body)
            responseHelper.success(res, req.body.vehicle_part_id ? 'EDIT_VEHICLE_PART_SUCCESS' : 'ADD_VEHICLE_PART_SUCCESS', req.headers.language, response)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new VehicleParts()