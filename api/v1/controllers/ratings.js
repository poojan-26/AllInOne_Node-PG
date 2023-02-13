const ratingsHelper = require('../helpers/ratingsHelper')
const ratingsValidator = require('../validators/ratingsValidator')
const responseHelper = require('../../utils/responseHelper')

/**
 * This Ratings class contains all ratings related APIs.
 */

class Ratings {
    /**
     * API for retrieving reasons based on given ratings. This API is only if ratings are 4 or less than 4.
     * @param {number} ratings ratings between 1 to 4
     * @returns success response(status code 200) with reasons based on ratings
     * @date 2020-01-10
     */
    async getRatingsReasons(req, res) {
        try {
            await ratingsValidator.validateGetRatingsReasons(req.body)
            let reasons = await ratingsHelper.getRatingsReasons(req.body, req.headers.language)
            responseHelper.success(res, 'GET_RATINGS_REASONS_SUCCESS', req.headers.language, reasons)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * API for giving ratings of vehicle wash
     * @param {number} vehicle_id vehicle id
     * @param {number} vehicle_wash_id vehicle wash id
     * @param {number} executive_id executive id
     * @param {number} supervisor_id supervisor id
     * @param {number} top_supervisor_id top supervisor id
     * @param {number} ratings ratings between 1 to 5
     * @param {number} wash_type 1: Exterior 2: Interior
     * @param {string} vehicle_wash_date vehicle wash date
     * @param {string} end_time vehicle wash end time
     * @param {number} category_id category id if ratings are 4 or less than 4 otherwise blank('')
     * @returns success response(status code 200)
     * @date 2020-01-10
     */
    async giveRatings(req, res) {
        try {
            await ratingsValidator.validateGiveRatings(req.body)
            await ratingsHelper.giveRatings(req.body)
            await ratingsHelper.generateTicket(req.body, req.headers.language)
            responseHelper.success(res, 'GIVE_RATINGS_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new Ratings()