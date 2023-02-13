const vehicleWashHelper = require('../helpers/vehicleWashHelper')
const vehicleWashValidator = require('../validators/vehicleWashValidator')
const responseHelper = require('../../utils/responseHelper')
const S3helper = require('../../utils/S3helper')
const config = require('../../utils/config')
const codeHelper = require('../../utils/codeHelper')
const notificationHelperApp = require('../../utils/notificationHelperApp')

/**
 * This VehicleWash class contains all vehicle wash related APIs.
 */

class VehicleWash {
    /**
     * API for listing today's vehicle wash services(exterior or interior)
     * @param {number} wash_type 1: exterior 2: interior
     * @param {number} is_for_executive 1: for executive's jobs 0: for supervisor's jobs(all under executives's jobs)
     * @param {number} service_provider_id service provider id
     * @returns success response(status code 200) with today's vehicle wash services(exterior or interior)
     */
    async getWashServices(req, res) {
        try {
            await vehicleWashValidator.validateGetWashServicesAPI(req.body)
            let washServiceList = await vehicleWashHelper.getWashServices(req.body, req.headers.language, req.user_type)
            responseHelper.success(res, 'GET_WASH_SERVICES_SUCCESS', req.headers.language, washServiceList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for starting day if executive is in specified area(500 m) of buildings only
     * @param {string} building_id building ids (comma separated)
     * @param {number} latitude executive's current latitude
     * @param {number} longitude executive's current longitude
     * @returns success response(status code 200) by starting executive's day
     */
    async startDay(req, res) {
        try {
            await vehicleWashValidator.validateStartDayAPI(req.body)
            await vehicleWashHelper.startDay(req.body)
            responseHelper.success(res, 'START_DAY_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for ending day
     * @returns success response(status code 200) by ending executive's day
     */
    async endDay(req, res) {
        try {
            await vehicleWashValidator.validateEndDayAPI(req.body)
            await vehicleWashHelper.endDay(req.body)
            responseHelper.success(res, 'END_DAY_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for retrieving details of particular vehicle wash with promotions details
     * @param {number} vehicle_wash_id vehicle wash id
     * @param {number} vehicle_id vehicle id
     * @param {number} is_completed 0: from daily services screen or 1: from history screen
     * @returns success response(status code 200) with vehicle wash details
     */
    async getUserVehicleWashDetail(req, res) {
        try {
            await vehicleWashValidator.validateGetUserVehicleWashDetailAPI(req.body)
            let vehicleWashDetails = await vehicleWashHelper.getUserVehicleWashDetail(req.body, req.headers.language)
            responseHelper.success(res, 'GET_VEHICLE_WASH_DETAIL_SUCCESS', req.headers.language, vehicleWashDetails)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for uploading vehicle image
     * @param {number} vehicle_id vehicle id
     * @param {file} vehicle_image vehicle's image (optional)
     * @returns success response(status code 200) by uploading vehicle image
     */
    async uploadVehicleImage(req, res) {
        try {
            req.body.user_id = req.user_id
            await vehicleWashValidator.validateUploadVehicleImageAPI(req.body)
            if (req.file) {
                req.body.vehicle_image = await S3helper.uploadImageOnS3("tekoto/vehicles/", req.file)
            }
            await vehicleWashHelper.uploadVehicleImage(req.body)
            delete req.body.user_id
            delete req.body.vehicle_id
            responseHelper.success(res, 'UPLOAD_VEHICLE_IMAGE_SUCCESS', req.headers.language, req.body)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for listing vehicle wash history
     * @param {number} page_no page no
     * @param {string} vehicle_wash_date date (filter by date wise)
     * @param {number} is_for_executive 1: for executive's jobs 0: for supervisor's jobs(all under executives's jobs)
     * @param {number} service_provider_id service provider id
     * @returns success response(status code 200) by listing vehicle wash history pagination wise or date wise
     */
    async getUserVehicleWashHistoryList(req, res) {
        try {
            await vehicleWashValidator.validateGetUserVehicleWashHistoryListAPI(req.body)
            let userVehicleWashHistory = await vehicleWashHelper.getUserVehicleWashHistoryList(req.body, req.headers.language, 1)
            responseHelper.success(res, 'GET_VEHICLE_WASH_HISTORY_SUCCESS', req.headers.language, { total: Number(userVehicleWashHistory.userVehicleWashHistoryCount), total_page: Math.ceil(userVehicleWashHistory.userVehicleWashHistoryCount / config.paginationCount), userVehicleWashHistory: userVehicleWashHistory.userVehicleWashHistory })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for adding vehicle wash images by executive.
    * @param {number} vehicle_id vehicle id
    * @returns success response(status code 200)
    */
    async getIncompletedPromotions(req, res) {
        try {
            // console.log(req.body, req.files)
            await vehicleWashValidator.validateGetIncompletedPromotionsForm(req.body)
            let subscriptions = await vehicleWashHelper.selectIncompletedPromotions(req.body, req.headers.language)
            responseHelper.success(res, 'GET_PROMOTIONS_SUCCESS', req.headers.language, subscriptions)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
    * API for adding vehicle prewash images by executive and for starting vehicle wash job.
    * @param {number} vehicle_wash_id vehicle wash id
    * @returns success response(status code 200)
    */
    async addPreWashImages(req, res) {
        try {
            // console.log(req.body, req.files)
            await vehicleWashValidator.validateAddPreWashImagesForm(req.body)
            if (req.files && req.files.length > 0) {
                req.body.car_wash_images = []
                for (let i = 0; i < req.files.length; i++) {
                    let image = await S3helper.uploadImageOnS3("tekoto/preCarWash/", req.files[i])
                    req.body.car_wash_images.push(image)
                }
            } else {
                throw 'AT_LEAST_ONE_IMAGE_REQUIRED'
            }
            await vehicleWashHelper.insertVehicleWashImages(req.body, 1)
            vehicleWashHelper.updateTime(req.body, "start_time")
            responseHelper.success(res, 'ADD_PRE_WASH_IMAGE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for adding vehicle postwash images and completed promotion images by executive and for ending vehicle wash job.
     * @param {number} vehicle_wash_id vehicle wash id
     * @returns success response(status code 200)
     */
    async addPostWashImages(req, res) {
        try {
            await vehicleWashValidator.validateAddPostWashImagesForm(req.body)
            req.body.car_wash_images = []
            req.body.promotion_images = []
            if (req.files && req.files.car_wash_images && req.files.car_wash_images.length > 0) {
                for (let i = 0; i < req.files.car_wash_images.length; i++) {
                    let image = await S3helper.uploadImageOnS3("tekoto/postCarWash/", req.files.car_wash_images[i])
                    req.body.car_wash_images.push(image)
                }
            } else {
                throw 'AT_LEAST_ONE_IMAGE_REQUIRED'
            }
            if (req.files && req.files.promotion_images && req.files.promotion_images.length > 0) {
                for (let i = 0; i < req.files.promotion_images.length; i++) {
                    let image = await S3helper.uploadImageOnS3("tekoto/promotions/", req.files.promotion_images[i])
                    req.body.promotion_images.push(image)
                }
            }
            await vehicleWashHelper.insertVehicleWashImages(req.body, 1)
            await vehicleWashHelper.insertPromotionImages(req.body)
            vehicleWashHelper.updateTime(req.body, "end_time")
            responseHelper.success(res, 'ADD_POST_WASH_IMAGE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for adding vehicle wash images and completed promotion images by executive and for ending vehicle wash job.
     * @param {number} vehicle_wash_id vehicle wash id
     * @param {string} start_time start time
     * @param {string} end_time end time
     * @param {array} pre_wash_images pre wash images
     * @param {array} post_wash_images post wash images
     * @param {Object[]} promotions promotions
     * @returns success response(status code 200)
     */
    async addVehicleWashData(req, res) {
        try {
            await vehicleWashValidator.validateAddVehicleWashDataForm(req.body)
            await vehicleWashHelper.insertVehicleWashData(req.body)
            responseHelper.success(res, 'ADD_VEHICLE_WASH_DATA_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for listing pending raised tickets pagination wise.
     * @param {number} page_no page no
     * @returns success response(status code 200) with listing pending raised tickets
     */
    async getRaisedTickets(req, res) {
        try {
            await vehicleWashValidator.validateGetRaisedTicketsForm(req.body)
            let raisedTickets = await vehicleWashHelper.getRaisedTickets(req.body, req.headers.language)
            responseHelper.success(res, 'GET_RAISED_TICKETS_SUCCESS', req.headers.language, { total: Number(raisedTickets.raisedTicketsCount), total_page: Math.ceil(raisedTickets.raisedTicketsCount / config.paginationCount), raisedTickets: raisedTickets.raisedTickets })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for getting executive list for assigning raised ticket.
     * @param {number} building_id building id
     * @returns success response(status code 200) with executive list and next vehicle wash date
     */
    async getExecutivesForTicket(req, res) {
        try {
            await vehicleWashValidator.validateGetExecutivesForTicketForm(req.body)
            let result = await vehicleWashHelper.getExecutivesForTicket(req.body, req.headers.language)
            responseHelper.success(res, 'GET_EXECUTIVES_FOR_TICKET_SUCCESS', req.headers.language, result)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for assigning pending raised ticket to same or other executive.
     * @param {number} vehicle_wash_id vehicle wash id on which ticket is generated
     * @param {number} executive_id assigned executive id
     * @param {number} vehicle_wash_date new vehicle wash date
     * @param {number} ticket_id ticket id
     * @returns success response(status code 200) by assigning pending raised ticket to same or other executive
     */
    async assignTicket(req, res) {
        try {
            await vehicleWashValidator.validateAssignTicketForm(req.body)
            await vehicleWashHelper.assignTicket(req.body)
            //-------------- Notification------------------
            let unique_id = codeHelper.getUniqueCode()
            let notification_data = notificationHelperApp.insertNotification(req.body.ticket_id, 'ASSIGN_TICKET_TITLE', 'ASSIGN_TICKET_TEXT', req.body.user_id, req.body.executive_id, 3, unique_id, req.headers.language, 'service_provider_notifications', 0)
            notificationHelperApp.sendNotification(notification_data, 'service_provider_notifications', 'service_provider_notification_id', 'service_provider_device_relation', 'service_provider_id')
            //---------------------------------------------
            responseHelper.success(res, 'ASSIGN_TICKET_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async getWashServicesForTopSupervisor(req, res) {
        try {
            await vehicleWashValidator.validateGetWashServicesForTopSupervisorAPI(req.body)
            let washServiceList = await vehicleWashHelper.getWashServicesForTopSupervisor(req.body, req.headers.language, req.user_type)
            responseHelper.success(res, 'GET_WASH_SERVICES_SUCCESS', req.headers.language, washServiceList)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new VehicleWash()