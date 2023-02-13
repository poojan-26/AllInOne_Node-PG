const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const vehiclesHelper = require('../helpers/vehiclesHelper')
const userScheduleHelper = require('../helpers/userScheduleHelper')

/**
 * This BuildingPlanHelper class contains all subscription plans related API's logic and required database operations. This class' functions are called from buildingPlan controller.
 */

class BuildingPlanHelper {
    async getUserPlanForBuilding(body, language) {
        try {
            console.log("getUserPlanForBuilding", body)
            let selectParams = `s.subscription_plan_id, bsr.subscription_plan_id as building_enable_subscription,
            subscription_plan_lang->>'${language}' AS subscription_plan, subscription_details_lang->>'${language}' AS subscription_details, interior_wash_details_lang->>'${language}' AS interior_wash_details`,
                where = `s.is_active = 1`,
                join = ` LEFT JOIN building_subscription_relation bsr ON bsr.subscription_plan_id=s.subscription_plan_id AND building_id=${body.building_id}`

            let userPlan = await db.select('mst_subscription_plan s' + join, selectParams, where)
            if (userPlan.length > 0) {
                return userPlan
            } else {
                throw 'NO_PLAN_FOUND'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getAllDurationForPlan(body, language) {
        try {
            let getVehicleType
            if (body.vehicle_id > 0 && body.vehicle_id != '') {
                getVehicleType = await this.getVehicleTypeById(body.user_id, body.vehicle_id)
            } else {
                getVehicleType = await this.getVehicleTypeById(body.user_id)
            }
            getVehicleType = getVehicleType.map(a => a.vehicle_type).join(',')
            console.log("getVehicleType", getVehicleType)
            let selectParams = `MAX(s.subscription_plan_duration_id) subscription_plan_duration_id,MAX(type_id) type_id,MAX(s.duration_title_lang->>'${language}') duration_title,SUM(sp.original_price) original_price ,SUM(sp.promotional_price) promotional_price,MAX(sp.promotional_ids) promotional_ids`,
                where = ` s.is_active = 1 AND sp.subscription_plan_id=${body.subscription_plan_id} AND type_id IN (${getVehicleType}) GROUP BY subscription_duration_id`, //
                join = ` LEFT JOIN mst_subscription_plan_duration s ON s.subscription_plan_duration_id=sp.subscription_duration_id`

            let userPlanDuration = await db.select('subscription_promotional_relation sp' + join, selectParams, where)
            if (userPlanDuration.length > 0) {
                let getPromotionById = async _ => {
                    for (let cnt = 0; cnt < userPlanDuration.length; cnt++) {
                        let promotionDetails = await this.getPromotionalById(userPlanDuration[cnt].promotional_ids, language)
                        userPlanDuration[cnt].promotionList = (promotionDetails.length > 0) ? promotionDetails : [];
                    }
                }

                await getPromotionById();
                return userPlanDuration
            } else {
                throw 'NO_PLAN_DURATION_FOUND'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getVehicleTypeById(user_id, vehicle_id) {
        try {
            let selectParams = `vehicle_type,vehicle_relation_id`,
                where = ` customer_id = ${user_id} AND is_deleted = 0`
            if (vehicle_id) {
                where = ` vehicle_relation_id = ${vehicle_id} AND is_deleted = 0`
            }
            let userVehicle = await db.select('customer_vehicle_relation cvr', selectParams, where)
            if (userVehicle.length > 0) {
                return userVehicle
            } else {
                return []
            }
        } catch (error) {
            return promise.reject(error)
        }

    }
    async insertPlanDetails(body, language) {
        try {
            if ('customer_subscription_relation_id' in body) {
                await this.updatePlanDetails(body, language)
            } else {
                let getSubscriptionType = await this.getSubscriptionType(body.subscription_plan_id, language);
                console.log("getSubscriptionType", getSubscriptionType)
                let getVehicleId = await this.getVehicleTypeById(body.user_id)
                let vehicle_ids = getVehicleId.map(a => a.vehicle_relation_id).join(',')
                let vehicle_type = getVehicleId.map(a => a.vehicle_type).join(',')
                if (getSubscriptionType.length > 0) {
                    let data = {
                        customer_id: body.user_id,
                        subscription_plan_id: body.subscription_plan_id,
                        subscription_plan_duration_id: body.subscription_plan_duration_id,
                        price: body.price,
                        subscription_type: getSubscriptionType[0].subscription_type,
                        building_id: body.building_id,
                        has_paid: 0,
                        created_date: dateHelper.getCurrentTimeStamp(),
                        modified_date: dateHelper.getCurrentTimeStamp(),
                        is_active: 1
                    },
                        dataPromotion = {
                            customer_id: body.user_id,
                            promotional_id: body.subscription_plan_id,
                            vehicle_id: body.subscription_plan_duration_id,
                            is_completed: 0,
                            customer_subscription_id: getSubscriptionType[0].subscription_type,
                            created_date: dateHelper.getCurrentTimeStamp(),
                            modified_date: dateHelper.getCurrentTimeStamp()
                        }
                    vehicle_ids = vehicle_ids.split(',');
                    vehicle_type = vehicle_type.split(',')
                    if ('vehicle_id' in body) {   // if user wants to purchase plan for any particular vehicle (from my cars/bikes screen > buy subscription)
                        let where = ` vehicle_relation_id = ${body.vehicle_id}`,
                            selectParams = `vehicle_type`
                        let vehicle = await db.select('customer_vehicle_relation', selectParams, where)
                        vehicle_ids = [], vehicle_type = []
                        vehicle_ids.push(body.vehicle_id)
                        vehicle_type.push(vehicle[0].vehicle_type)
                    }
                    if (body.subscription_start_date_by_customer != '') {
                        data.subscription_start_date_by_customer = body.subscription_start_date_by_customer
                    }
                    for (let cnt = 0; cnt < vehicle_ids.length; cnt++) {
                        data.vehicle_id = vehicle_ids[cnt];
                        let priceDetail = await this.getSubscriptionPriceById(body.subscription_plan_id, body.subscription_plan_duration_id, vehicle_type[cnt])
                        data.price = priceDetail[0].promotional_price
                        data.original_price = priceDetail[0].original_price
                        let customer_subscription_id = await db.insert('customer_subscription_relation', data)
                        dataPromotion.vehicle_id = vehicle_ids[cnt]
                        dataPromotion.customer_subscription_id = customer_subscription_id.customer_subscription_relation_id
                        this.setPromotionToUserVehicle(data.subscription_plan_id, dataPromotion)
                    }
                } else {
                    throw 'NO_PLAN_FOUND'
                }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updatePlanDetails(body, language) {    // this is used for screens 3.15(summary) or if summary scrren is displayed any where, don't use in 7.4(subscription_details)>change subscription, 
        try {
            let getSubscriptionType = '', condition
            condition = `customer_subscription_id = ${body.customer_subscription_relation_id}`
            await db.delete('customer_promotional_relation', condition)
            let data = {
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if ('subscription_plan_id' in body) {
                data.subscription_plan_id = body.subscription_plan_id
                getSubscriptionType = await this.getSubscriptionType(body.subscription_plan_id, language)
                data.subscription_type = getSubscriptionType[0].subscription_type
            }
            if ('subscription_plan_duration_id' in body) {
                data.subscription_plan_duration_id = body.subscription_plan_duration_id
            }
            let where = ` customer_subscription_relation_id = ${body.customer_subscription_relation_id}`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON csr.vehicle_id = cvr.vehicle_relation_id`,
                selectParams = `csr.vehicle_id, cvr.vehicle_type`
            let plan_details = await db.select('customer_subscription_relation csr' + join, selectParams, where)
            let priceDetail = await this.getSubscriptionPriceById(body.subscription_plan_id, body.subscription_plan_duration_id, plan_details[0].vehicle_type)
            data.price = priceDetail[0].promotional_price
            data.original_price = priceDetail[0].original_price
            if ('subscription_start_date_by_customer' in body && body.subscription_start_date_by_customer != '') {
                data.subscription_start_date_by_customer = body.subscription_start_date_by_customer
            }
            condition = ` customer_subscription_relation_id = ${body.customer_subscription_relation_id} `
            await db.update('customer_subscription_relation', condition, data)
            let result = await db.select('customer_subscription_relation', '*', condition)
            let dataPromotion = {
                customer_id: body.user_id,
                promotional_id: '',
                vehicle_id: result[0].vehicle_id,
                is_completed: 0,
                customer_subscription_id: body.customer_subscription_relation_id,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            this.setPromotionToUserVehicle(data.subscription_plan_id, dataPromotion)
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteUserPlan(body) {
        try {
            let condition = `customer_subscription_relation_id = ${body.customer_subscription_relation_id}`
            await db.delete('customer_subscription_relation', condition)
            condition = `customer_subscription_id = ${body.customer_subscription_relation_id}`
            await db.delete('customer_promotional_relation', condition)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async clearUserPlanDetails(body) {
        try {
            let customer_subscription_relation_ids = []
            let condition = `customer_id = ${body.user_id} AND has_paid = 0`,
                selectParams = 'customer_subscription_relation_id',
                plans = await db.select('customer_subscription_relation', selectParams, condition)
            for (let p of plans) {
                customer_subscription_relation_ids.push(p.customer_subscription_relation_id)
            }
            if (customer_subscription_relation_ids.length > 0) {
                condition = `customer_subscription_id IN (${customer_subscription_relation_ids})`
                await db.delete('customer_promotional_relation', condition)
                condition = `customer_id = ${body.user_id} AND has_paid = 0`
                await db.delete('customer_subscription_relation', condition)
            }
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getSubscriptionPriceById(subscription_plan_id, subscription_duration_id, typeId) {
        try {
            let selectParams = `promotional_price,original_price`,
                where = ` subscription_plan_id = ${subscription_plan_id} AND  subscription_duration_id = ${subscription_duration_id} AND type_id = ${typeId}`
            let userVehicle = await db.select('subscription_promotional_relation cvr', selectParams, where)
            if (userVehicle.length > 0) {
                return userVehicle
            } else {
                return []
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getUserPlanDetails(body, language) {
        try {
            let getUserVehicle = await vehiclesHelper.getSingleVehicle(body.vehicle_id, language)
            let getUserVehiclePlan = await userScheduleHelper.getUserVehiclePlan(body, 1, language)
            let getUserVehicleDuration = await userScheduleHelper.getUserVehicleDuration(body, 1, language)
            body.customer_subscription_id = getUserVehicleDuration.customer_subscription_relation_id
            let getUserVehiclePromotion = await userScheduleHelper.getUserVehiclePromotion(body, language)
            let data = {
                type_id: getUserVehicle.type_id,
                subscription_plan_id: getUserVehiclePlan.subscription_plan_id,
                subscription_plan_duration_id: getUserVehicleDuration.subscription_plan_duration_id
            }
            let subscriptionPrice = await userScheduleHelper.getSubscriptionPrice(data)
            return { userVehicle: getUserVehicle, userVehiclePlan: getUserVehiclePlan, userVehicleDuration: getUserVehicleDuration, userVehiclePromotion: getUserVehiclePromotion, subscriptionPrice: subscriptionPrice }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getPromotionalById(promotionalId, language) {
        try {
            let selectParams = `promotional_text_lang->>'${language}' AS promotional_text`,
                where = ` promotional_id IN (${promotionalId}) AND is_active = 1`
            let promotionDetails = await db.select('mst_promotional', selectParams, where)
            if (promotionDetails.length > 0) {
                return promotionDetails
            } else {
                return []
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getSubscriptionType(subscription_plan_id, language) {
        try {
            let selectParams = `subscription_plan_lang->>'${language}' AS subscription_plan, subscription_details_lang->>'${language}' AS subscription_details, interior_wash_details_lang->>'${language}' AS interior_wash_details,
                                subscription_type,exterior_wash_counts,interior_wash_counts`,
                where = ` subscription_plan_id = ${subscription_plan_id} AND is_active = 1`
            let subscriptionType = await db.select('mst_subscription_plan', selectParams, where)
            if (subscriptionType.length > 0) {
                return subscriptionType
            } else {
                return []
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async setPromotionToUserVehicle(subscription_id, dataPromotional) {
        try {
            let getPromotionalList = await this.getPromotionalList(subscription_id);
            console.log("getPromotionalList", getPromotionalList)
            if (getPromotionalList.length > 0) {
                getPromotionalList = getPromotionalList[0].promotional_ids.split(',');
                for (let cnt = 0; cnt < getPromotionalList.length; cnt++) {
                    dataPromotional.promotional_id = getPromotionalList[cnt]
                    console.log("dataPromotional", dataPromotional)
                    db.insert('customer_promotional_relation', dataPromotional);
                }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getPromotionalList(subscription_plan_id) {
        try {
            let selectParams = "promotional_ids",
                where = ` subscription_plan_id = ${subscription_plan_id}`
            let promotionalList = await db.select('subscription_promotional_relation', selectParams, where)
            if (promotionalList.length > 0) {
                return promotionalList
            } else {
                return []
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async buyPlan(body) {
        try {
            let where = `customer_id=${body.user_id}`,
                data = {
                    has_any_active_plan: body.has_any_active_plan,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            await db.update('customer', where, data)
            let customer_subscription_relation_id = body.customer_subscription_relation_id.split(',');
            console.log("11111111111", customer_subscription_relation_id)
            const buySubscription = async () => {
                for (let c = 0; c < customer_subscription_relation_id.length; c++) {
                    let selectParams = `csr.subscription_plan_duration_id, spd.duration_month`,
                        where = `customer_subscription_relation_id = ${customer_subscription_relation_id[c]}`,
                        join = ` LEFT JOIN mst_subscription_plan_duration spd ON spd.subscription_plan_duration_id = csr.subscription_plan_duration_id `,
                        subscription = await db.select('customer_subscription_relation csr' + join, selectParams, where)
                    let subscription_dates = await this.getSubscriptionDates(subscription[0].duration_month)
                    data = {
                        has_paid: 1,
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                    data.subscription_start_date = subscription_dates.subscription_start_date
                    data.subscription_end_date = subscription_dates.subscription_end_date
                    console.log("22222222", data)
                    await db.update('customer_subscription_relation', where, data)
                    where = ` customer_subscription_relation_id = ${customer_subscription_relation_id[c]}`
                    let subscription_details = await db.select('customer_subscription_relation', `*, to_char(subscription_end_date, 'YYYY-MM-DD') as subscription_validity`, where)
                    data = {
                        subscription_id: subscription_details[0].customer_subscription_relation_id,
                        subscription_type: subscription_details[0].subscription_type,
                        subscription_validity: subscription_details[0].subscription_validity,
                        subscription_amount: subscription_details[0].price,
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                    console.log("3333333333", data)
                    where = ` vehicle_relation_id = ${subscription_details[0].vehicle_id}`
                    await db.update('customer_vehicle_relation', where, data)
                    data = {
                        customer_id: body.user_id,
                        subscription_id: subscription_details[0].customer_subscription_relation_id,
                        payment_date: dateHelper.getFormattedDate(),
                        created_date: dateHelper.getCurrentTimeStamp(),
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                    await db.insert('payment', data)
                }
            }
            await buySubscription();
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getCancelPlanReasons(body, language) {
        try {
            let where = `is_active = 1`,
                selectParams = `cancel_plan_reason_id,reason_lang->>'${language}' AS reason`,
                reasons = await db.select('mst_cancel_plan_reasons', selectParams, where)
            return reasons
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getPaymentHistory(body, language) {
        try {
            let where = `p.customer_id = ${body.user_id}`,
                selectParams = `p.payment_id,p.subscription_id,to_char(p.payment_date,'dd Mon, YYYY') as payment_date,csr.subscription_plan_id,csr.subscription_plan_duration_id,csr.vehicle_id,to_char(csr.subscription_start_date,'dd Mon, YYYY') as plan_start_date,csr.price,msp.subscription_plan_lang->>'${language}' AS "subscription_plan",msp.subscription_type,mspd.duration_month,
            cvr.is_car, cvr.vehicle_number, cvr.vehicle_image, 
            CASE cvr.is_car WHEN 1 THEN cb.brand_id ELSE bb.brand_id END brand_id, 
            CASE cvr.is_car WHEN 1 THEN cb.brand_name_lang->>'${language}' ELSE bb.brand_name_lang->>'${language}' END brand_name, 
            CASE cvr.is_car WHEN 1 THEN cm.model_id ELSE bm.model_id END model_id, 
            CASE cvr.is_car WHEN 1 THEN cm.model_name_lang->>'${language}'
            ELSE bm.model_name_lang->>'${language}'
            END model_name,
            c.color_id, c.color_name_lang->>'${language}' AS vehicle_color,c.color_hexcode,vt.type_id,
            vt.type_name_lang->>'${language}' AS type_name`,
                join = ` LEFT JOIN customer_subscription_relation csr ON csr.customer_subscription_relation_id = p.subscription_id
            LEFT JOIN mst_subscription_plan msp ON msp.subscription_plan_id = csr.subscription_plan_id
            LEFT JOIN mst_subscription_plan_duration mspd ON mspd.subscription_plan_duration_id = csr.subscription_plan_duration_id
            LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = csr.vehicle_id
            LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand 
            LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model 
            LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand 
            LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model
            LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type
            LEFT JOIN color c ON c.color_id = cvr.vehicle_color`
            let payment_history = await db.select('payment p' + join, selectParams, where)
            return payment_history
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getSubscriptionDates(duration_month) {
        try {
            let currentDate = new Date()
            let subscription_start_date = dateHelper.getFormattedDate(currentDate)
            currentDate.setMonth(currentDate.getMonth() + duration_month)
            let subscription_end_date = dateHelper.getFormattedDate(currentDate)
            console.log("@@@@@@@@@", subscription_start_date, subscription_end_date)
            let subscriptionDates = {
                subscription_start_date: subscription_start_date,
                subscription_end_date: subscription_end_date
            }
            return subscriptionDates
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new BuildingPlanHelper()