const remarksHelper = require('../helpers/remarksHelper')
const remarksValidator = require('../validators/remarksValidator')
const responseHelper = require('../../utils/responseHelper')
const S3helper = require('../../utils/S3helper')

/**
 * This Remarks class contains all remarks related APIs.
 */

class Remarks {
    /**
     * API for retrieving vehicle parts
     * @param {number} is_car car or bike
     * @param {number} vehicle_part_type vehicle part type
     * @returns success response(status code 200)
     */
    async getAllVehicleParts(req, res) {
        try {
            await remarksValidator.validateGetAllVehiclePartsForm(req.body)
            let vehicle_parts = await remarksHelper.getVehicleParts(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_PARTS_SUCCESS', req.headers.language, vehicle_parts)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for retrieving remark names
    * @param {number} remark_type remark type
    * @returns success response(status code 200)
    */
    async getAllRemarkNames(req, res) {
        try {
            await remarksValidator.validateGetAllRemarkNamesForm(req.body)
            let remark_names = await remarksHelper.getRemarkNames(req.body, req.headers.language)
            responseHelper.success(res, 'GET_REMARK_NAMES_SUCCESS', req.headers.language, remark_names)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for adding remark by executive.
    * @param {number} vehicle_id vehicle id
    * @param {number} customer_id customer id
    * @param {number} vehicle_part_id vehicle part id
    * @param {number} remark_ids remark ids
    * @returns success response(status code 200)
    */
    async addRemark(req, res) {
        try {
            await remarksValidator.validateAddRemarkForm(req.body)
            if (req.file) {
                req.body.image = await S3helper.uploadImageOnS3("tekoto/remarks/", req.file)
            }
            await remarksHelper.insertRemark(req.body)
            responseHelper.success(res, 'ADD_REMARK_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for deleting remark by executive.
     * @param {number} remark_id remark id
     * @returns success response(status code 200) by deleting vehicle's remark
     */
    async deleteRemark(req, res) {
        try {
            await remarksValidator.validateDeleteRemarkForm(req.body)
            await remarksHelper.deleteRemark(req.body.remark_id)
            responseHelper.success(res, 'DELETE_REMARK_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving remarks vehicle wise given by executive.
     * @param {number} vehicle_id vehicle id
     * @returns success response(status code 200) with remarks details given by executive
     */
    async getRemarks(req, res) {
        try {
            await remarksValidator.validateGetRemarksForm(req.body)
            let remarks = await remarksHelper.getRemarks(req.body, req.headers.language)
            responseHelper.success(res, 'GET_REMARKS_SUCCESS', req.headers.language, remarks)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new Remarks()