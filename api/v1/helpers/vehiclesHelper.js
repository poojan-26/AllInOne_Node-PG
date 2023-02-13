const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

/**
 * This VehiclesHelper class contains all vehicle related API's logic and required database operations. This class' functions are called from vehicles controller.
 */

class VehiclesHelper {
    async getVehicleBrands(body, language) {
        try {
            let selectParams = `brand_id, brand_name_lang->>'${language}' AS brand_name, brand_image`,
                where = `is_active = 1`
            let vehicle_brands
            if (body.is_car == 1) {
                vehicle_brands = await db.select('car_brand', selectParams, where)
            } else {
                vehicle_brands = await db.select('bike_brand', selectParams, where)
            }
            return vehicle_brands
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getVehicleModels(body, language) {
        try {
            let selectParams = `model_id, model_name_lang->>'${language}' AS model_name`,
                where = `is_active = 1 and brand_id = ${body.brand_id}`
            let vehicle_models
            if (body.is_car == 1) {
                vehicle_models = await db.select('car_model', selectParams, where)
            } else {
                vehicle_models = await db.select('bike_model', selectParams, where)
            }
            return vehicle_models
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getVehicleTypes(body, language) {
        try {
            let selectParams = `type_id, type_name_lang->>'${language}' AS type_name`,
                where = `is_active = 1`
            let vehicle_types
            if (body.is_car == 1) {
                vehicle_types = await db.select('car_type', selectParams, where)
            }
            return vehicle_types
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getVehicleColors(body, language) {
        try {
            let selectParams = `color_id, color_name_lang->>'${language}' AS color_name, color_hexcode`,
                where = `is_active = 1`
            let vehicle_colors = await db.select('color', selectParams, where)
            return vehicle_colors
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertVehicle(body) {
        try {
            let type_id
            if (body.is_car == '0') {
                type_id = 5  // for bike
            } else {  // for car
                let selectParams = `type_id`, where = `brand_id = ${body.vehicle_brand} AND model_id = ${body.vehicle_model}`
                type_id = await db.select('car_model', selectParams, where)
                type_id = type_id[0].type_id
            }
            let data = {
                customer_id: body.user_id,
                is_car: body.is_car,
                vehicle_brand: body.vehicle_brand,
                vehicle_model: body.vehicle_model,
                vehicle_type: type_id,
                vehicle_color: body.vehicle_color,
                vehicle_number: body.vehicle_number,
                building_id: body.building_id,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if (body.vehicle_image) {
                data.vehicle_image = body.vehicle_image
            }
            let vehicle = await db.insert('customer_vehicle_relation', data)
            return vehicle
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getAllVehicles(body, user_id, language) {
        try {
            let pagination
            let selectParams = `cvr.vehicle_relation_id, cvr.is_car, cvr.vehicle_number, 
            cvr.vehicle_image, CASE cvr.is_car WHEN 1 THEN cb.brand_id ELSE bb.brand_id END brand_id,
            CASE cvr.is_car WHEN 1 THEN cb.brand_name_lang->>'${language}' ELSE bb.brand_name_lang->>'${language}' END brand_name, 
            CASE cvr.is_car WHEN 1 THEN cm.model_id ELSE bm.model_id END model_id,
            CASE cvr.is_car WHEN 1 THEN cm.model_name_lang->>'${language}' ELSE bm.model_name_lang->>'${language}' END model_name, c.color_id, 
            c.color_name_lang->>'${language}' AS color_name, c.color_hexcode,vt.type_id,vt.type_name_lang->>'${language}' AS type_name,to_char(cvr.subscription_validity, 'YYYY-mm-dd') subscription_validity`,
                where = `cvr.customer_id = ${user_id} AND cvr.is_deleted = 0 AND cvr.is_active = 1`,
                join = ` LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand 
            LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model 
            LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand 
            LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model
            LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type
            LEFT JOIN color c ON c.color_id = cvr.vehicle_color `
            if (body.page_no) {
                pagination = ` LIMIT ${Number(config.paginationCount)} OFFSET ${Number(config.paginationCount) * (Number(body.page_no) - 1)}`
            }
            let subQuery = `(SELECT ` + selectParams + ` FROM customer_vehicle_relation cvr` + join + `WHERE ` + where + pagination + `) x ORDER BY x.vehicle_relation_id ASC`
            let vehicles = await db.select(subQuery, '*'),
                vehiclesCount = await db.select('customer_vehicle_relation cvr' + join, `COUNT(*)`, where)
            for (let v = 0; v < vehicles.length; v++) {
                let currentDate = dateHelper.getFormattedDate();
                if (vehicles[v].subscription_validity != null && vehicles[v].subscription_validity >= currentDate) {
                    vehicles[v].has_any_active_plan = 1
                } else {
                    vehicles[v].has_any_active_plan = 0
                }
            }
            return { vehicles, vehiclesCount: vehiclesCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getSingleVehicle(vehicle_id, language) {
        try {
            let selectParams = `cvr.is_car, cvr.vehicle_number, cvr.vehicle_image, 
            CASE cvr.is_car WHEN 1 THEN cb.brand_id ELSE bb.brand_id END brand_id, 
            CASE cvr.is_car WHEN 1 THEN cb.brand_name_lang->>'${language}'
            ELSE bb.brand_name_lang->>'${language}' END brand_name, 
            CASE cvr.is_car WHEN 1 THEN cm.model_id ELSE bm.model_id END model_id, 
            CASE cvr.is_car WHEN 1 THEN cm.model_name_lang->>'${language}' ELSE bm.model_name_lang->>'${language}' END model_name, 
            c.color_id, c.color_name_lang->>'${language}' AS vehicle_color, c.color_hexcode,vt.type_id,vt.type_name_lang->>'${language}' AS type_name`,
                where = `cvr.vehicle_relation_id = ${vehicle_id} AND cvr.is_deleted = 0`,
                join = ` LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand 
            LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model 
            LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand 
            LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model
            LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type
            LEFT JOIN color c ON c.color_id = cvr.vehicle_color `
            let vehicle = await db.select('customer_vehicle_relation cvr' + join, selectParams, where)
            if (vehicle.length == 0) {
                throw 'VEHICLE_NOT_FOUND'
            } else {
                return vehicle[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async editVehicle(body) {
        try {
            let type_id
            if (body.is_car == '0') {
                type_id = 5  // for bike
            } else {  // for car
                let selectParams = `type_id`, where = `brand_id = ${body.vehicle_brand} AND model_id = ${body.vehicle_model}`
                type_id = await db.select('car_model', selectParams, where)
                type_id = type_id[0].type_id
            }
            let condition = `vehicle_relation_id = ${body.vehicle_id}`,
                data = {
                    is_car: body.is_car,
                    vehicle_brand: body.vehicle_brand,
                    vehicle_model: body.vehicle_model,
                    vehicle_type: type_id,
                    vehicle_color: body.vehicle_color,
                    vehicle_number: body.vehicle_number,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            if (body.vehicle_image) {
                data.vehicle_image = body.vehicle_image
            }
            let result = await db.update('customer_vehicle_relation', condition, data)
            if (result.rowCount == 0) {
                throw 'VEHICLE_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteVehicle(body) {
        try {
            let condition = `vehicle_relation_id = ${body.vehicle_id}`,
                data = { 
                    is_deleted: 1,
                    modified_date: dateHelper.getCurrentTimeStamp()
                },
                result = await db.update('customer_vehicle_relation', condition, data)
            if (result.rowCount == 0) {
                throw 'VEHICLE_NOT_FOUND'
            } else {
                let currentDate = dateHelper.getFormattedDate();
                condition = `vehicle_relation_id = ${body.vehicle_id} AND subscription_id is NOT NULL AND subscription_validity >= '${currentDate}'`
                data = {
                    subscription_validity: null,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
                // make vehicle's subscription_validity null
                await db.update('customer_vehicle_relation', condition, data)
                let subscription_id = await db.select('customer_vehicle_relation', 'subscription_id', `vehicle_relation_id = ${body.vehicle_id}`)
                data = {
                    status: 2,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
                condition = `customer_subscription_relation_id = ${subscription_id[0].subscription_id}`
                // cancel ongoing subscription plan
                await db.update('customer_subscription_relation', condition, data)
                condition = ` customer_id = ${body.user_id} AND vehicle_id = ${body.vehicle_id} AND is_completed = 0`
                // delete upcoming(pending) vehicle wash schedules
                await db.delete('vehicle_wash_active_week', condition)
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new VehiclesHelper()