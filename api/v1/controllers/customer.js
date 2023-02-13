const responseHelper = require('../../utils/responseHelper');
const customerValidator = require('../validators/customerValidator');
const customerHelper = require('../helpers/customerHelper');
const smsHelper = require('../../utils/smsHelper');
const push = require('../../utils/notificationHelper');
/**
 * This class contains the API related to manage customer in admin panel.
 */


class Customer {
    /**
     * Fetch configuration data API
     * @returns success response with customer details
     * @date 2020-01-23
     */

    async getCustomerList(req, res) {
        try {
            delete req.body['user_id'];
            await customerValidator.getCustomerListValidator(req.body);
            let response = await customerHelper.getCustomerList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async customerStatusUpdate(req, res) {
        try {
            delete req.body['user_id'];
            await customerValidator.customerStatusUpdateValidator(req.body);
            await customerHelper.customerStatusUpdate(req.body);
            responseHelper.success(res, 'CUSTOMER_STATUS_UPDATED', req.headers.language, '', '', '');
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async sendMessage(req, res) {
        try {
            delete req.body['user_id'];
            await customerValidator.sendMessageValidator(req.body);
            await customerHelper.sendMessage(req.body);
            //Now send the SMS or push            
            let customerData = await customerHelper.getCustomerData(Array.isArray(req.body.customer_id) ? req.body.customer_id.join() : JSON.parse(req.body.customer_id).join());
            if (+req.body.type === 1) { // SMS 

                // Fetch customer's required data to send SMS
                if (customerData.rows.length > 0) {
                    // Send SMS to each customers... 
                    customerData.rows.forEach(customer => {                        
                        smsHelper.sendSMS(customer.phone_number, req.body.message);
                    });
                }
            } else {    
                // Send push notofication
                customerData.rows.forEach(customer => {
                    console.log("customer =====================", customer); 
                    customer.bold_text = req.body.title;
                    customer.notification_text = req.body.message;
                    console.log("sendNotification =======================================", customer);
                    push.sendNotification(customer);                   
                });
            }
            responseHelper.success(res, 'MESSAGE_SEND', req.headers.language, '', '', '');
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }
}

module.exports = new Customer();