const responseHelper = require('../../utils/responseHelper')
const configurationValidator = require('../validators/configurationValidator');
const configurationHelper = require('../helpers/configurationHelper');
/**
 * This class contains the API related to Configuration in admin panel.
 */


class Configuration {
    /**
     * Fetch configuration data API
     * @param {number} maximum_distance_for_executive  Maximum Distance of the executive’s location to the service location
     * @param {number} maximum_distance_between_service  Maximum Distance of one service location to another service location    
     * @param {number} week_day_holiday  Week-off day
     * @param {number} referral_bonus_free_vehicle_wash_count Referral bonus
     * @param {number} minimum_no_of_vehicle_assign minimum cars to be assigned by default for exterior wash to any executive
     * @param {number} default_language default language   
     * @param {number} interior_wash_time Time slot between car wash
     * @param {time} vehicle_interior_start_time Start time of car wash in HH:mm:ss format 
     * @param {time} vehicle_interior_end_time End time of car wash in HH:mm:ss format 
     * @returns success response
     * @date 2020-01-23
     */

    async editConfiguration(req, res) {
        try {
            delete req.body['user_id'];
            await configurationValidator.editConfigurationValidator(req.body);
            await configurationHelper.editConfiguration(req.body);
            responseHelper.success(res, 'EDIT_CONFIGURATION_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    async getConfiguration(req, res){
        try {
            delete req.body['user_id'];
            await configurationValidator.getConfigurationValidator(req.body);
            let data = await configurationHelper.getConfiguration(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, data);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }
}

module.exports = new Configuration();