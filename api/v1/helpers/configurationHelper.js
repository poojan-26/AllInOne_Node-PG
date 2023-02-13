const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const moment = require('moment');

/**
 * This class contains configuration  edit, get related API's business logig.
*/

class ConfigurationHelper {

    async getConfiguration(body) {
        try {
            let selectParams = ` referral_bonus_free_vehicle_wash_count, maximum_distance_for_executive, 
            maximum_distance_between_service, week_day_holiday, minimum_no_of_vehicle_assign, interior_wash_time,
            vehicle_interior_start_time, vehicle_interior_end_time`,
                where = ` config_id = 1 `;
            let data = await db.select('mst_config_admin', selectParams, where);               
            return data[0]
        } catch (error) {
            return promise.reject(error)
        }
    }

    async editConfiguration(body) {
        try {
            let data = {
                maximum_distance_for_executive: +body.maximum_distance_for_executive,
                maximum_distance_between_service: +body.maximum_distance_between_service,
                week_day_holiday: +body.week_day_holiday,
                referral_bonus_free_vehicle_wash_count: +body.referral_bonus_free_vehicle_wash_count,
                minimum_no_of_vehicle_assign: +body.minimum_no_of_vehicle_assign,
                // default_language: +body.default_language,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp(),
                // vehicle_interior_start_time: body.vehicle_interior_start_time,
                vehicle_interior_start_time: moment(body.vehicle_interior_start_time).format('HH:mm:ss'),
                vehicle_interior_end_time: moment(body.vehicle_interior_end_time).format('HH:mm:ss'),


                // Other default data as per db fields...
                generate_ticket: 1,
                interior_wash_time: +body.interior_wash_time,
                
            }

            console.log("editConfiguration Insert Data :::: ", data);
            let configuration = await db.update('mst_config_admin', `config_id = 1`, data);
            return configuration;
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new ConfigurationHelper()