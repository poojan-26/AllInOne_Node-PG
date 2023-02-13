const vehiclesHelper = require('../helpers/vehiclesHelper')
const vehiclesValidator = require('../validators/vehiclesValidator')
const responseHelper = require('../../utils/responseHelper')
const S3helper = require('../../utils/S3helper')
const config = require('../../utils/config')

/**
 * This Vehicles class contains all vehicle related APIs.
 */

class Vehicles {
    /**
     * API for retrieving vehicle's brands
     * @param {number} is_car 1: car 0: bike
     * @returns success response(status code 200) with vehicle's brands based on car/bike
     * @date 2019-12-20
     */
    async getVehicleBrands(req, res) {
        try {
            await vehiclesValidator.validateGetVehicleBrands(req.body)
            let vehicle_brands = await vehiclesHelper.getVehicleBrands(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_BRANDS_SUCCESS', req.headers.language, vehicle_brands)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving vehicle's models based on vehicle brands
     * @param {number} is_car 1: car 0: bike
     * @param {number} brand_id vehicle brand's id
     * @returns success response(status code 200) with vehicle's models based on car/bike brands
     * @date 2019-12-20
     */
    async getVehicleModels(req, res) {
        try {
            await vehiclesValidator.validateGetVehicleModels(req.body)
            let vehicle_models = await vehiclesHelper.getVehicleModels(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_MODELS_SUCCESS', req.headers.language, vehicle_models)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving vehicle's types
     * @param {number} is_car 1: car 0: bike
     * @returns success response(status code 200) with vehicle's types based on car/bike
     * @date 2019-12-20
     */
    async getVehicleTypes(req, res) {
        try {
            await vehiclesValidator.validateGetVehicleTypes(req.body)
            let vehicle_types = await vehiclesHelper.getVehicleTypes(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_TYPES_SUCCESS', req.headers.language, vehicle_types)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving vehicle's colors
     * @returns success response(status code 200) with vehicle's colors
     * @date 2019-12-20
     */
    async getVehicleColors(req, res) {
        try {
            await vehiclesValidator.validateGetVehicleColors(req.body)
            let vehicle_colors = await vehiclesHelper.getVehicleColors(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_COLORS_SUCCESS', req.headers.language, vehicle_colors)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Add vehicle API
     * @param {number} is_car 1: car 0: bike
     * @param {number} vehicle_brand vehicle brand id
     * @param {number} vehicle_model vehicle model id
     * @param {number} vehicle_color vehicle color id
     * @param {string} vehicle_number vehicle number plate
     * @param {number} building_id customer's building id
     * @param {file} vehicle_image vehicle's image (optional)
     * @returns success response(status code 200) by adding a vehicle
     * @date 2019-12-20
     */
    async addVehicle(req, res) {
        try {
            console.log("===========", req.body)
            req.body.user_id = req.user_id
            await vehiclesValidator.validateAddVehicleForm(req.body)
            await vehiclesValidator.isVehicleExist(req.body, true)
            if (req.file) {
                req.body.vehicle_image = await S3helper.uploadImageOnS3("tekoto/vehicles/", req.file)
            }
            await vehiclesHelper.insertVehicle(req.body)
            responseHelper.success(res, 'ADD_VEHICLE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving all vehicle's details
     * @param {number} page_no page number
     * @returns success response(status code 200) with vehicle's details based on pagination
     * @date 2019-12-23
     */
    async getAllVehicles(req, res) {
        try {
            await vehiclesValidator.validateGetAllVehiclesForm(req.body)
            let vehicles = await vehiclesHelper.getAllVehicles(req.body, req.user_id, req.headers.language)
            responseHelper.success(res, 'GET_ALL_VEHICLES_SUCCESS', req.headers.language, { total: Number(vehicles.vehiclesCount), total_page: Math.ceil(vehicles.vehiclesCount / config.paginationCount), vehicles: vehicles.vehicles })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving particular vehicle's details
     * @param {number} vehicle_id vehicle id
     * @returns success response(status code 200) with selected vehicle's details
     * @date 2019-12-23
     */
    async getSingleVehicle(req, res) {
        try {
            await vehiclesValidator.validateGetSingleVehicleForm(req.body)
            let vehicle = await vehiclesHelper.getSingleVehicle(req.body.vehicle_id, req.headers.language)
            responseHelper.success(res, 'GET_SINGLE_VEHICLE_SUCCESS', req.headers.language, vehicle)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Edit vehicle's details API
     * @param {number} is_car 1: car 0: bike
     * @param {number} vehicle_id vehicle id
     * @param {number} vehicle_brand vehicle brand id
     * @param {number} vehicle_model vehicle model id
     * @param {number} vehicle_color vehicle color id
     * @param {string} vehicle_number vehicle number plate
     * @param {file} vehicle_image vehicle's image (optional)
     * @returns success response(status code 200) by editing a vehicle
     * @date 2019-12-23
     */
    async editVehicle(req, res) {
        try {
            req.body.user_id = req.user_id
            await vehiclesValidator.validateEditVehicleForm(req.body)
            let vehicle = await vehiclesHelper.getSingleVehicle(req.body.vehicle_id, req.headers.language)
            // if (req.file) {
            //     req.body.vehicle_image = await S3helper.uploadImageOnS3("tekoto/vehicles/", req.file)
            //     if (vehicle.vehicle_image != null || vehicle.vehicle_image != '') {
            //         S3helper.deleteImageFromS3(vehicle.vehicle_image)
            //     }
            // }
            await vehiclesHelper.editVehicle(req.body)
            responseHelper.success(res, 'EDIT_VEHICLE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for deleting vehicle
     * @param {number} vehicle_id vehicle id
     * @returns success response(status code 200) by deleting vehicle
     * @date 2019-12-20
     */
    async deleteVehicle(req, res) {
        try {
            await vehiclesValidator.validateDeleteVehicleForm(req.body)
            let vehicle = await vehiclesHelper.getSingleVehicle(req.body.vehicle_id, req.headers.language)
            if (vehicle.vehicle_image != null || vehicle.vehicle_image != '') {
                S3helper.deleteImageFromS3(vehicle.vehicle_image)
            }
            await vehiclesHelper.deleteVehicle(req.body)
            responseHelper.success(res, 'DELETE_VEHICLE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new Vehicles()