const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const codeHelper = require('../../utils/codeHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

/**
 * This ServiceProviderAuthHelper class contains all customer account related API's logic and required database operations. This class' functions are called from userAuth controller.
 */

class ServiceProviderAuthHelper {
    async addOrUpdateUserDeviceRelation(user, headers) {
        try {
            let data = {
                service_provider_id: user.service_provider_id,
                allow_notification: 1,
                device_token: headers.device_token,
                device_id: headers.device_id,
                device_type: headers.device_type,
                os: headers.os,
                app_version: headers.android_app_version ? headers.android_app_version : headers.ios_app_version,
                modified_date: dateHelper.getCurrentTimeStamp()
            },
            where = ` device_id = '${headers.device_id}' and service_provider_id = ${user.service_provider_id}`,
            selectParams = '*',
            device_data = await db.select('service_provider_device_relation', selectParams, where)
            if (device_data.length > 0) {
                await db.update('service_provider_device_relation', where, data)
            } else {
                data.created_date = dateHelper.getCurrentTimeStamp()
                await db.insert('service_provider_device_relation', data)
            }
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async updateOTP(service_provider_id, otp) {
        try {
            let where = `service_provider_id=${service_provider_id}`,
                data = {
                    otp: otp,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('service_provider', where, data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async resetPassword(user, body) {
        try {
            let where = `service_provider_id=${user.service_provider_id}`,
                data = {
                    otp: '',
                    password: body.new_password,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('service_provider', where, data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async getServiceProviderProfile(service_provider_id) {
        try {
            let where = `service_provider_id = ${service_provider_id}`,
                selectParams = '*',
                service_provider = await db.select('service_provider', selectParams, where)
            if (service_provider.length == 0) {
                throw 'USER_NOT_FOUND'
            }
            return service_provider
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async changePassword(body) {
        try {
            let data = {
                password: body.new_password,
                modified_date: dateHelper.getCurrentTimeStamp()
            },
                where = `service_provider_id=${body.user_id}`
            await db.update('service_provider', where, data)
            return true
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
    async getUser(user_id, user_type) {
        try {
            let selectParams = `service_provider_id, full_name, country_code, phone_number, email, provider_type, has_vehicle, no_of_jobs, profile_picture, location, latitude, longitude, is_active, total_ratings, no_of_ratings, current_latitude, current_longitude, is_active, created_date, modified_date `,
                where = `service_provider_id = ${user_id}`
            let user = await db.select('service_provider', selectParams, where)
            if (user.length == 0) {
                throw 'USER_NOT_FOUND'
            } else {
                if (user_type == 1 || user_type == 2 || user_type == 3 || user_type == 4) {
                    if (user[0].no_of_ratings == 0) {
                        user[0].average_rating = 0
                    } else {
                        user[0].average_rating = Number(user[0].total_ratings / user[0].no_of_ratings).toFixed(1)
                    }
                }
                return user[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getMinimumExteriorJobs() {
        try {
            let jobNumbers = await db.select('mst_config_admin', `minimum_no_of_vehicle_assign, maximum_no_of_vehicle_assign`)
            return jobNumbers
        } catch (error) {
            return promise.reject(error)
        }
    }
    async setMinimumExteriorJobs(body) {
        try {
            let data = {
                no_of_jobs: body.minimum_exterior_jobs,
                modified_date: dateHelper.getCurrentTimeStamp()
            },
                where = `service_provider_id = ${body.user_id}`
            await db.update('service_provider', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async dashboard(body, user_type) {
        try {
            let where
            let result = await db.select('service_provider', 'total_ratings, no_of_ratings', `service_provider_id = ${body.user_id}`)
            let average_rating = Number(result[0].total_ratings / result[0].no_of_ratings).toFixed(1)
            if (result[0].no_of_ratings == 0) {
                average_rating = 0
            }
            console.log("ratings>>", result[0].total_ratings, result[0].no_of_ratings, average_rating)
            let current_date = dateHelper.getFormattedDate()
            let date = new Date()
            let firstDay = dateHelper.getFormattedDate(new Date(date.getFullYear(), date.getMonth(), 1))
            let lastDay = dateHelper.getFormattedDate(new Date(date.getFullYear(), date.getMonth() + 1, 0))
            console.log("dates>>", firstDay, lastDay)
            if (user_type == 1 || user_type == 4) {
                where = `executive_id = ${body.user_id}`
            } else if (user_type == 2) {
                where = `supervisor_id = ${body.user_id}`
            } else if (user_type == 3) {
                where = `top_supervisor_id = ${body.user_id}`
            }
            let selectParams = `COALESCE(COUNT(DISTINCT vehicle_wash_id) filter (where wash_type = 1 AND is_completed = 0 AND vehicle_wash_date = '${current_date}'),0) as today_exterior_pending,
            COALESCE(COUNT(DISTINCT vehicle_wash_id) filter (where wash_type = 1 AND is_completed = 1 AND vehicle_wash_date = '${current_date}'),0) as today_exterior_completed,
            COALESCE(COUNT(DISTINCT vehicle_wash_id) filter (where wash_type = 2 AND is_completed = 0 AND vehicle_wash_date = '${current_date}'),0) as today_interior_pending,
            COALESCE(COUNT(DISTINCT vehicle_wash_id) filter (where wash_type = 2 AND is_completed = 1 AND vehicle_wash_date = '${current_date}'),0) as today_interior_completed,
            COUNT(DISTINCT vehicle_wash_id) as total_jobs,
            COALESCE(COUNT(DISTINCT vehicle_wash_id) filter (where wash_type = 1 AND vehicle_wash_date >= '${firstDay}' AND vehicle_wash_date <= '${lastDay}'),0) as total_exterior,
            COALESCE(COUNT(DISTINCT vehicle_wash_id) filter (where wash_type = 2 AND vehicle_wash_date >= '${firstDay}' AND vehicle_wash_date <= '${lastDay}'),0) as total_interior`
            result = await db.select('vehicle_wash_active_week', selectParams, where)
            result[0].average_rating = average_rating
            if (user_type == 2) {
                let ticket = await db.select('user_ticket', `count(DISTINCT ticket_id) pending_ticket`, `supervisor_id = ${body.user_id} AND is_resolved = 0`)
                result[0].pending_ticket = ticket[0].pending_ticket
                selectParams = ` count(DISTINCT service_provider_id) as substitute_executive`
                where = ` ser.supervisor_id = ${body.user_id} AND sp.provider_type = 4`
                let joins = ` LEFT JOIN supervisor_executive_relation ser ON ser.executive_id = sp.service_provider_id`
                let substitute_executive = await db.select('service_provider sp' + joins, selectParams, where)
                result[0].substitute_executive = substitute_executive[0].substitute_executive
                let current_date = dateHelper.getFormattedDate()
                selectParams = ` count(DISTINCT leave_id) as pending_leaves`
                where = ` leave_status = 1 AND supervisor_id = ${body.user_id} AND applied_leave_date >= '${current_date}'`
                let pending_leaves = await db.select('executive_leaves', selectParams, where)
                result[0].pending_leaves = pending_leaves[0].pending_leaves
            }
            return result
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectAllExecutives(supervisor_id, language) {
        try {
            const selectParams = ` service_provider.service_provider_id, service_provider.full_name_lang->>'${language}' AS full_name, service_provider.provider_type,service_provider.profile_picture `,
                joins = ` JOIN service_provider ON service_provider.service_provider_id=supervisor_executive_relation.executive_id `,
                condition = ` supervisor_executive_relation.supervisor_id=${supervisor_id} `,
                executives_data = await db.select('supervisor_executive_relation' + joins, selectParams, condition),
                executives = executives_data.filter(executive => executive.provider_type === 1),
                sub_executives = executives_data.filter(executive => executive.provider_type === 4)
            return { executives, sub_executives }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectExecutive(executive_id, language) {
        try {
            const date = new Date(),
                firstDay = dateHelper.getFormattedDate(new Date(date.getFullYear(), date.getMonth(), 1)),
                lastDay = dateHelper.getFormattedDate(new Date(date.getFullYear(), date.getMonth() + 1, 0)),
                selectParams = ` service_provider.service_provider_id, service_provider.full_name_lang->>'${language}' AS full_name,
                                service_provider.provider_type, service_provider.profile_picture, service_provider.has_vehicle, 
                                service_provider.email, service_provider.country_code, service_provider.phone_number, service_provider.location, 
                                service_provider.total_ratings, service_provider.no_of_ratings, COUNT(DISTINCT vwaw.vehicle_wash_id) AS total_jobs,
                                COUNT(DISTINCT vwaw.vehicle_wash_id) filter (where wash_type=1 AND vehicle_wash_date ='${dateHelper.getFormattedDate(new Date())}') AS today_exterior_jobs,
                                COUNT(DISTINCT vwaw.vehicle_wash_id) filter (where wash_type=2 AND vehicle_wash_date ='${dateHelper.getFormattedDate(new Date())}') AS today_interior_jobs,
                                COUNT(DISTINCT vwaw.vehicle_wash_id) filter (where wash_type=1 AND vehicle_wash_date >= '${firstDay}' AND vehicle_wash_date <= '${lastDay}') AS total_exterior_jobs_month,
                                COUNT(DISTINCT vwaw.vehicle_wash_id) filter (where wash_type=2 AND vehicle_wash_date >= '${firstDay}' AND vehicle_wash_date <= '${lastDay}') AS today_interior_jobs_month,
                                COUNT(DISTINCT ut.ticket_id) filter (where ut.executive_id = ${executive_id}) AS total_tickets, COUNT(DISTINCT ut.ticket_id) filter (where ut.executive_id = ${executive_id} AND ut.is_resolved = 1) AS total_completed_tickets `,
                joins = ` LEFT JOIN vehicle_wash_active_week vwaw ON vwaw.executive_id = service_provider.service_provider_id LEFT JOIN user_ticket ut ON ut.executive_id = service_provider.service_provider_id`,
                condition = ` service_provider.service_provider_id=${executive_id} `,
                pagination = ` GROUP BY service_provider.service_provider_id `,
                executive = await db.select('service_provider' + joins, selectParams, condition + pagination)
            executive[0].ratings = executive[0].no_of_ratings === 0 ? 0 : Number(executive[0].total_ratings / executive[0].no_of_ratings).toFixed(1)
            if (executive && executive.length > 0) {
                return executive[0]
            } else {
                throw 'EXECUTIVE_WITH_ID_NOT_FOUND'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectCustomer(body, language) {
        try {
            const selectParams = ` customer.customer_id, customer.full_name, customer.profile_picture, customer.email, 
                                customer.country_code, customer.phone_number, customer.location, customer.has_any_active_plan `,
                condition = ` customer.customer_id=${body.customer_id} `,
                customer = await db.select('customer', selectParams, condition), // customer details
                selectVehicleParams = `cvr.is_car, cvr.vehicle_number, cvr.vehicle_image, 
                                CASE cvr.is_car WHEN 1 THEN cb.brand_id ELSE bb.brand_id END brand_id, 
                                CASE cvr.is_car WHEN 1 THEN cb.brand_name_lang->>'${language}'
                                ELSE bb.brand_name_lang->>'${language}' END brand_name, 
                                CASE cvr.is_car WHEN 1 THEN cm.model_id ELSE bm.model_id END model_id, 
                                CASE cvr.is_car WHEN 1 THEN cm.model_name_lang->>'${language}' ELSE bm.model_name_lang->>'${language}' END model_name, 
                                c.color_id, c.color_name_lang->>'${language}' AS vehicle_color, c.color_hexcode,vt.type_id,vt.type_name_lang->>'${language}' AS type_name`,
                conditionVehicle = `cvr.vehicle_relation_id = ${body.vehicle_id} AND cvr.is_deleted = 0`,
                joinVehicle = ` LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand 
                                LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model 
                                LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand 
                                LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model
                                LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type
                                LEFT JOIN color c ON c.color_id = cvr.vehicle_color `,
                userVehicle = await db.select('customer_vehicle_relation cvr' + joinVehicle, selectVehicleParams, conditionVehicle), // vehicle details
                selectSubscriptionParams = `customer_subscription_relation_id,customer_subscription_relation.subscription_plan_id, 
            subscription_plan_lang->>'${language}' AS subscription_plan, subscription_details_lang->>'${language}' AS subscription_details, interior_wash_details_lang->>'${language}' AS interior_wash_details`,
                whereSubscription = ` vehicle_id = ${body.vehicle_id} AND has_paid = 1 AND customer_subscription_relation.is_active = 1`,
                joinSubscription = ` LEFT JOIN mst_subscription_plan ON mst_subscription_plan.subscription_plan_id = customer_subscription_relation.subscription_plan_id`,
                userSubscriptionPlan = await db.select('customer_subscription_relation' + joinSubscription, selectSubscriptionParams, whereSubscription),  // subscription plan details
                selectDurationParams = `customer_subscription_relation.subscription_plan_duration_id,duration_title_lang->>'${language}' AS duration_title,duration_month,customer_subscription_relation_id,to_char(subscription_start_date_by_customer,'dd Mon, YYYY') as subscription_start_date_by_customer,to_char(subscription_start_date,'dd Mon, YYYY') as subscription_start_date,to_char(subscription_end_date,'dd Mon, YYYY') as subscription_end_date`,
                whereDuration = ` vehicle_id = ${body.vehicle_id} AND customer_subscription_relation.customer_id = ${body.customer_id} AND has_paid = 1 AND customer_subscription_relation.is_active = 1`,
                joinDuration = ` LEFT JOIN mst_subscription_plan_duration ON mst_subscription_plan_duration.subscription_plan_duration_id = customer_subscription_relation.subscription_plan_duration_id`,
                userVehicleDuration = await db.select('customer_subscription_relation' + joinDuration, selectDurationParams, whereDuration), // subscription plan duration details
                selectPromotionParams = `promotional_text_lang->>'${language}' AS promotional_text`,
                wherePromotion = ` customer_subscription_id = ${userVehicleDuration[0].customer_subscription_relation_id} `,
                joinPromotion = ` LEFT JOIN mst_promotional ON mst_promotional.promotional_id = customer_promotional_relation.promotional_id `,
                userVehiclePromotion = await db.select('customer_promotional_relation' + joinPromotion, selectPromotionParams, wherePromotion),    // vehicle promotion details
                selectPriceParams = `original_price, promotional_price`,
                wherePrice = `subscription_plan_id = ${userSubscriptionPlan[0].subscription_plan_id} AND subscription_duration_id = ${userVehicleDuration[0].subscription_plan_duration_id} AND type_id = ${userVehicle[0].type_id}`,
                subscriptionPrice = await db.select('subscription_promotional_relation', selectPriceParams, wherePrice) // price details
            if (customer && customer.length > 0) {
                return {
                    customer: customer[0],
                    userVehicle: userVehicle,
                    userVehiclePlan: userSubscriptionPlan,
                    userVehicleDuration: userVehicleDuration,
                    userVehiclePromotion: userVehiclePromotion,
                    subscriptionPrice: subscriptionPrice
                }
            } else {
                throw 'CUSTOMER_WITH_ID_NOT_FOUND'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectExecutivesByLatitudeLongitude(body, language) {
        try {
            const latitude = body.latitude,
                longitude = body.longitude,
                selectParams = `sp.service_provider_id, sp.full_name_lang->>'${language}' full_name, latitude, longitude`,
                joins = ` JOIN supervisor_executive_relation ser ON ser.executive_id = sp.service_provider_id AND ser.supervisor_id = ${body.user_id}`,
                where = ` (( 3963 * ACOS( COS( RADIANS(${latitude}) ) * COS( RADIANS( current_latitude ) ) * COS( RADIANS( current_longitude ) - RADIANS(${longitude}) )
                        + SIN(  RADIANS(${latitude}) ) * SIN( RADIANS( current_latitude ) ) ) ) * 1.609 ) <= ${config.buildingRadius} `,
                executives = await db.select('service_provider sp' + joins, selectParams, where)
            return executives
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectAllSupervisors(top_supervisor_id, language) {
        try {
            const selectParams = ` service_provider.service_provider_id, service_provider.full_name_lang->>'${language}' AS full_name, service_provider.provider_type, service_provider.profile_picture `,
                joins = ` JOIN service_provider ON service_provider.service_provider_id=topsupervisor_supervisor_relation.supervisor_id `,
                condition = ` topsupervisor_supervisor_relation.top_supervisor_id=${top_supervisor_id} `,
                supervisors = await db.select('topsupervisor_supervisor_relation' + joins, selectParams, condition)
            return supervisors
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectSupervisor(supervisor_id, language) {
        try {
            let body = {
                user_id: supervisor_id
            }
            let supervisor_dashboard = this.dashboard(body, 2)
            return supervisor_dashboard
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteUserDeviceRelation(body) {
        try {
            let condition = ` service_provider_id = ${body.user_id} AND device_id = '${body.device_id}'`
            await db.delete('service_provider_device_relation', condition)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new ServiceProviderAuthHelper()