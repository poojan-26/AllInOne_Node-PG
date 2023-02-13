const config = require('../../utils/config')
const responseHelper = require('../../utils/responseHelper')
const subscriptionHelper = require('../helpers/subscriptionHelper')
const subscriptionValidator = require('../validators/subscriptionValidator')

class Subscription {

    async getSubscriptions(req, res) {
        try {
            delete req.body['user_id']
            await subscriptionValidator.validateGetSubscriptionsRequest(req.body)
            let response = await subscriptionHelper.getSubscriptions(req.body)
            responseHelper.success(res, 'GET_SUBSCRIPTION_LIST_SUCCESS', req.headers.language, response.data, '', response.total)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }

    async getAddSubscriptionsData(req, res) {
        try {
            delete req.body['user_id']
            await subscriptionValidator.validateGetAddSubscriptionsRequest(req.body);
            console.log("[ req body ]", req.body);
            let response = await subscriptionHelper.getAddSubscriptionsData();
            responseHelper.success(res, 'SUCCESS', req.headers.language, response, '', '');
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }

    async addEditSubscription(req, res) {
        try {
            delete req.body['user_id']
            await subscriptionValidator.validateAddEditSubscriptionRequest(req.body);
            //-------------------------------------------------------------------------------
            if ('subscription_promotional_relation_id' in req.body) {  // Request for edit the subscription data
                let subscriptionData = await subscriptionHelper.isSubscriptionExist(req.body);
                if (subscriptionData.length === 0){
                    throw 'SUBSCRIPTION_DATA_NOT_FODUND'
                }
                if (subscriptionData.length > 0) {
                    req.body['created_date'] = subscriptionData[0].created_date;
                }
            }

            //-------------------------------------------------------------------------------
            let response = await subscriptionHelper.addEditsubscription(req.body);
            responseHelper.success(res, req.body.subscription_promotional_relation_id ? 'EDIT_SUBSCRIPTION_SUCCESS' : 'ADD_SUBSCRIPTION_SUCCESS', req.headers.language, response, '', '');
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new Subscription()