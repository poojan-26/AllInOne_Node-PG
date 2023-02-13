const buildingDemoHelper = require('../helpers/buildingDemoHelper')
const buildingDemoValidator = require('../validators/buildingDemoValidator')
const responseHelper = require('../../utils/responseHelper')

/**
 * This BuildingDemo class contains building demo and location(or building) related APIs.
 */

class BuildingDemo {
    /**
     * API for retrieving available demo and its details buildingwise
     * @param {number} building_id building's id
     * @returns success response(status code 200) with demo details which is currently active
     */
    async getDemoByBuilding(req, res) {
        try {
            await buildingDemoValidator.validateGetDemoByBuildingAPI(req.body)
            let demoList = await buildingDemoHelper.getDemoByBuilding(req.body)
            responseHelper.success(res, 'GET_BUILDING_DEMO', req.headers.language, demoList[0])
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for scheduling demo
     * @param {number} building_id building's id
     * @param {string} schedule_date demo date
     * @param {string} schedule_time demo time
     * @returns success response(status code 200)
     */
    async setBuildingDemoSchedule(req, res) {
        try {
            await buildingDemoValidator.validateSetBuildingDemoScheduleAPI(req.body)
            let demoList = await buildingDemoHelper.setBuildingDemoSchedule(req.body)
            responseHelper.success(res, 'SCHEDULE_ADDED', req.headers.language, demoList[0])
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Customer's location change API
     * @param {string} location location
     * @param {number} latitude building's latitude
     * @param {number} longitude building's longitude
     * @param {number} building_id building's id
     * @param {number} is_update 1: yes
     * @returns success response(status code 200) by changing customer's location
     */
    async changeCustomerLocation(req, res) {
        try {
            await buildingDemoValidator.validateChangeCustomerLocationAPI(req.body)
            await buildingDemoHelper.changeCustomerLocation(req.body)
            delete req.body.user_id
            responseHelper.success(res, 'LOCATION_UPDATED', req.headers.language, req.body)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving nearby buildings based on given latitude and longitude 
     * @param {number} latitude building's latitude
     * @param {number} longitude building's longitude
     * @returns success response(status code 200) by changing customer's location
     */
    async getBuildingByLatitudeLongitude(req, res) {
        try {
            await buildingDemoValidator.validateGetBuildingByLatitudeLongitudeAPI(req.body)
            let demoList = await buildingDemoHelper.getBuildingByLatitudeLongitude(req.body, req.headers.language)
            responseHelper.success(res, 'BUILDING_FOUND', req.headers.language, demoList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for checking new building is in same complex of old building or not?
     * @param {number} building_id old building id
     * @param {number} change_building_id new building id
     * @param {string} location new building location
     * @param {number} latitude new building's latitude
     * @param {number} longitude new building's longitude
     * @returns success response(status code 200) with 1 or 0 value. 1: if new building is in same complex of old building, 0: else
     */
    async checkCustomerBuilding(req, res) {
        try {
            await buildingDemoValidator.validateCheckCustomerBuildingAPI(req.body)
            let customerBuilding = await buildingDemoHelper.checkCustomerBuilding(req.body)
            if(customerBuilding == 1) {
                responseHelper.success(res, 'LOCATION_CHANGED', req.headers.language, customerBuilding)
            } else {
                responseHelper.success(res, 'LOCATION_NOT_CHANGED', req.headers.language, customerBuilding)
            }
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new BuildingDemo()