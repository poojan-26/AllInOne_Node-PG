const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

/**
 * This VehicleWashHelper class contains all vehicle wash related API's logic and required database operations. This class' functions are called from vehicleWash controller.
 */

class VehicleWashHelper {
    async getWashServices(body, language, user_type) {
        try {
            let condition
            if (body.is_for_executive == 1) {
                condition = `aw.executive_id = ${body.service_provider_id}`
            } else {
                condition = `aw.supervisor_id = ${body.service_provider_id}`
            }
            let current_date = dateHelper.getFormattedDate()
            let selectParams = `b.building_id,b.building_name_lang->>'${language}' AS "building_name",b.complex_id,b.location,b.latitude,b.longitude,
            COALESCE(JSON_AGG(json_build_object('vehicle_wash_id',aw.vehicle_wash_id,'is_completed',aw.is_completed,'vehicle_id',aw.vehicle_id,'vehicle_number',cvr.vehicle_number,'vehicle_image',cvr.vehicle_image,'is_car',cvr.is_car,'brand_id',CASE cvr.is_car WHEN 1 THEN cb.brand_id ELSE bb.brand_id END,'brand_name',CASE cvr.is_car WHEN 1 THEN cb.brand_name_lang->>'${language}'
            ELSE bb.brand_name_lang->>'${language}' END,'model_id',CASE cvr.is_car WHEN 1 THEN cm.model_id ELSE bm.model_id END,'model_name',CASE cvr.is_car WHEN 1 THEN cm.model_name_lang->>'${language}' ELSE bm.model_name_lang->>'${language}' END))) as wash_details`,
                join = ` LEFT JOIN vehicle_wash_active_week aw ON aw.building_id=b.building_id 
            LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id 
            LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand 
            LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model 
            LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand 
            LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model`,
                where = condition + ` AND aw.vehicle_wash_date = '${current_date}' AND aw.wash_type = ${body.wash_type} GROUP BY b.building_id`
            let washServices = await db.select('building b' + join, selectParams, where)
            if (user_type == 1) {  // only for executive app
                const vehicleWashDetail = async () => {
                    for (let w = 0; w < washServices.length; w++) {
                        for (let v = 0; v < washServices[w].wash_details.length; v++) {
                            let data = {
                                vehicle_wash_id: washServices[w].wash_details[v].vehicle_wash_id,
                                is_completed: washServices[w].wash_details[v].is_completed,
                                vehicle_id: washServices[w].wash_details[v].vehicle_id,
                                user_id: body.user_id
                            }
                            washServices[w].wash_details[v].washDetails = await this.getUserVehicleWashDetail(data, language)
                        }
                    }
                }
                await vehicleWashDetail();
            }
            return washServices
        } catch (error) {
            return promise.reject(error)
        }
    }
    async startDay(body) {
        try {
            const latitude = body.latitude,
                longitude = body.longitude
            let selectParams = `building_id`,
                where = ` (( 3963 * ACOS( COS( RADIANS(${latitude}) ) * COS( RADIANS( latitude ) ) * COS( RADIANS( longitude ) - RADIANS(${longitude}) ) + SIN(  RADIANS(${latitude}) ) * SIN( RADIANS( latitude ) ) ) ) * 1.609 ) <= 0.5 AND building_id IN (${body.building_id})`,
                buildings = await db.select('building', selectParams, where)
            if (buildings.length > 0) {
                let data = {
                    executive_id: body.user_id,
                    date: dateHelper.getFormattedDate(),
                    start_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                    created_date: dateHelper.getCurrentTimeStamp(),
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
                await db.insert('executive_daily_job', data)
                return true
            } else {
                throw 'CANNOT_START_DAY'
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async endDay(body) {
        try {
            let data = {
                end_time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                modified_date: dateHelper.getCurrentTimeStamp()
            },
                current_date = dateHelper.getFormattedDate(),
                where = ` executive_id = ${body.user_id} AND date = '${current_date}' AND start_time IS NOT NULL`
            await db.update('executive_daily_job', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleWashDetail(body, language) {
        try {
            let userVehicleWashDetail = await this.getUserVehicleWashHistoryList(body, language, body.is_completed);
            userVehicleWashDetail.userVehicleWashHistory = userVehicleWashDetail.userVehicleWashHistory[0]
            if (body.is_completed == 1) {
                let getUserVehicleWashImagePreService = await this.getUserVehicleWashImageByType(body, 1);
                let getUserVehicleWashImagePostService = await this.getUserVehicleWashImageByType(body, 2);
                let getUserVehicleWashPromotionalService = await this.getUserVehicleWashPromotionImage(body);
                return { vehicleWashDetail: userVehicleWashDetail, userVehicleWashImagePreService: (getUserVehicleWashImagePreService.length > 0) ? getUserVehicleWashImagePreService[0].vehicle_wash_picture_path.split(",") : [], userVehicleWashImagePostService: (getUserVehicleWashImagePostService.length > 0) ? getUserVehicleWashImagePostService[0].vehicle_wash_picture_path.split(",") : [], userVehicleWashPromotionalService: getUserVehicleWashPromotionalService }
            } else {
                let incompletedPromotions = await this.selectIncompletedPromotions(body, language)
                return { vehicleWashDetail: userVehicleWashDetail, incompletedPromotions: incompletedPromotions }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async uploadVehicleImage(body) {
        try {
            let condition = `vehicle_relation_id = ${body.vehicle_id}`,
                data = {
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            if (body.vehicle_image) {
                data.vehicle_image = body.vehicle_image
            }
            let result = await db.update('customer_vehicle_relation', condition, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleWashHistoryList(body, language, is_completed) {
        try {
            let condition = '', user_condition = ''
            if ('vehicle_wash_date' in body && body.vehicle_wash_date != '') {
                condition = ` AND aw.vehicle_wash_date = '${body.vehicle_wash_date}'`
            }
            if (body.is_for_executive == 1) {
                user_condition = `aw.executive_id = ${body.service_provider_id}`
            } else {
                user_condition = `aw.supervisor_id = ${body.service_provider_id}`
            }
            let selectParams = `aw.vehicle_wash_id,aw.customer_id,cu.full_name as customer_name,sp.full_name_lang->>'${language}' as executive_name,sp1.full_name_lang->>'${language}' as supervisor_name,aw.vehicle_id,aw.is_car,to_char(aw.vehicle_wash_date,'dd Mon, YYYY') as vehicle_wash_date,EXTRACT(DOW FROM date (aw.vehicle_wash_date)) as vehicle_wash_day,to_char(aw.interior_time_slot, 'HH12:MI AM') as interior_time_slot,aw.start_time,aw.end_time,DATE_PART('hour', aw.end_time - aw.start_time) * 60 + DATE_PART('minute', aw.end_time - aw.start_time) as time_taken,
            CASE aw.is_car
            WHEN 1 THEN cb.brand_name_lang->>'${language}'
            ELSE bb.brand_name_lang->>'${language}'
            END brand_name, 
            CASE aw.is_car
            WHEN 1 THEN cm.model_name_lang->>'${language}'
            ELSE bm.model_name_lang->>'${language}'
            END model_name,
            aw.wash_type,is_completed,cvr.vehicle_number,color_name_lang->>'${language}' as color_name,cvr.vehicle_image,
            vt.type_name_lang->>'${language}' AS type_name,aw.building_id,b.building_name_lang->>'${language}' AS "building_name",b.complex_id,b.location,b.latitude,b.longitude,aw.has_reviewed,aw.ticket_id,vwr.ratings,vwr.category_id,mtc.category_name_lang->>'${language}' as category_name`,
                where = user_condition + ` AND aw.is_completed = ${is_completed} AND cvr.is_deleted = 0` + condition + ` ORDER BY aw.vehicle_wash_date DESC, aw.start_time DESC `,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                         LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                         LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color 
                         LEFT JOIN customer cu ON cu.customer_id = aw.customer_id
                         LEFT JOIN service_provider sp ON sp.service_provider_id = aw.executive_id
                         LEFT JOIN service_provider sp1 ON sp1.service_provider_id = aw.supervisor_id
                         LEFT JOIN building b ON b.building_id = aw.building_id
                         LEFT JOIN vehicle_wash_review vwr ON vwr.vehicle_wash_review_id = aw.vehicle_wash_review_id
                         LEFT JOIN mst_ticket_categories mtc ON mtc.category_id = vwr.category_id`
            let pagination = ''
            if ('vehicle_wash_id' in body) {  // this is used for getVehicleWashDetail api
                where = ` aw.is_completed = ${is_completed} AND aw.vehicle_wash_id = ${body.vehicle_wash_id}`
            } else {
                pagination = ` LIMIT ${Number(config.paginationCount)} OFFSET ${Number(config.paginationCount) * (Number(body.page_no) - 1)}`
            }
            let userVehicleWashHistory = await db.select('vehicle_wash_active_week aw' + join, selectParams, where + pagination)
            userVehicleWashHistory = userVehicleWashHistory
            where = user_condition + ` AND aw.is_completed = ${is_completed} AND cvr.is_deleted = 0 ` + condition
            if ('page_no' in body) {
                let userVehicleWashHistoryCount = await db.select('vehicle_wash_active_week aw' + join, `COUNT(*)`, where)
                return { userVehicleWashHistory, userVehicleWashHistoryCount: userVehicleWashHistoryCount[0].count };
            } else {  // this is used for getVehicleWashDetail api(page no not required)
                return { userVehicleWashHistory };
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleWashImageByType(body, type) {
        try {
            let selectParams = `array_to_string(array_agg(vehicle_wash_picture_path),',') vehicle_wash_picture_path  `,
                where = ` vehicle_wash_picture_type = ${type} AND vehicle_wash_id = ${body.vehicle_wash_id} GROUP BY vehicle_wash_id`

            let userVehicleWashImage = await db.select('vehicle_wash_picture_relation', selectParams, where)
            if (userVehicleWashImage.length > 0) {
                return userVehicleWashImage;
            } else {
                return [];
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleWashPromotionImage(body) {
        try {
            let selectParams = `cpr.vehicle_promotional_picture_path,mp.promotional_text`,
                where = `  cpr.vehicle_wash_id = ${body.vehicle_wash_id} AND cpr.is_completed = 1`,
                join = ` LEFT JOIN mst_promotional mp on mp.promotional_id = cpr.promotional_id`
            let userVehicleWashImage = await db.select('customer_promotional_relation cpr' + join, selectParams, where)
            if (userVehicleWashImage.length > 0) {
                return userVehicleWashImage;
            } else {
                return [];
            }

        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectIncompletedPromotions(body, language) {
        try {
            let selectParams = `customer_promotional_relation.customer_promotional_relation_id, mst_promotional.promotional_text_lang->>'${language}' AS promotional_text`,
                joins = ` LEFT JOIN mst_promotional ON mst_promotional.promotional_id=customer_promotional_relation.promotional_id
                        INNER JOIN customer_vehicle_relation ON customer_vehicle_relation.subscription_id=customer_promotional_relation.customer_subscription_id `,
                where = ` customer_promotional_relation.is_completed=0 AND vehicle_id = ${body.vehicle_id} `
            let promotions = await db.select('customer_promotional_relation' + joins, selectParams, where)
            return promotions
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertVehicleWashImages(body, vehicle_wash_picture_type) {
        try {
            const columns = '(vehicle_wash_id, vehicle_wash_picture_path, vehicle_wash_picture_type, created_date, modified_date)',
                values = body.car_wash_images.map(image => (
                    `(${body.vehicle_wash_id},'${image}',${vehicle_wash_picture_type},
                    ${dateHelper.getCurrentTimeStamp()},${dateHelper.getCurrentTimeStamp()})`
                )).join(',')
            let wash_images = await db.bulkinsert('vehicle_wash_picture_relation', columns, values, "", "")
            return wash_images
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertPromotionImages(body) {
        try {
            let promotion_ids = body.promotion_ids.split(',');
            for (let i = 0; i < promotion_ids.length; i++) {
                let condition = ` customer_promotional_relation_id=${promotion_ids[i]} `,
                    data = {
                        is_completed: 1,
                        vehicle_wash_id: body.vehicle_wash_id,
                        vehicle_promotional_picture_path: body.promotion_images[i],
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                await db.update('customer_promotional_relation', condition, data)
            }
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateTime(body, key) {
        try {
            const condition = ` vehicle_wash_id=${body.vehicle_wash_id} `,
                data = {
                    [key]: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            let wash_images = await db.update('vehicle_wash_active_week', condition, data)
            return wash_images
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertVehicleWashData(body) {
        try {
            for (let j = 0; j < body.wash_data.length; j++) {
                for (let i = 0; i < body.wash_data[j].promotions.length; i++) {
                    const condition = ` customer_promotional_relation_id=${body.wash_data[j].promotions[i].id} `,
                        data = {
                            is_completed: 1,
                            vehicle_wash_id: body.wash_data[j].vehicle_wash_id,
                            vehicle_promotional_picture_path: body.wash_data[j].promotions[i].image,
                            modified_date: dateHelper.getCurrentTimeStamp()
                        }
                    await db.update('customer_promotional_relation', condition, data)
                }
                const condition = ` vehicle_wash_id=${body.wash_data[j].vehicle_wash_id} `,
                    data = {
                        start_time: body.wash_data[j].start_time,
                        end_time: body.wash_data[j].end_time,
                        is_completed: 1,
                        modified_date: dateHelper.getCurrentTimeStamp()
                    }
                if (body.wash_data[j].vehicle_image && body.wash_data[j].vehicle_image.length > 0) {
                    const vehicle_id = await db.select('vehicle_wash_active_week', 'vehicle_id', condition),
                        conditionVehicleImage = ` vehicle_relation_id=${vehicle_id[0].vehicle_id} `,
                        dataVehicleImage = {
                            vehicle_image: body.wash_data[j].vehicle_image[0]
                        }
                    await db.update('customer_vehicle_relation', conditionVehicleImage, dataVehicleImage)
                }
                await db.update('vehicle_wash_active_week', condition, data)
            }
            const washColumns = '(vehicle_wash_id, vehicle_wash_picture_path, vehicle_wash_picture_type, created_date, modified_date)',
                washValues = body.wash_data.map((washData) => (
                    washData.pre_wash_images.map(image => (
                        `(${washData.vehicle_wash_id},'${image}',1,
                    ${dateHelper.getCurrentTimeStamp()},${dateHelper.getCurrentTimeStamp()})`
                    )).join(',') + ',' + washData.post_wash_images.map(image => (
                        `(${washData.vehicle_wash_id},'${image}',2,
                        ${dateHelper.getCurrentTimeStamp()},${dateHelper.getCurrentTimeStamp()})`
                    )).join(',')
                )).join(',')
            await db.bulkinsert('vehicle_wash_picture_relation', washColumns, washValues, "", "")
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getRaisedTickets(body, language) {
        try {
            let selectParams = `ut.ticket_id,aw.vehicle_wash_id,aw.customer_id,cu.full_name as customer_name,sp.full_name_lang->>'${language}' as executive_name,sp1.full_name_lang->>'${language}' as supervisor_name,aw.vehicle_id,aw.is_car,to_char(aw.vehicle_wash_date,'dd Mon, YYYY') as vehicle_wash_date,EXTRACT(DOW FROM date (aw.vehicle_wash_date)) as vehicle_wash_day,to_char(aw.interior_time_slot, 'HH12:MI AM') as interior_time_slot,aw.start_time,aw.end_time,DATE_PART('hour', aw.end_time - aw.start_time) * 60 + DATE_PART('minute', aw.end_time - aw.start_time) as time_taken,
            CASE aw.is_car
            WHEN 1 THEN cb.brand_name_lang->>'${language}'
            ELSE bb.brand_name_lang->>'${language}'
            END brand_name, 
            CASE aw.is_car
            WHEN 1 THEN cm.model_name_lang->>'${language}'
            ELSE bm.model_name_lang->>'${language}'
            END model_name,
            aw.wash_type,is_completed,cvr.vehicle_number,color_name_lang->>'${language}' as color_name,cvr.vehicle_image,
            vt.type_name_lang->>'${language}' AS type_name`,
                where = ` ut.supervisor_id = ${body.user_id} AND ut.is_resolved = 0 AND cvr.is_deleted = 0 `,
                join = ` LEFT JOIN vehicle_wash_active_week aw ON aw.vehicle_wash_id = ut.vehicle_wash_id
                LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type
                LEFT JOIN color c ON c.color_id = cvr.vehicle_color 
                LEFT JOIN customer cu ON cu.customer_id = aw.customer_id
                LEFT JOIN service_provider sp ON sp.service_provider_id = aw.executive_id
                LEFT JOIN service_provider sp1 ON sp1.service_provider_id = aw.supervisor_id`,
                pagination = ''
            if ('page_no' in body && body.page_no != '') {
                pagination = ` LIMIT ${Number(config.paginationCount)} OFFSET ${Number(config.paginationCount) * (Number(body.page_no) - 1)}`
            }
            let raisedTickets = await db.select('user_ticket ut' + join, selectParams, where + pagination)
            if ('page_no' in body) {
                let raisedTicketsCount = await db.select('user_ticket ut' + join, `COUNT(*)`, where)
                return { raisedTickets, raisedTicketsCount: raisedTicketsCount[0].count };
            } else {
                return { raisedTickets };
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getExecutivesForTicket(body, language) {
        try {
            let result = {},
                current_date = new Date()
            let next_service_date = new Date(current_date.setDate(current_date.getDate() + 1))
            let current_day = next_service_date.getDay()
            let admin = await db.select('mst_config_admin', `week_day_holiday`)
            if (current_day == admin[0].week_day_holiday) {  // check, day is off day or not
                next_service_date = new Date(next_service_date.setDate(next_service_date.getDate() + 1))
            }
            next_service_date = dateHelper.getFormattedDate(next_service_date)
            let next_service_date_1 = await db.custom(`SELECT to_char('${next_service_date}' :: DATE,'dd Mon, YYYY') as date`)
            result.next_service_date = next_service_date
            result.next_service_date_1 = next_service_date_1.rows[0].date
            let selectParams = `sp.service_provider_id, sp.full_name_lang->>'${language}' AS executive_name`,
                joins = ` LEFT JOIN service_provider sp ON sp.service_provider_id = ser.executive_id 
            LEFT JOIN executive_job_assign_relation ejar ON ejar.executive_id = ser.executive_id`,
                condition = ` ser.supervisor_id = ${body.user_id} AND sp.provider_type = 1 AND ejar.building_id = ${body.building_id}`,
                executives_data = await db.select('supervisor_executive_relation ser' + joins, selectParams, condition)
            result.executives = executives_data
            return result
        } catch (error) {
            return promise.reject(error)
        }
    }
    async assignTicket(body) {
        try {
            let vehicleWashData = await db.select('vehicle_wash_active_week', '*', ` vehicle_wash_id = ${body.vehicle_wash_id}`)
            let data = {
                vehicle_id: vehicleWashData[0].vehicle_id,
                customer_id: vehicleWashData[0].customer_id,
                building_id: vehicleWashData[0].building_id,
                complex_id: vehicleWashData[0].complex_id,
                executive_id: body.executive_id,
                supervisor_id: body.user_id,
                is_car: vehicleWashData[0].is_car,
                wash_type: 1,
                executive_type: 1,
                is_completed: 0,
                vehicle_wash_date: body.vehicle_wash_date,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp(),
                top_supervisor_id: vehicleWashData[0].top_supervisor_id,
                is_ticket_service: 1,
                assigned_ticket_id: body.ticket_id
            }
            await db.insert('vehicle_wash_active_week', data)
            data = {
                is_resolved: 1,
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            await db.update('user_ticket', ` ticket_id = ${body.ticket_id}`, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getWashServicesForTopSupervisor(body, language, user_type) {
        try {
            let condition = `aw.top_supervisor_id = ${body.service_provider_id}`
            let current_date = dateHelper.getFormattedDate()
            let selectParams = `b.building_id,b.building_name_lang->>'${language}' AS "building_name",b.complex_id,b.location,b.latitude,b.longitude,
            COALESCE(JSON_AGG(json_build_object('vehicle_wash_id',aw.vehicle_wash_id,'is_completed',aw.is_completed,'vehicle_id',aw.vehicle_id,'vehicle_number',cvr.vehicle_number,'vehicle_image',cvr.vehicle_image,'is_car',cvr.is_car,'brand_id',CASE cvr.is_car WHEN 1 THEN cb.brand_id ELSE bb.brand_id END,'brand_name',CASE cvr.is_car WHEN 1 THEN cb.brand_name_lang->>'${language}'
            ELSE bb.brand_name_lang->>'${language}' END,'model_id',CASE cvr.is_car WHEN 1 THEN cm.model_id ELSE bm.model_id END,'model_name',CASE cvr.is_car WHEN 1 THEN cm.model_name_lang->>'${language}' ELSE bm.model_name_lang->>'${language}' END))) as wash_details`,
                join = ` LEFT JOIN vehicle_wash_active_week aw ON aw.building_id=b.building_id 
            LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id 
            LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand 
            LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model 
            LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand 
            LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model`,
                where = condition + ` AND aw.vehicle_wash_date = '${current_date}' AND aw.wash_type = ${body.wash_type} GROUP BY b.building_id`
            let washServices = await db.select('building b' + join, selectParams, where)
            return washServices
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new VehicleWashHelper()