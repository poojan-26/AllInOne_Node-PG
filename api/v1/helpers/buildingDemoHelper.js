const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')
const buildingPlanHelper = require('../helpers/buildingPlanHelper')

/**
 * This BuildingDemoHelper class contains building demo and location(or building) related API's logic and required database operations. This class' functions are called from buildingDemo controller.
 */

class BuildingDemoHelper {
    async getDemoByBuilding(body) {
        try {
            let selectParams = "demo.demo_id,demo_type,demo_data",
                join = ` LEFT JOIN mst_demo demo ON demo.demo_id = building_demo_relation.demo_id`,
                where = ` demo.is_active = 1 AND building_id = ${body.building_id}`
            let buildingDemo = await db.select('building_demo_relation' + join, selectParams, where)
            if (buildingDemo.length > 0) {
                return buildingDemo
            } else {
                throw 'NO_DEMO_FOUND'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async setBuildingDemoSchedule(body) {
        try {
            let data = {
                building_id: body.building_id,
                date: body.schedule_date,
                time: body.schedule_time,
                customer_id: body.user_id,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            return await db.insert('customer_demo_request', data)

        } catch (error) {
            return promise.reject(error)
        }
    }
    async changeCustomerLocation(body) {
        try {
            let data = {
                location: body.location,
                latitude: body.latitude,
                longitude: body.longitude,
                building_id: body.building_id,
                modified_date: dateHelper.getCurrentTimeStamp()
            },
            condition = ` customer_id = ${body.user_id}`
            await db.update('customer',condition, data )
            if('is_update' in body && body.is_update == 1) {  // stop all running subscriptions if customer agrees to change location and stop all running subscriptions
                let current_date = dateHelper.getFormattedDate()
                // delete customer's pending demo request 
                await db.delete('customer_demo_request', ` customer_id = ${body.user_id} AND date >= '${current_date}'`)
                data = {
                    status: 2,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
                condition = ` customer_id = ${body.user_id} AND subscription_end_date >= '${current_date}' AND status = 1`
                // cancel ongoing subscription plans
                await db.update('customer_subscription_relation', condition, data)
                let selectParams = `vehicle_id, customer_subscription_relation_id`
                let subscription_details = await db.select('customer_subscription_relation', selectParams, condition)
                // make all vehicles' subscription_validity null
                data = {
                    subscription_validity: null,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
                condition = ` customer_id = ${body.user_id}`
                await db.update('customer_vehicle_relation', condition, data)
                for(let s=0; s<subscription_details.length; s++) {
                    data = {
                        subscription_validity: null,
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                    condition = ` customer_id = ${body.user_id} AND vehicle_relation_id = ${subscription_details[s].vehicle_id}`
                    // change vehicle's ongoing subscription validity to null (inshort unlink the subscription plan with vehicle)
                    await db.update('customer_vehicle_relation', condition, data)
                    condition = ` customer_id = ${body.user_id} AND vehicle_id = ${subscription_details[s].vehicle_id} AND is_completed = 0`
                    // delete upcoming(pending) vehicle wash schedules
                    await db.delete('vehicle_wash_active_week', condition)
                }
                // change has_any_active_plan status of customer to 0
                data = {
                    has_any_active_plan: 0,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
                condition = ` customer_id = ${body.user_id}`
                await db.update('customer', condition, data)
                // delete unpaid subscription plans
                data = {
                    user_id: body.user_id
                }
                await buildingPlanHelper.clearUserPlanDetails(data)
            }
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getBuildingByLatitudeLongitude(body, language) {
        try {
            let latitude = body.latitude,
                longitude = body.longitude;
            let selectParams = `building_id,building_name_lang->>'${language}' building_name,location,latitude,longitude,has_demo,demo_id`,
                where = ` (( 3963 * ACOS( COS( RADIANS(${latitude}) ) * COS( RADIANS( latitude ) ) * COS( RADIANS( longitude ) - RADIANS(${longitude}) ) + SIN(  RADIANS(${latitude}) ) * SIN( RADIANS( latitude ) ) ) ) * 1.609 ) <= ${config.buildingRadius} `
            let buildingDemo = await db.select('building', selectParams, where)
            if (buildingDemo.length > 0) {
                return buildingDemo
            } else {
                throw 'NO_BUILDING_FOUND'
            }

        } catch (error) {
            return promise.reject(error)
        }
    }
    async checkCustomerBuilding(body) {
        try {
            let selectParams = "complex_id",
            where  = ` building_id = ${body.building_id} `           
            let buildingData = await db.select('building', selectParams, where )
            if(buildingData.length > 0) {
                if(buildingData[0].complex_id > 0) {
                    selectParams = "complex_id",
                    where  = ` building_id = ${body.change_building_id} `           
                    let change_buildingData = await db.select('building', selectParams, where )
                    if(change_buildingData.length > 0){
                        if(change_buildingData[0].complex_id >0){
                            if(buildingData[0].complex_id == change_buildingData[0].complex_id){  // if new buidling is in same complex of old building, then change customer's location directly without change any flow
                                let data = {
                                    location: body.location,
                                    latitude: body.latitude,
                                    longitude: body.longitude,
                                    building_id: body.change_building_id,
                                    user_id: body.user_id
                                }
                                // change location in customer table
                                await this.changeCustomerLocation(data)
                                data = {
                                    building_id: body.change_building_id,
                                    modified_date: dateHelper.getCurrentTimeStamp()
                                }
                                // change location in customer_demo_request table
                                await db.update('customer_demo_request', ` customer_id = ${body.user_id}`, data)
                                let current_date = dateHelper.getFormattedDate()
                                where = ` customer_id = ${body.user_id} AND subscription_end_date >= '${current_date}'`
                                // change location in customer_subscription_relation table where subscription validity is greater than current date
                                await db.update('customer_subscription_relation', where, data)
                                where = ` customer_id = ${body.user_id}`
                                // change location in customer_vehicle_relation table in customer's all vehicles
                                await db.update('customer_vehicle_relation', where, data)
                                // where = ` customer_id = ${body.user_id} AND is_completed = 0 AND vehicle_wash_date >= '${current_date}'`
                                // // change location in upcoming schedule(pending wash) in vehicle_wash_active_week table
                                // await db.update('vehicle_wash_active_week', where, data)
                                return 1
                            } else {
                                return 0
                            }
                        }
                    } else {
                        throw 'NO_BUILDING_FOUND'
                    }
                } else {
                    return 0
                }
            } else {
                throw 'NO_BUILDING_FOUND'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new BuildingDemoHelper()