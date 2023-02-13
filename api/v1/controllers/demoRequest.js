const demoRequestHelper = require('../helpers/demoRequestHelper')
const demoRequestValidator = require('../validators/demoRequestValidator')
const responseHelper = require('../../utils/responseHelper')

/**
 * This DemoRequest class contains DemoRequest Add Edit and status change related APIs
 */

class DemoRequest {

    /**
     * Add complex API
     * @param {string} customer_id  customer id
     * @param {Date} date  customer reqest for which date
     * @param {Time} time  customer reqest for which time
     * @param {integer} building_id building id
     * @param {Date}  final_date admin decide date for demo
     * @param {Time}  final_time admin decide time for demo
     * @param {integer}  is_assigned admin has assigned demo or not
     * @returns success response with Complex Detail
     * @date 2020-02-18
     */

    async getDemoRequestList(req, res) {
        try {
            delete req.body['user_id'];
            await demoRequestValidator.getDemoRequestValidator(req.body);
            let response = await demoRequestHelper.getDemoRequestList(req.body);
            console.log("responswe======================", response)
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }
    async assignDemoToCustomer(req, res) {
        try {
            delete req.body['user_id'];
            await demoRequestValidator.assignDemoToCustomerValidator(req.body);
            let response = await demoRequestHelper.assignDemoToCustomer(req.body);
            console.log("responswe======================", response)
            responseHelper.success(res, 'ASSIGNED_DEMO_TO_CUSTOMER', req.headers.language, '', '', '');
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


}

module.exports = new DemoRequest();