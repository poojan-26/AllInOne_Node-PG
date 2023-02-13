const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

/**
 * This UserScheduleHelper class contains all all vehicle wash related API's logic and required database operations. This class' functions are called from userSchedule controller.
 */

class UserScheduleHelper {
    async getUserVehicleWashList(body, language) {
        try {
            let upcomingServiceList = [], completedServiceList = [], vehicle = {}
            let getSubscribedVehicleList = await this.getSubscribedVehicleList(body)
            const upcomingServiceLoop = async () => {
                for (let v = 0; v < getSubscribedVehicleList.length; v++) {
                    vehicle.exteriorWash = await this.upcomingService(body.user_id, getSubscribedVehicleList[v].vehicle_relation_id, 1, language)
                    vehicle.interiorWash = await this.upcomingService(body.user_id, getSubscribedVehicleList[v].vehicle_relation_id, 2, language)
                    if (vehicle.exteriorWash != undefined || vehicle.interiorWash != undefined) {
                        upcomingServiceList.push({ ...vehicle })
                    }
                }
            }
            await upcomingServiceLoop();
            console.log("1111111111>>", upcomingServiceList)
            const completedServiceLoop = async () => {
                for (let v = 0; v < getSubscribedVehicleList.length; v++) {
                    // vehicle.exteriorWash = await this.completedService(getSubscribedVehicleList[v].vehicle_relation_id, 1, language)
                    // vehicle.interiorWash = await this.completedService(getSubscribedVehicleList[v].vehicle_relation_id, 2, language)
                    // completedServiceList.push({ ...vehicle})
                    let result = await this.completedService(body.user_id, getSubscribedVehicleList[v].vehicle_relation_id, 1, language)
                    if (result != null) {
                        completedServiceList.push(result)
                    }
                    result = await this.completedService(body.user_id, getSubscribedVehicleList[v].vehicle_relation_id, 2, language)
                    if (result != null) {
                        completedServiceList.push(result)
                    }
                }
            }
            await completedServiceLoop();
            console.log("222222222222>>", completedServiceList)
            // let getUserUpcommingWashListExterior = await this.getUserUpcommingWashListExterior(body)
            // let getUserUpcommingWashListInterior = await this.getUserUpcommingWashListInterior(body)
            // let getUserPreviousWashListExterior = await this.getUserPreviousWashListExterior(body)
            // let getUserPreviousWashListInterior = await this.getUserPreviousWashListInterior(body)
            return { upcomingService: upcomingServiceList, completedService: completedServiceList }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getSubscribedVehicleList(body) {
        try {
            let currentDate = dateHelper.getFormattedDate();
            let where = `customer_id = ${body.user_id} AND subscription_id is NOT NULL AND subscription_validity >= '${currentDate}' AND is_active = 1 AND is_deleted = 0`,
                selectParams = `vehicle_relation_id`,
                vehicles = await db.select('customer_vehicle_relation', selectParams, where)
            return vehicles
        } catch (error) {
            return promise.reject(error)
        }
    }
    async upcomingService(user_id, vehicle_id, wash_type, language) {
        try {
            let condition = ``
            if (wash_type == 2) {
                condition = ` AND is_interior_wash_enable = 1`
            }
            let currentDate = dateHelper.getFormattedDate();
            let selectParams = `aw.vehicle_wash_id,aw.executive_id,aw.supervisor_id,aw.top_supervisor_id,aw.vehicle_id,aw.is_car,
            to_char(aw.vehicle_wash_date,'dd Mon, YYYY') as vehicle_wash_date,to_char(aw.interior_time_slot, 'HH12:MI AM') as interior_time_slot,
                CASE aw.is_car
                WHEN 1 THEN cb.brand_name_lang->>'${language}'
                ELSE bb.brand_name_lang->>'${language}'
                END brand_name, 
                CASE aw.is_car
                WHEN 1 THEN cm.model_name_lang->>'${language}'
                ELSE bm.model_name_lang->>'${language}'
                END model_name,
                aw.wash_type,cvr.vehicle_number,color_name_lang->>'${language}' AS color_name,cvr.vehicle_image,
                vt.type_name_lang->>'${language}' AS type_name`,
                where = ` aw.customer_id = ${user_id} AND aw.vehicle_id = ${vehicle_id} AND aw.vehicle_wash_date >= '${currentDate}' AND aw.wash_type = ${wash_type} AND aw.is_completed = 0 AND cvr.is_deleted = 0` + condition + ` ORDER BY aw.vehicle_wash_date LIMIT 1 `,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type  
                LEFT JOIN color c ON c.color_id = cvr.vehicle_color `
            let washDetail = await db.select('vehicle_wash_active_week aw' + join, selectParams, where)
            return washDetail[0]
        } catch (error) {
            return promise.reject(error)
        }
    }
    async completedService(user_id, vehicle_id, wash_type, language) {
        try {
            let currentDate = dateHelper.getFormattedDate();
            let selectParams = `aw.vehicle_wash_id,aw.executive_id,aw.supervisor_id,aw.top_supervisor_id,aw.vehicle_id,aw.is_car,
            to_char(aw.vehicle_wash_date,'dd Mon, YYYY') as vehicle_wash_date,to_char(aw.interior_time_slot, 'HH12:MI AM') as interior_time_slot,aw.start_time,aw.end_time,aw.has_reviewed,aw.vehicle_wash_review_id,vwr.ratings,
                CASE aw.is_car
                WHEN 1 THEN cb.brand_name_lang->>'${language}'
                ELSE bb.brand_name_lang->>'${language}'
                END brand_name, 
                CASE aw.is_car
                WHEN 1 THEN cm.model_name_lang->>'${language}'
                ELSE bm.model_name_lang->>'${language}'
                END model_name,
                aw.wash_type,cvr.vehicle_number,color_name_lang->>'${language}' AS color_name,cvr.vehicle_image,
                vt.type_name_lang->>'${language}' AS type_name`,
                where = ` aw.customer_id = ${user_id} AND aw.vehicle_id = ${vehicle_id} AND aw.vehicle_wash_date <= '${currentDate}' AND aw.wash_type = ${wash_type} AND aw.is_completed = 1 AND cvr.is_deleted = 0 ORDER BY aw.vehicle_wash_date DESC LIMIT 1 `,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type  
                LEFT JOIN color c ON c.color_id = cvr.vehicle_color
                LEFT JOIN vehicle_wash_review vwr ON vwr.vehicle_wash_review_id = aw.vehicle_wash_review_id `
            let washDetail = await db.select('vehicle_wash_active_week aw' + join, selectParams, where)
            return washDetail[0]
        } catch (error) {
            return promise.reject(error)
        }
    }
    async addExecutiveInteriorTimeSlots(body) {
        try {
            await db.delete('executive_interior_slot_relation', 1)
            let admin_config = await db.select('mst_config_admin', '*', `config_id = 1`)
            let executives = await db.select('service_provider', `service_provider_id, full_name`, `provider_type = 1 AND is_active = 1`)
            console.log("admin config>>>>>>>>", admin_config)
            console.log("executives>>>>>>>>", executives)
            for (let i = 0; i < executives.length; i++) {

            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getInteriorTimeSlots(body) {
        try {
            let executive_id = [], final_time_slots = []
            let executives = await db.select('executive_job_assign_relation', `executive_id`, `building_id = ${body.building_id}`)
            console.log("executives", executives)
            if(executives.length == 0) {
                throw 'NO_EXECUTIVE_AVAILABLE'
            }
            for (let e of executives) {
                executive_id.push(e.executive_id)
            }
            console.log("111 executives >>>>>", executive_id)
            let where = `executive_id IN (${executive_id}) AND date = '${body.date}' GROUP BY slot_time ORDER BY slot_time`
            let time_slots = await db.select('executive_interior_slot_relation', `slot_time, to_char(slot_time, 'HH12:MI AM') as slot_time_am, sum(is_available) as is_available`, where)
            console.log("222 Time slots >>>>>", time_slots)
            for (let t of time_slots) {
                let time_slot = {
                    time_slot: t.slot_time,
                    time_slot_am: t.slot_time_am
                }
                if (t.is_available > 0) {
                    time_slot.is_available = 1
                } else {
                    time_slot.is_available = 0
                }
                final_time_slots.push(time_slot)
            }
            console.log("333 FInal Time slots >>>>>", final_time_slots)
            return { time_slots: final_time_slots }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async setInteriorTimeSlot(body) {
        try {
            let selectParams, where, executive_interior_slot_relation
            if (body.is_reschedule == 1) {
                let data = {
                    is_available: 1,
                    vehicle_wash_id: null,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
                where = ` vehicle_wash_id = ${body.vehicle_wash_id}`
                await db.update('executive_interior_slot_relation', where, data)
            }
            let currentDate = dateHelper.getFormattedDate();
            selectParams = `executive_id`
            where = ` customer_id = ${body.user_id} AND wash_type = 1 AND is_car = 1 AND vehicle_wash_date <= '${currentDate}' ORDER BY created_date DESC LIMIT 1`
            let executive = await db.select('vehicle_wash_active_week', selectParams, where)  //1 Find exterior executive
            console.log("executive >>>", executive)
            if (executive.length > 0) {  //2 Exterior executive found
                selectParams = `executive_interior_slot_relation_id, executive_id`
                where = ` executive_id = ${executive[0].executive_id} AND date = '${body.vehicle_wash_date}' AND slot_time = '${body.interior_time_slot}' AND is_available = 1`
                executive_interior_slot_relation = await db.select('executive_interior_slot_relation', selectParams, where)  //3 Check that executive's time_slot available or not?
                if (executive_interior_slot_relation.length > 0) {   //4  time_slot available
                    executive = executive_interior_slot_relation[0]
                    // 5 Assign slot
                    this.assignSlot(body, executive)
                } else {  //6 time_slot not available
                    selectParams = `executive_interior_slot_relation_id, executive_id`
                    where = ` date = '${body.vehicle_wash_date}' AND slot_time = '${body.interior_time_slot}' AND is_available = 1`
                    executive_interior_slot_relation = await db.select('executive_interior_slot_relation', selectParams, where)  //7 Find available executives
                    if (executive_interior_slot_relation.length > 0) {  //8 Executives found
                        executive = executive_interior_slot_relation[0]  //9 Choose first available executive
                        // 10 Assign slot
                        this.assignSlot(body, executive)
                    } else {   //11 Executives not found
                        throw 'SLOT_NOT_AVAILABLE'   //12 Slots not available
                    }
                }
            } else {   //13  Exterior executive not found
                selectParams = `executive_interior_slot_relation_id, executive_id`
                where = ` date = '${body.vehicle_wash_date}' AND slot_time = '${body.interior_time_slot}' AND is_available = 1`
                executive_interior_slot_relation = await db.select('executive_interior_slot_relation', selectParams, where)  //14 Find available executives 
                if (executive_interior_slot_relation.length > 0) {  //15 Executives found
                    executive = executive_interior_slot_relation[0]  //16 Choose first available executive
                    // 17 Assign slot 
                    await this.assignSlot(body, executive)
                } else {   //18 Executives not found
                    throw 'SLOT_NOT_AVAILABLE'   //19 Slots not available
                }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async assignSlot(body, executive) {
        try {
            let supervisor = await db.select('supervisor_executive_relation', 'supervisor_id', `executive_id = ${executive.executive_id}`)
            let top_supervisor = await db.select('topsupervisor_supervisor_relation', 'top_supervisor_id', `supervisor_id = ${supervisor[0].supervisor_id}`)
            let interior_wash_data = {
                // vehicle_id: body.vehicle_id,
                // customer_id: body.user_id,
                // building_id: body.building_id,
                executive_id: executive.executive_id,
                supervisor_id: supervisor[0].supervisor_id,
                top_supervisor_id: top_supervisor[0].top_supervisor_id,
                // is_car: 1,
                // wash_type: 2,
                executive_type: 1,   // Regular Executive
                // is_completed: 0,
                vehicle_wash_date: body.vehicle_wash_date,
                // created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp(),
                interior_time_slot: body.interior_time_slot
            },
                where = ` vehicle_wash_id = ${body.vehicle_wash_id}`
            console.log("interior_wash_data >>>>", interior_wash_data)
            let vehicle_wash = await db.update('vehicle_wash_active_week', where, interior_wash_data)
            let executive_interior_slot_relation_data = {
                is_available: 0,
                vehicle_wash_id: body.vehicle_wash_id,
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            where = ` executive_id = ${executive.executive_id} AND date = '${body.vehicle_wash_date}' AND slot_time = '${body.interior_time_slot}'`
            db.update('executive_interior_slot_relation', where, executive_interior_slot_relation_data)
        } catch (error) {
            return promise.reject(error)
        }
    }
    async cancelInteriorWash(body) {
        try {
            let data = {
                is_available: 1,
                vehicle_wash_id: null,
                modified_date: dateHelper.getCurrentTimeStamp()
            },
                where = ` vehicle_wash_id = ${body.vehicle_wash_id}`
            await db.update('executive_interior_slot_relation', where, data)
            data = {
                executive_id: null,
                supervisor_id: null,
                executive_type: null,
                modified_date: dateHelper.getCurrentTimeStamp(),
                top_supervisor_id: null,
                interior_time_slot: null
            }
            await db.update('vehicle_wash_active_week', where, data)
            return true
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleWashHistoryList(body, language) {
        try {
            let condition = ''
            if ('vehicle_wash_date' in body && body.vehicle_wash_date != '') {
                condition = ` AND aw.vehicle_wash_date = '${body.vehicle_wash_date}'`
            }
            let selectParams = `aw.vehicle_wash_id,aw.executive_id,aw.supervisor_id,aw.top_supervisor_id,aw.vehicle_id,aw.is_car,
            to_char(aw.vehicle_wash_date,'dd Mon, YYYY') as vehicle_wash_date,to_char(aw.interior_time_slot, 'HH12:MI AM') as interior_time_slot,aw.start_time,aw.end_time,aw.vehicle_wash_review_id,vwr.ratings,DATE_PART('hour', aw.end_time - aw.start_time) * 60 + DATE_PART('minute', aw.end_time - aw.start_time) as time_taken,
            CASE aw.is_car
            WHEN 1 THEN cb.brand_name_lang->>'${language}'
            ELSE bb.brand_name_lang->>'${language}'
            END brand_name, 
            CASE aw.is_car
            WHEN 1 THEN cm.model_name_lang->>'${language}'
            ELSE bm.model_name_lang->>'${language}'
            END model_name,
            aw.wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name_lang->>'${language}' AS color_name,cvr.vehicle_image,
            ticket_id,vt.type_name_lang->>'${language}' AS type_name`,
                where = ` aw.customer_id = ${body.user_id} AND aw.is_completed = 1 AND cvr.is_deleted = 0` + condition + ` ORDER BY aw.vehicle_wash_date DESC, aw.start_time DESC `,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                         LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                         LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color
                         LEFT JOIN vehicle_wash_review vwr ON vwr.vehicle_wash_review_id = aw.vehicle_wash_review_id ` ;
            let pagination = ''
            if ('vehicle_wash_id' in body) {
                where = ` aw.customer_id = ${body.user_id} AND aw.is_completed = 1 AND aw.vehicle_wash_id = ${body.vehicle_wash_id}`
            } else {
                pagination = ` LIMIT ${Number(config.paginationCount)} OFFSET ${Number(config.paginationCount) * (Number(body.page_no) - 1)}`
            }
            let userScheduleHistory = await db.select('vehicle_wash_active_week aw' + join, selectParams, where + pagination)
            where = ` aw.customer_id = ${body.user_id} AND aw.is_completed = 1 AND cvr.is_deleted = 0 ` + condition
            if ('page_no' in body) {
                let userScheduleHistoryCount = await db.select('vehicle_wash_active_week aw' + join, `COUNT(*)`, where)
                return { userScheduleHistory, userScheduleHistoryCount: userScheduleHistoryCount[0].count };
            } else {  // this is used for getUserVehicleWashDetail api(page no not required)
                return { userScheduleHistory };
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleWashDetail(body, language) {
        try {
            let userVehicleWashDetail = await this.getUserVehicleWashHistoryList(body, language);
            let getUserVehicleWashImagePreService = await this.getUserVehicleWashImageByType(body, 1);
            let getUserVehicleWashImagePostService = await this.getUserVehicleWashImageByType(body, 2);
            let getUserVehicleWashPromotionalService = await this.getUserVehicleWashPromotionImage(body);
            return { userVehicleWashDetail: userVehicleWashDetail, userVehicleWashImagePreService: (getUserVehicleWashImagePreService.length > 0) ? getUserVehicleWashImagePreService[0].vehicle_wash_picture_path.split(",") : [], userVehicleWashImagePostService: (getUserVehicleWashImagePostService.length > 0) ? getUserVehicleWashImagePostService[0].vehicle_wash_picture_path.split(",") : [], userVehicleWashPromotionalService: getUserVehicleWashPromotionalService};

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
    async getUserUpcommingWashListExterior(body, language) {
        try {
            let currentSeting = dateHelper.getFormattedDate();
            console.log("currentSeting", currentSeting)
            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name_lang->>'${language}'
                                ELSE bb.brand_name_lang->>'${language}'
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name_lang->>'${language}'
                                ELSE bm.model_name_lang->>'${language}'
                                END model_name  ,
                                wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name_lang->>'${language}' AS color_name, cvr.vehicle_image,ticket_id,vt.type_name_lang->>'${language}' AS type_name`,
                where = ` aw.customer_id = ${body.user_id} AND cvr.is_deleted = 0 AND vehicle_wash_date >= '${currentSeting}' AND aw.wash_type = 0 AND aw.is_completed = 0 ORDER BY vehicle_wash_id LIMIT 1`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                         LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model
                         LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type  
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  `

            let usersVehicleWashList = await db.select('vehicle_wash_active_week aw' + join, selectParams, where)
            return usersVehicleWashList
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserUpcommingWashListInterior(body, language) {
        try {
            let currentSeting = dateHelper.getFormattedDate();
            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name_lang->>'${language}'
                                ELSE bb.brand_name_lang->>'${language}'
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name_lang->>'${language}'
                                ELSE bm.model_name_lang->>'${language}'
                                END model_name  ,
                                wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name_lang->>'${language}' AS color_name,cvr.vehicle_image,ticket_id,vt.type_name_lang->>'${language}' AS type_name`,
                where = ` aw.customer_id = ${body.user_id} AND cvr.is_deleted = 0 AND vehicle_wash_date >= '${currentSeting}' AND aw.wash_type = 1 AND aw.is_completed = 0 ORDER BY vehicle_wash_id LIMIT 1`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                         LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                         LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type 
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  `

            let usersVehicleWashList = await db.select('vehicle_wash_active_week aw' + join, selectParams, where)
            return usersVehicleWashList
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserPreviousWashListExterior(body, language) {
        try {
            let currentSeting = dateHelper.getFormattedDate();
            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name_lang->>'${language}'
                                ELSE bb.brand_name_lang->>'${language}'
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name_lang->>'${language}'
                                ELSE bm.model_name_lang->>'${language}'
                                END model_name  ,
                                wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name_lang->>'${language}' AS color_name,cvr.vehicle_image,ticket_id,vt.type_name_lang->>'${language}' AS type_name`,
                where = ` aw.customer_id = ${body.user_id} AND cvr.is_deleted = 0 AND vehicle_wash_date <= '${currentSeting}' AND aw.wash_type = 0 AND aw.is_completed = 1 ORDER BY vehicle_wash_id DESC LIMIT 1`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                         LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                         LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type 
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  `

            let usersVehicleWashList = await db.select('vehicle_wash_active_week aw' + join, selectParams, where)
            return usersVehicleWashList
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserPreviousWashListInterior(body, language) {
        try {
            let currentSeting = dateHelper.getFormattedDate();
            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name_lang->>'${language}'
                                ELSE bb.brand_name_lang->>'${language}'
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name_lang->>'${language}'
                                ELSE bm.model_name_lang->>'${language}'
                                END model_name  ,
                                wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name_lang->>'${language}' AS color_name,cvr.vehicle_image,ticket_id,vt.type_name_lang->>'${language}' AS type_name`,
                where = ` aw.customer_id = ${body.user_id} AND cvr.is_deleted = 0 AND vehicle_wash_date <= '${currentSeting}' AND aw.wash_type = 1 AND aw.is_completed = 1 ORDER BY vehicle_wash_id DESC LIMIT 1`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                         LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                         LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type 
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  `

            let usersVehicleWashList = await db.select('vehicle_wash_active_week aw' + join, selectParams, where)
            return usersVehicleWashList
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getUserSummary(body, language) {
        try {
            let user_id = body.user_id
            let getUserLocation = await this.getUserLocation(body)
            let getUserVehicleList = await this.getUserVehicleList(body, language)
            let total_promotional_price = 0, total_original_price = 0, subscription_start_date
            const userSummary = async () => {
                for (let i = 0; i < getUserVehicleList.length; i++) {
                    let body = {
                        user_id: user_id,
                        vehicle_id: getUserVehicleList[i].vehicle_relation_id,
                        type_id: getUserVehicleList[i].vehicle_type
                    }
                    getUserVehicleList[i].userVehiclePlan = await this.getUserVehiclePlan(body,0,language)
                    getUserVehicleList[i].userVehicleDuration = await this.getUserVehicleDuration(body,0,language)
                    body.customer_subscription_id = getUserVehicleList[i].userVehicleDuration.customer_subscription_relation_id
                    getUserVehicleList[i].userVehiclePromotion = await this.getUserVehiclePromotion(body,language)
                    body.subscription_plan_id = getUserVehicleList[i].userVehiclePlan.subscription_plan_id
                    body.subscription_plan_duration_id = getUserVehicleList[i].userVehicleDuration.subscription_plan_duration_id
                    getUserVehicleList[i].subscription_price = await this.getSubscriptionPrice(body)
                    total_promotional_price = total_promotional_price + getUserVehicleList[i].subscription_price[0].promotional_price
                    total_original_price = total_original_price + getUserVehicleList[i].subscription_price[0].original_price
                    subscription_start_date = getUserVehicleList[i].userVehicleDuration.subscription_start_date_by_customer
                }
            }
            await userSummary();
            return { userLocation: getUserLocation, userVehicleList: getUserVehicleList, total_promotional_price: total_promotional_price, total_original_price: total_original_price, subscription_start_date: subscription_start_date }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserLocation(body) {
        try {
            let selectParams = `c.location,c.latitude,c.longitude,c.building_id,b.building_name`,
                joins = ` LEFT JOIN building b ON b.building_id = c.building_id`,
                where = ` c.customer_id = ${body.user_id} `
            let userDetail = await db.select('customer c' + joins, selectParams, where)
            return userDetail
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehiclePlan(body, flag, language) {
        try {
            let vehicle_id = body.vehicle_id
            let selectParams = `customer_subscription_relation_id,customer_subscription_relation.subscription_plan_id, 
            subscription_plan_lang->>'${language}' AS subscription_plan, subscription_details_lang->>'${language}' AS subscription_details, interior_wash_details_lang->>'${language}' AS interior_wash_details`,
                where = ` vehicle_id = ${vehicle_id} AND has_paid = 0`,
                join = ` LEFT JOIN mst_subscription_plan ON mst_subscription_plan.subscription_plan_id = customer_subscription_relation.subscription_plan_id`
            if (flag == 1) {
                where = ` vehicle_id = ${vehicle_id} AND has_paid = 1 AND customer_subscription_relation.is_active = 1 AND status = 1`
            }
            let userSubscriptionPlan = await db.select('customer_subscription_relation' + join, selectParams, where)
            return userSubscriptionPlan[0]
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleDuration(body, flag, language) {
        try {
            let selectParams = `customer_subscription_relation.subscription_plan_duration_id,duration_title_lang->>'${language}' AS duration_title,duration_month,customer_subscription_relation_id,to_char(subscription_start_date_by_customer,'dd Mon, YYYY') as subscription_start_date_by_customer,to_char(subscription_start_date,'dd Mon, YYYY') as subscription_start_date,to_char(subscription_end_date,'dd Mon, YYYY') as subscription_end_date`,
                where = ` vehicle_id = ${body.vehicle_id} AND customer_subscription_relation.customer_id = ${body.user_id} AND has_paid = 0`,
                join = ` LEFT JOIN mst_subscription_plan_duration ON mst_subscription_plan_duration.subscription_plan_duration_id = customer_subscription_relation.subscription_plan_duration_id`
            if (flag == 1) {
                where = ` vehicle_id = ${body.vehicle_id} AND has_paid = 1 AND customer_subscription_relation.is_active = 1 AND status = 1`
            }
            let userDuration = await db.select('customer_subscription_relation' + join, selectParams, where)
            return userDuration[0]
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehiclePromotion(body, language) {
        try {
            let selectParams = `promotional_text_lang->>'${language}' AS promotional_text`,
                where = ` customer_subscription_id = ${body.customer_subscription_id} `,
                join = ` LEFT JOIN mst_promotional ON mst_promotional.promotional_id = customer_promotional_relation.promotional_id  `
            let userPromotion = await db.select('customer_promotional_relation' + join, selectParams, where)
            return userPromotion
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleList(body, language) {
        try {
            let selectParams = `cvr.vehicle_relation_id,color_name_lang->>'${language}' AS color_name,color_id,cvr.is_car,
                                CASE cvr.is_car
                                WHEN 1 THEN cb.brand_name_lang->>'${language}'
                                ELSE bb.brand_name_lang->>'${language}'
                                END brand_name,
                                CASE cvr.is_car
                                WHEN 1 THEN cb.brand_id
                                ELSE bb.brand_id
                                END brand_id,
                                CASE cvr.is_car
                                WHEN 1 THEN cm.model_name_lang->>'${language}'
                                ELSE bm.model_name_lang->>'${language}'
                                END model_name  ,
                                CASE cvr.is_car
                                WHEN 1 THEN cm.model_id
                                ELSE bm.model_id
                                END model_id,
                                cvr.vehicle_number,cvr.vehicle_image,cvr.vehicle_type,vt.type_name_lang->>'${language}' AS type_name`,
                // where = ` cvr.vehicle_relation_id IN (${body.vehicle_id}) ORDER BY cvr.vehicle_relation_id`,
                where = ` cvr.customer_id IN (${body.user_id}) AND cvr.is_deleted = 0 AND csr.customer_subscription_relation_id is NOT NULL AND csr.is_active = 1 AND csr.status = 1 AND csr.has_paid = 0 ORDER BY cvr.vehicle_relation_id `,
                join = ` LEFT JOIN car_brand cb ON cb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.model_id = cvr.vehicle_model  
                         LEFT JOIN bike_brand bb ON bb.brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.model_id = cvr.vehicle_model 
                         LEFT JOIN vehicle_type vt ON vt.type_id = cvr.vehicle_type  
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color 
                         LEFT JOIN customer_subscription_relation csr ON csr.vehicle_id = cvr.vehicle_relation_id `
            let userDetail = await db.select('customer_vehicle_relation cvr' + join, selectParams, where)
            return userDetail
        } catch (error) {
            return promise.reject(error)
        }
    } 
    /**
     * 
     * @param {*} body 
     */
    
    async getSubscriptionPrice(body) {
        try {
            let selectParams = `original_price, promotional_price`,
                where = `subscription_plan_id = ${body.subscription_plan_id} AND subscription_duration_id = ${body.subscription_plan_duration_id} AND type_id = ${body.type_id}`
            let subscriptionPrice = await db.select('subscription_promotional_relation', selectParams, where)
            return subscriptionPrice
        } catch (error) {
            return promise.reject(error)
        }
    }

    async setActiveCarsListWeekly(body) {
        try { 
            let currentDate = dateHelper.getFormattedDate(),
                currentSeting = dateHelper.getCurrentTimeStamp()
            let day = [1,2,3,4,5,6]; // 1: monday 7: Sunday
        
            let selectParams = ` MAX(b.building_id) building_id`,
                where = ` b.is_active = 1 AND cs.subscription_start_date <= '${currentDate}' AND cs.subscription_end_date >= '${currentDate}' AND cs.has_paid = 1 GROUP BY cs.building_id`,
                join = ` JOIN customer_subscription_relation cs ON cs.building_id = b.building_id `

            let buildingList = await db.select('building b' + join , selectParams, where )
            let onceWeekLastValue= 0
            if(buildingList.length >0){
            let getQuestionList = async _ => {
                    for(let cnt=0;cnt<buildingList.length;cnt++) {
                        let vehicleWashList = await this.getVehicleWashByBuildingId(buildingList[cnt].building_id);
                        console.log("vehicleWashList",vehicleWashList)
                        let everyDayInsertValues = [],thriceWeekInsertValues = [],onceWeekInsertValues =[]
                        for(let daycnt=0;daycnt<day.length;daycnt++ ){
                            if(vehicleWashList[0].everyday!=0) {
                              everyDayInsertValues.push(`(${vehicleWashList[0].everyday},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                            }
                            if(vehicleWashList[0].thriceweek!=0){
                                let thriceWeekExtend = Math.ceil(vehicleWashList[0].thriceweek / 2);                                
                                if(day[daycnt]%2 == 1){
                                 thriceWeekInsertValues.push(`(${thriceWeekExtend},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                } else {
                                    if(vehicleWashList[0].thriceweek % 2 == 1){
                                     thriceWeekInsertValues.push(`(${thriceWeekExtend - 1},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                    } else {
                                        thriceWeekInsertValues.push(`(${thriceWeekExtend},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                    }
                                }
                            }
                            if(vehicleWashList[0].onceweek!=0){
                                let onceWeekExtend = Math.floor(vehicleWashList[0].onceweek / 6);  
                                let onceWeekExtendRemainder = (vehicleWashList[0].onceweek % 6);  
                                if(daycnt==0){
                                    onceWeekLastValue = onceWeekExtendRemainder
                                }
                                console.log(" =============== \n \n onceWeekLastValue",onceWeekLastValue)
                                console.log("day[daycnt]",day[daycnt])
                                
                                if(onceWeekExtendRemainder == 0){
                                    onceWeekInsertValues.push(`(${onceWeekExtend},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                } else {
                                   if(onceWeekExtendRemainder <= 3) {
                                       if(day[daycnt]%2==0 && onceWeekLastValue>0) {
                                        onceWeekInsertValues.push(`(${onceWeekExtend + 1},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                        onceWeekLastValue--;
                                       } else {
                                        onceWeekInsertValues.push(`(${onceWeekExtend},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);                                           
                                       }
                                   }  else {
                                     if(day[daycnt]%2==0 && onceWeekLastValue>0) {    
                                        console.log("onceWeekExtend =====> even",onceWeekExtend + 1)

                                        onceWeekInsertValues.push(`(${onceWeekExtend + 1},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                        onceWeekLastValue--;
                                       } 
                                    // else if(day[daycnt]%2==0) {  
                                    //        if((day[daycnt] - onceWeekExtendRemainder)>0){
                                    //         //onceWeekInsertValues.push(`(${onceWeekExtend + 1},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                    //         onceWeekLastValue--;
                                    //        } else {
                                    //            onceWeekInsertValues.push(`(${onceWeekExtend},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                    //        }

                                    //    }
                                    else {
                                           if(onceWeekLastValue!=1 && onceWeekLastValue > 0){
                                               if(day[daycnt]<=onceWeekLastValue){
                                            console.log("onceWeekExtend ===> odd",onceWeekExtend + 1)
                                            console.log("onceWeekLastValue",onceWeekLastValue)                                            
                                             onceWeekInsertValues.push(`(${onceWeekExtend + 1},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`); 
                                             onceWeekLastValue--;     
                                               } else {
                                                onceWeekInsertValues.push(`(${onceWeekExtend},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`); 

                                               }                                       
                                           }
                                           else if(onceWeekLastValue==1){
                                             onceWeekInsertValues.push(`(${onceWeekExtend},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`); 
                                           }
                                            else if(onceWeekLastValue<=0) {
                                                console.log("onceWeekExtend ===>",onceWeekExtend)
                                            onceWeekInsertValues.push(`(${onceWeekExtend},${day[daycnt]},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`); 
                                           }                                          
                                       }

                                   }
                                   console.log("===================== \n\n \n \n")
                                   
                                } 

                            }
                               
                        }
                        if(everyDayInsertValues.length >0){
                         db.bulkinsert('vehicle_list_algorithm','(everyday,day,building_id,created_date,modified_date)' , everyDayInsertValues.join(','),'day,building_id','everyday = EXCLUDED.everyday')
                        } else {
                              let data = {
                                everyday : 0
                             },
                             where = `building_id =  ` + buildingList[cnt].building_id
                             db.update('vehicle_list_algorithm',where,data)
                        }
                        if(thriceWeekInsertValues.length>0){
                         db.bulkinsert('vehicle_list_algorithm','(thrice_week,day,building_id,created_date,modified_date)',thriceWeekInsertValues.join(','),'day,building_id', 'thrice_week = EXCLUDED.thrice_week')
                        } else {
                            let data = {
                                thrice_week : 0
                             },
                             where = `building_id =  ` + buildingList[cnt].building_id
                             db.update('vehicle_list_algorithm',where,data)
                        } 
                        if(onceWeekInsertValues.length>0){
                         db.bulkinsert('vehicle_list_algorithm','(once_week,day,building_id,created_date,modified_date)', onceWeekInsertValues.join(','),'day,building_id', 'once_week = EXCLUDED.once_week')
                        } else {
                            let data = {
                                once_week : 0
                             },
                             where = `building_id =  ` + buildingList[cnt].building_id
                             db.update('vehicle_list_algorithm',where,data)
                            
                        }
                    }
                }           
            await getQuestionList();
        }
            
        } catch (error) {
            return promise.reject(error)
        }
    }

    async setActiveJobsListWeekly(body) {
        try { 
            let currentDate = dateHelper.getFormattedDate(),
                currentSeting = dateHelper.getCurrentTimeStamp()
            let day = [1,2,3,4,5,6]; // 1: monday 7: Sunday
        
            let selectParams = ` MAX(b.building_id) building_id`,
                where = ` b.is_active = 1 AND cs.subscription_start_date <= '${currentDate}' AND cs.subscription_end_date >= '${currentDate}' AND cs.has_paid = 1 AND status=1 GROUP BY cs.building_id`,
                join = ` JOIN customer_subscription_relation cs ON cs.building_id = b.building_id `

            let buildingList = await db.select('building b' + join , selectParams, where )
            let onceWeekLastValue= 0
            if(buildingList.length >0){
            let getQuestionList = async _ => {
                    for(let cnt=0;cnt<buildingList.length;cnt++) {
                        let vehicleWashList = await this.getVehicleWashByBuildingId(buildingList[cnt].building_id);
                        console.log("vehicleWashList",vehicleWashList)
                        let everyDayInsertValues = [],thriceWeekInsertValues = [],onceWeekInsertValues =[]                         
                        // let getEverydayList = async _ => { 
                        //     let getJobsListByBuildingId = this.getJobsListByBuildingId(buildingList[cnt].building_id,1)
                            
                        // }
                        // await getEverydayList()

                      
                         if(vehicleWashList[0].everyday!=0) {
                            everyDayInsertValues.push(`(${vehicleWashList[0].everyday},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                          }
                         if(vehicleWashList[0].thriceweek!=0){
                                let thriceWeekExtend = Math.ceil(vehicleWashList[0].thriceweek / 2);                                
                               thriceWeekInsertValues.push(`(${thriceWeekExtend - 1},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                    
                                
                            }
                            if(vehicleWashList[0].onceweek!=0){
                                let onceWeekExtend = Math.floor(vehicleWashList[0].onceweek / 6);  
                                let onceWeekExtendRemainder = (vehicleWashList[0].onceweek % 6);  
                               
                                console.log(" =============== \n \n onceWeekLastValue",onceWeekLastValue)
                                
                                    onceWeekInsertValues.push(`(${onceWeekExtend},${buildingList[cnt].building_id},${currentSeting},${currentSeting})`);
                                } 

                            

                               
                       
                        if(everyDayInsertValues.length >0){
                       //  db.bulkinsert('vehicle_list_algorithm','(everyday,day,building_id,created_date,modified_date)' , everyDayInsertValues.join(','),'day,building_id','everyday = EXCLUDED.everyday')
                        } else {
                              let data = {
                                everyday : 0
                             },
                             where = `building_id =  ` + buildingList[cnt].building_id
                             db.update('vehicle_list_algorithm',where,data)
                        }
                        if(thriceWeekInsertValues.length>0){
                      //   db.bulkinsert('vehicle_list_algorithm','(thrice_week,day,building_id,created_date,modified_date)',thriceWeekInsertValues.join(','),'day,building_id', 'thrice_week = EXCLUDED.thrice_week')
                        } else {
                            let data = {
                                thrice_week : 0
                             },
                             where = `building_id =  ` + buildingList[cnt].building_id
                             db.update('vehicle_list_algorithm',where,data)
                        } 
                        if(onceWeekInsertValues.length>0){
                       //  db.bulkinsert('vehicle_list_algorithm','(once_week,day,building_id,created_date,modified_date)', onceWeekInsertValues.join(','),'day,building_id', 'once_week = EXCLUDED.once_week')
                        } else {
                            let data = {
                                once_week : 0
                             },
                             where = `building_id =  ` + buildingList[cnt].building_id
                         //    db.update('vehicle_list_algorithm',where,data)
                            
                        }
                    }
                }           
            await getQuestionList();
        }
            
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getJobsListByBuildingId(buildingId,user_vehicle_wash_type){
        // user_vehicle_wash_type 
        let currentDate = dateHelper.getFormattedDate();

        let selectParams = ` MIN(cs.vehicle_id) vehicle_id ,MIN(cs.customer_id) customer_id,MIN(cs.is_car) is_car, array_to_string(array_agg(executive_id), ',') block_list `,
               join = ` LEFT JOIN executive_customer_block_relation ec ON ec.vehicle_id = cs.vehicle_id 
                        LEFT  JOIN executive_customer_block_relation ec ON ec.vehicle_id = cs.vehicle_id `
                where = `  cs.building_id = ${buildingId} AND has_paid = 1 AND status = 1 AND subscription_id IS NOT NULL GROUP BY ec.vehicle_id`
        let userVehicleList = await db.select('customer_subscription_relation cs' , selectParams, where )
        return userVehicleList;
    }
    async getVehicleWashByBuildingId(buildingId){
        let currentDate = dateHelper.getFormattedDate();

        // let selectParams = ` COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 1),0 ) as everyDay, 
        //                      COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 2),0 ) as thriceWeek, 
        //                      COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 3),0 )  as onceWeek `,
        let selectParams = ` 30 as everyDay, 
                              5 as thriceWeek, 
                              46 as onceWeek `,
        
                where = ` cs.subscription_start_date <= '${currentDate}' AND cs.subscription_end_date >= '${currentDate}' AND cs.has_paid = 1 AND status = 1 AND cs.building_id = ${buildingId}`
        let userVehicleList = await db.select('customer_subscription_relation cs' , selectParams, where )
        return userVehicleList;

    }  

    async backup(){
        try {
        let currentDate = dateHelper.getFormattedDate(),
                currentSeting = dateHelper.getCurrentTimeStamp()
            let day = [1,2,3,4,5,6]; // 1: monday 7: Sunday
        
            let selectParams = ` b.building_id `,
                where = ` subscription_count >0  ORDER BY ranking DESC `
            let buildingList = await db.select('building_vehicle_weekly_relation b' , selectParams, where )
            let executiveList = [{'executive_id':0,'no_of_jobs':0}]
            if(buildingList.length >0){
            let getQuestionList = async _ => {
                    for(let cnt=0;cnt<buildingList.length;cnt++) { 
                        let selectParams = ` no_of_jobs,executive_id,everyday,thrice_week,once_week `,
                            where = ` executive_building_relation.building_id = ${buildingList[cnt].building_id} AND service_provider.is_active = 1  ORDER BY distance DESC,has_vehicle ASC `,
                            join = ` LEFT JOIN service_provider ON service_provider.service_provider_id = executive_building_relation.executive_id
                                      LEFT JOIN vehicle_list_algorithm ON vehicle_list_algorithm.building_id = executive_building_relation.building_id   `
                         let activeExecutiveList = await db.select('executive_building_relation ' + join , selectParams, where )
                         let getQuestionList = async _ => {
                            for(let ecnt=0;ecnt<activeExecutiveList.length;ecnt++) { 
                                let executiveDailyJobLimit = activeExecutiveList[ecnt].no_of_jobs 
                              if(executiveDailyJobLimit >= activeExecutiveList[ecnt].everyday){

                              } 
                            }
                        }           
                    await getQuestionList();
                    }
                }           
            await getQuestionList();
        }
            
        } catch (error) {
            return promise.reject(error)
        }
    }

    async scheduleExecutiveToUserVehicleRelation(body,forHRReport) {
        try { 
            let currentDate = dateHelper.getFormattedDate(),
                currentSeting = dateHelper.getCurrentTimeStamp()
            let day = [1,2,3,4,5,6]; // 1: monday 7: Sunday
        /*  Uncomment below two API if you need to fetch the latest Building and the Vechilie list
            and make sure you delete the building_vehicle_weekly_relation and complex_subscription_relation table records
            The below loop fetchs the complex and then finds the Building in it.
            It fetches the Executive in getExecutiveListByBuildingId.
        */
            await this.setLatestBuildingCustomerDetail()
            await this.setLatestComplexCustomerDetail()
           let selectParams = ` cs.complex_building_id,min(cs.is_complex) is_complex`,
                where = ` total_subs >0 GROUP BY complex_building_id,ranking  ORDER BY ranking DESC `
            let complexList = await db.select('complex_subscription_relation cs' , selectParams, where )
            //console.log("================================ complexList",complexList)
             
            if(complexList.length >0){
            let getQuestionList = async _ => {
                    for(let cnt=0;cnt<complexList.length;cnt++) { 
                        let selectParams = `building_id,everyday_vehicle everyday,thrice_a_week_vehicle thriceweek,once_a_week_vehicle onceweek,everyday_job_list,thriceweek_job_list,onceweek_job_list,subscription_count `
                            where = ` b.building_id = ${complexList[cnt].complex_building_id} LIMIT 1`
                            if(complexList[cnt].is_complex == 1){
                                where = ` complex_id = ${complexList[cnt].complex_building_id} `
                            }                                        
                        let buildingList = await db.select('building_vehicle_weekly_relation b' , selectParams, where )
                        if(buildingList.length>0){ 
                       
                        //console.log(" \n \n \n \n ============== buildingList \n \n ",buildingList)
                        let buildingId = buildingList.map(item => item.building_id)
                        let userSubscriptionCount =  buildingList.reduce(function(prev, cur) {
                                                        return prev + cur.subscription_count;
                                                    }, 0);
                        //console.log("==========buildingId",buildingId)
                        let getExecutiveListByBuildingId = await this.getExecutiveListByBuildingId(buildingId.join(','),Math.round(userSubscriptionCount/30) + 1 )
                        
                        //console.log(" \n \n \n \n ======================= getExecutiveListByBuildingId",getExecutiveListByBuildingId)


                       // console.log(" \n \n \n \n getExecutiveListByBuildingId",getExecutiveListByBuildingId)

                        //console.log(" \n \n \n \n  ==========================  buildingList.length",buildingList.length)

                        let buildingDetailList = [{"everydayTotalJob":0,"thriceweekTotalJob":0,"onceweekTotalJob":0,"complexId":0,"building_list":[]}]
                       /* 
                        All building belong to complex and we populate all building in building_list key with all building details                       
                       */
                       let getBuildingList = async _ => {
                        for(let bcnt=0;bcnt<buildingList.length;bcnt++){
                            //console.log(" \n \n \n \n ======================= getExecutiveListByBuildingId",getExecutiveListByBuildingId) 
                            let blockIds = await this.getBuildingBlockExecutiveId(buildingList[bcnt].building_id)
                            buildingList[bcnt].everyday_job_list = buildingList[bcnt].everyday_job_list.map(item => {
                                if(item.block_list!='') {
                                  item.block_list = item.block_list + "," + blockIds
                                } else {
                                    item.block_list =  blockIds
                                }
                                return item

                            }) 
                            buildingList[bcnt].thriceweek_job_list = buildingList[bcnt].thriceweek_job_list.map(item => {
                                if(item.block_list!='') {
                                  item.block_list = item.block_list + "," + blockIds
                                } else {
                                    item.block_list =  blockIds
                                }
                                return item

                            })
                            buildingList[bcnt].onceweek_job_list = buildingList[bcnt].onceweek_job_list.map(item => {
                                if(item.block_list!='') {
                                  item.block_list = item.block_list + "," + blockIds
                                } else {
                                    item.block_list =  blockIds
                                }
                                return item

                            }) 
                            buildingDetailList[0].everydayTotalJob +=   buildingList[bcnt].everyday_job_list.length >0 ? buildingList[bcnt].everyday_job_list.length : 0
                            buildingDetailList[0].thriceweekTotalJob +=   buildingList[bcnt].thriceweek_job_list.length >0 ? Math.ceil(buildingList[bcnt].thriceweek_job_list.length / 2) : 0
                            buildingDetailList[0].onceweekTotalJob +=   buildingList[bcnt].onceweek_job_list.length >0 ? Math.ceil(buildingList[bcnt].onceweek_job_list.length/6) : 0
                           // let thriceweekJobList = buildingList[bcnt].thriceweek_job_list.length > 0 ? buildingList[bcnt].thriceweek_job_list : []
                          //  let onceweekJobList = buildingList[bcnt].onceweek_job_list.length > 0 ? buildingList[bcnt].onceweek_job_list : []
                            buildingList[bcnt].everydayVehicleId = buildingList[bcnt].everyday_job_list.length > 0 ? buildingList[bcnt].everyday_job_list :[] 
                            buildingList[bcnt].thriceWeekVehicleId = buildingList[bcnt].thriceweek_job_list.length > 0 ? buildingList[bcnt].thriceweek_job_list : []
                            buildingList[bcnt].onceWeekVehicleId = buildingList[bcnt].onceweek_job_list.length >0 ? buildingList[bcnt].onceweek_job_list : []
                            buildingDetailList[0].complexId = complexList[cnt].complex_building_id 
                            console.log("buildingDetailList[0].building_list",buildingDetailList[0].building_list)
                            buildingDetailList[0].building_list.push(buildingList[bcnt])
                            delete buildingList[bcnt].everyday_job_list
                            delete buildingList[bcnt].thriceweek_job_list
                            delete buildingList[bcnt].onceweek_job_list
                        }
                    }
                    await getBuildingList();

                    for(let ecnt=0;ecnt<getExecutiveListByBuildingId.length;ecnt++){
                        getExecutiveListByBuildingId[ecnt].actual_jobs = getExecutiveListByBuildingId[ecnt].no_of_jobs
                        getExecutiveListByBuildingId[ecnt].everydayassignedJobList = []
                        getExecutiveListByBuildingId[ecnt].thriceWeekassignedJobList = []
                        getExecutiveListByBuildingId[ecnt].onceWeekAssignedJobList = []
                        //getExecutiveListByBuildingId[ecnt].supervisor_id = 1
                        //getExecutiveListByBuildingId[ecnt].top_supervisor_id = 1
                     } 

                     /* 
                      When forHRReport = 1 we check if there is enough executive. If not then, we add temp executives ,so that algorithm will run and at end we will know how many jobs are 
                      to be done by the temp executive. And HR will recruit them
                     */

                    let getExecutiveListForHRReport = async _ => {
                     for(let ecnt=getExecutiveListByBuildingId.length;ecnt<(Math.round(userSubscriptionCount/30) + 1);ecnt++){
                        getExecutiveListByBuildingId.push({"executive_id":"TEMP_"+ecnt+"_"+dateHelper.getCurrentTimeStamp(),"no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1})
                     }
                 }
                 if(forHRReport==1){
                  await getExecutiveListForHRReport();
                 }

                // console.log("getExecutiveListByBuildingId",getExecutiveListByBuildingId) 
                
                
                console.log("getExecutiveListByBuildingId",getExecutiveListByBuildingId)

                




                        //console.log(" ============== cnt ",cnt)

                        //console.log(" \n \n \n \n ============== buildingList \n \n ",buildingList)
                      //  console.log(" \n \n \n \n ============== buildingList \n \n ",buildingList)
                        

                    //  console.log("\n \n ================================ buildingList",buildingDetailList)

                    console.log("====================== buildingList",JSON.stringify(buildingDetailList)) 
                    
                      
                      
                      
                      
                      

                     //    buildingList = [{"everydayTotalJob":35,"thriceweekTotalJob":15,"onceweekTotalJob":10,"complexId":"1","building_list":[{"building_id":1,"everyday":"20","thriceweek":"10","onceweek":"30","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3,4"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":100,"customer_id":1,"is_car":1,"block_list":"2,3,4,5"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":2,"everyday":"15","thriceweek":"20","onceweek":"25","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]},{"everydayTotalJob":30,"thriceweekTotalJob":7,"onceweekTotalJob":4,"complexId":2,"building_list":[{"building_id":3,"everyday":"30","thriceweek":"13","onceweek":"20","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]},{"everydayTotalJob":30,"thriceweekTotalJob":11,"onceweekTotalJob":5,"building_list":[{"building_id":4,"everyday":"5","thriceweek":"15","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":5,"everyday":"25","thriceweek":"7","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3,4,5"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}]

                       // buildingList = [{"everydayTotalJob":35,"thriceweekTotalJob":15,"onceweekTotalJob":10,"complexId":"1","building_list":[{"building_id":1,"everyday":"20","thriceweek":"10","onceweek":"30","everydayVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""},{"vehicle_id":16,"block_list":""},{"vehicle_id":17,"block_list":""},{"vehicle_id":18,"block_list":""},{"vehicle_id":19,"block_list":""},{"vehicle_id":20,"block_list":""},],"thriceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":"1,2,3"},{"vehicle_id":3,"block_list":"1,2,3"},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""},{"vehicle_id":16,"block_list":""},{"vehicle_id":17,"block_list":""},{"vehicle_id":18,"block_list":""},{"vehicle_id":19,"block_list":""},{"vehicle_id":20,"block_list":""},{"vehicle_id":21,"block_list":""},{"vehicle_id":22,"block_list":""},{"vehicle_id":23,"block_list":""},{"vehicle_id":24,"block_list":""},{"vehicle_id":25,"block_list":""},{"vehicle_id":26,"block_list":""},{"vehicle_id":27,"block_list":""},{"vehicle_id":28,"block_list":""},{"vehicle_id":29,"block_list":""},{"vehicle_id":30,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":2,"everyday":"15","thriceweek":"20","onceweek":"25","everydayVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""},{"vehicle_id":16,"block_list":""},{"vehicle_id":17,"block_list":""},{"vehicle_id":18,"block_list":""},{"vehicle_id":19,"block_list":""},{"vehicle_id":20,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""},{"vehicle_id":16,"block_list":""},{"vehicle_id":17,"block_list":""},{"vehicle_id":18,"block_list":""},{"vehicle_id":19,"block_list":""},{"vehicle_id":20,"block_list":""},{"vehicle_id":21,"block_list":""},{"vehicle_id":22,"block_list":""},{"vehicle_id":23,"block_list":""},{"vehicle_id":24,"block_list":""},{"vehicle_id":25,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]},{"everydayTotalJob":30,"thriceweekTotalJob":7,"onceweekTotalJob":4,"building_list":[{"building_id":3,"everyday":"30","thriceweek":"13","onceweek":"20","everydayVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""},{"vehicle_id":16,"block_list":""},{"vehicle_id":17,"block_list":""},{"vehicle_id":18,"block_list":""},{"vehicle_id":19,"block_list":""},{"vehicle_id":20,"block_list":""},{"vehicle_id":21,"block_list":""},{"vehicle_id":22,"block_list":""},{"vehicle_id":23,"block_list":""},{"vehicle_id":24,"block_list":""},{"vehicle_id":25,"block_list":""},{"vehicle_id":26,"block_list":""},{"vehicle_id":27,"block_list":""},{"vehicle_id":28,"block_list":""},{"vehicle_id":29,"block_list":""},{"vehicle_id":30,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":"1,2,3"},{"vehicle_id":3,"block_list":"1,2,3"},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""},{"vehicle_id":16,"block_list":""},{"vehicle_id":17,"block_list":""},{"vehicle_id":18,"block_list":""},{"vehicle_id":19,"block_list":""},{"vehicle_id":20,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]},{"everydayTotalJob":30,"thriceweekTotalJob":11,"onceweekTotalJob":5,"building_list":[{"building_id":4,"everyday":"5","thriceweek":"15","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""},{"vehicle_id":16,"block_list":""},{"vehicle_id":17,"block_list":""},{"vehicle_id":18,"block_list":""},{"vehicle_id":19,"block_list":""},{"vehicle_id":20,"block_list":""},{"vehicle_id":21,"block_list":""},{"vehicle_id":22,"block_list":""},{"vehicle_id":23,"block_list":""},{"vehicle_id":24,"block_list":""},{"vehicle_id":25,"block_list":""},{"vehicle_id":26,"block_list":""},{"vehicle_id":27,"block_list":""},{"vehicle_id":28,"block_list":""},{"vehicle_id":29,"block_list":""},{"vehicle_id":30,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":5,"everyday":"25","thriceweek":"7","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""},{"vehicle_id":16,"block_list":""},{"vehicle_id":17,"block_list":""},{"vehicle_id":18,"block_list":""},{"vehicle_id":19,"block_list":""},{"vehicle_id":20,"block_list":""},{"vehicle_id":21,"block_list":""},{"vehicle_id":22,"block_list":""},{"vehicle_id":23,"block_list":""},{"vehicle_id":24,"block_list":""},{"vehicle_id":25,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3,4,5"},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}]
                        //buildingList = [{"everydayTotalJob":35,"thriceweekTotalJob":15,"onceweekTotalJob":10,"complexId":"1","building_list":[{"building_id":1,"everyday":"20","thriceweek":"10","onceweek":"30","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3,4"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":100,"customer_id":1,"is_car":1,"block_list":"2,3,4,5"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":2,"everyday":"15","thriceweek":"20","onceweek":"25","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]},{"everydayTotalJob":30,"thriceweekTotalJob":7,"onceweekTotalJob":4,"complexId":2,"building_list":[{"building_id":3,"everyday":"30","thriceweek":"13","onceweek":"20","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]},{"everydayTotalJob":30,"thriceweekTotalJob":11,"onceweekTotalJob":5,"building_list":[{"building_id":4,"everyday":"5","thriceweek":"15","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":5,"everyday":"25","thriceweek":"7","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3,4,5"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}]
                      //  buildingList = [{"everydayTotalJob":35,"thriceweekTotalJob":15,"onceweekTotalJob":10,"complexId":"1","building_list":[{"building_id":1,"everyday":"20","thriceweek":"10","onceweek":"30","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3,4"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":100,"customer_id":1,"is_car":1,"block_list":"2,3,4,5"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":2,"everyday":"15","thriceweek":"20","onceweek":"25","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]},{"everydayTotalJob":30,"thriceweekTotalJob":7,"onceweekTotalJob":4,"complexId":2,"building_list":[{"building_id":3,"everyday":"30","thriceweek":"13","onceweek":"20","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}]
                        // let executiveList = [[{"executive_id":"1","no_of_jobs":20,"executivePendingJobs":20,"actual_jobs":20,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"2","no_of_jobs":22,"executivePendingJobs":22,"actual_jobs":22,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"3","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"4","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"5","no_of_jobs":20,"executivePendingJobs":20,"actual_jobs":20,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}],
                        //                      [{"executive_id":"6","no_of_jobs":20,"executivePendingJobs":20,"actual_jobs":20,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"7","no_of_jobs":22,"executivePendingJobs":22,"actual_jobs":22,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"8","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"9","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"10","no_of_jobs":20,"executivePendingJobs":20,"actual_jobs":20,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]}],
                        //                      [{"executive_id":"11","no_of_jobs":20,"executivePendingJobs":20,"actual_jobs":20,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"12","no_of_jobs":22,"executivePendingJobs":22,"actual_jobs":22,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"13","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"14","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"15","no_of_jobs":20,"executivePendingJobs":20,"actual_jobs":20,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]}]]

                    //    let executiveList = [[{"executive_id":"1","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"2","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"3","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}]];
                        //console.log(" =====================>buildingList",buildingList.length)
                        let getBusinessList = async _ => {
                              //  for(let cnt=0;cnt<buildingDetailList.length;cnt++) {   
                                    console.log(" =====================> loop",cnt)                                                  
                                    let executiveFreeList = await this.executiveJobsAllocatebyBuilding(buildingDetailList[0],getExecutiveListByBuildingId,forHRReport)  
                                  //  let executiveFreeList = await this.executiveJobsAllocatebyBuilding(buildingList[0],executiveList[0],forHRReport)  
                                   // remove comment from below after check
                                  //  executiveList[cnt+1] = await executiveList[cnt+1].filter((item) => executiveFreeList.indexOf(item.executive_id) == -1 );                                  
                             // }
                
                        }
                        await getBusinessList();                         
                         
                    }
                 }
                }           
            await getQuestionList();
        }
            
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getExecutiveListByBuildingId(buildingId,executiveCount){ 
        try {
            let selectParams = `min(no_of_jobs) no_of_jobs,executive_id,min(no_of_jobs) "executivePendingJobs",min(distance) distance,min(has_vehicle)has_vehicle`,
                where = ` executive_building_relation.building_id IN (${buildingId}) AND executive_building_relation.executive_id NOT IN (SELECT executive_id FROM executive_job_assign_relation) AND executive_building_relation.is_blocked = 0 AND service_provider.is_active=1 AND distance<=10 GROUP BY executive_id  ORDER BY distance ,has_vehicle ASC LIMIT ${executiveCount}  `,
                join = ` LEFT JOIN service_provider ON service_provider.service_provider_id = executive_building_relation.executive_id ` 
            let userDetail = await db.select('executive_building_relation' + join , selectParams, where )
            
            for(let cnt=0;cnt<userDetail.length;cnt++){
                let supervisor = await db.select('supervisor_executive_relation', 'supervisor_id', `executive_id = ${userDetail[cnt].executive_id}`)
                let top_supervisor = await db.select('topsupervisor_supervisor_relation', 'top_supervisor_id', `supervisor_id = ${supervisor[0].supervisor_id}`)
                userDetail[cnt].supervisor_id = supervisor[0].supervisor_id
                userDetail[cnt].top_supervisor_id = top_supervisor[0].top_supervisor_id
            }
            return userDetail
        } catch (error) {
            return promise.reject(error)
        }

    }
    /**
     * This Allocate the Jobs in the building to the Executive.
     * @param {Array} allJobsList  it contains the building list array (single complex)
     * @param {Array} executiveList it contains the Executive list
     * @param {number} forHRReport its flag to identify is it for current week or HR report(next week)
     */
    async executiveJobsAllocatebyBuilding(allJobsList,executiveList,forHRReport) {
        try { 
           // console.log("allJobsList======123",allJobsList)
            let currentDate = dateHelper.getFormattedDate(),
                currentSeting = dateHelper.getCurrentTimeStamp()
            let dayList = [1,2,3,4,5,6]; // 1: monday 7: Sunday

            //   let allJobsList = [{"building_id":1,"everyday":"82","thriceweek":"13","onceweek":"32","everydayVehicleId":[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,102,102,103,104,105], "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]},
            //                     {"building_id":2,"everyday":"82","thriceweek":"13","onceweek":"15","everydayVehicleId":[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,102,102,103,104,105], "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[14,15,16,17,18,19,20,21,22,23]}]
            // let allJobsList = [{"building_id":1,"everyday":"2","thriceweek":"15","onceweek":"15","everydayVehicleId":[{"vehicle_id":24,"block_list":"1,2"},{"vehicle_id":25,"block_list":"1"}], "thriceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":"1,2,3"},{"vehicle_id":3,"block_list":"1,2,3"},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},
            //                     {"building_id":2,"everyday":"2","thriceweek":"15","onceweek":"15","everydayVehicleId":[{"vehicle_id":24,"block_list":"1,2"},{"vehicle_id":25,"block_list":"1,2,3,4,5"}], "thriceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3,4,5"},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]
            //  let executiveList = [{"executive_id":"1","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"2","no_of_jobs":5,"executivePendingJobs":5,"actual_jobs":5,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"3","no_of_jobs":5,"executivePendingJobs":5,"actual_jobs":5,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"4","no_of_jobs":1,"executivePendingJobs":1,"actual_jobs":1,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"5","no_of_jobs":15,"executivePendingJobs":15,"actual_jobs":15,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]}]

            //  let allJobsList = [{"building_id":1,"everyday":"12","thriceweek":"15","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""}], "thriceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":"1,2,3"},{"vehicle_id":3,"block_list":"1,2,3"},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},
            //                      {"building_id":2,"everyday":"5","thriceweek":"15","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"block_list":""},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""}], "thriceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3,4,5"},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"block_list":"1,2,3"},{"vehicle_id":2,"block_list":""},{"vehicle_id":3,"block_list":""},{"vehicle_id":4,"block_list":""},{"vehicle_id":5,"block_list":""},{"vehicle_id":6,"block_list":""},{"vehicle_id":7,"block_list":""},{"vehicle_id":8,"block_list":""},{"vehicle_id":9,"block_list":""},{"vehicle_id":10,"block_list":""},{"vehicle_id":11,"block_list":""},{"vehicle_id":12,"block_list":""},{"vehicle_id":13,"block_list":""},{"vehicle_id":14,"block_list":""},{"vehicle_id":15,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]
            //  let executiveList = [{"executive_id":"1","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"2","no_of_jobs":5,"executivePendingJobs":5,"actual_jobs":5,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"3","no_of_jobs":5,"executivePendingJobs":5,"actual_jobs":5,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"4","no_of_jobs":1,"executivePendingJobs":1,"actual_jobs":1,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]},{"executive_id":"5","no_of_jobs":15,"executivePendingJobs":15,"actual_jobs":15,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[]}]
            let assignedExecutiveId=[]  
            let assignedBuilding=[]  
            let userEveryDaySQL = []   
            let currentExecutiveList = '', updatedJobList = '' , getFinalExecutiveBuildingList= executiveList, isComplex=1;
            let buildingList = allJobsList.building_list.length;
            let allJobsListOrg = []
            // allJobsListOrg = await allJobsList.map((item) =>{               
            //                    return item               
            //                   });
            //console.log("executiveList",executiveList) 
            //console.log("allJobsList",allJobsList)

           // console.log("buildingList",buildingList)
            let complexTotalJobList =[{"everydayTotalJob":allJobsList.everydayTotalJob,"thriceweekTotalJob":allJobsList.thriceweekTotalJob,"onceweekTotalJob":allJobsList.onceweekTotalJob}]
            let complexId = allJobsList.complexId
            let getRefinedBuilding =[]
            
            /* 
              Here we iterate through the building list and send the Executive to different API to fetch the data.
            */

            console.log("building length",allJobsList.building_list.length)

            if(allJobsList.building_list.length >0){
                currentExecutiveList = executiveList
                let getQuestionList = async _ => {
                for(let cnt=0;cnt<allJobsList.building_list.length;cnt++) { 
                    assignedBuilding.push({"building_id": allJobsList.building_list[cnt].building_id ,"everydayVehicleId": allJobsList.building_list[cnt].everydayVehicleId,"thriceWeekVehicleId": allJobsList.building_list[cnt].thriceWeekVehicleId ,"onceWeekVehicleId": allJobsList.building_list[cnt].onceWeekVehicleId ,    "everydayPendingJobs":0, "everydayPendingJobsList": [],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[]  })
                    getRefinedBuilding.push({"building_id": allJobsList.building_list[cnt].building_id ,"everydayVehicleId": allJobsList.building_list[cnt].everydayVehicleId,"thriceWeekVehicleId": allJobsList.building_list[cnt].thriceWeekVehicleId ,"onceWeekVehicleId": allJobsList.building_list[cnt].onceWeekVehicleId ,    "everydayPendingJobs":0, "everydayPendingJobsList": [],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[]  })
                    /** 
                    * getAllEveryDayJobAssignment -> this will take all the Everyday job of the building and assign the Jobs to the Executive.
                    * @param {Array} building_list It takes the single building with vehicle list
                    * @param {Array} executiveList It takes the executive array
                    * @param {Array} assignedBuilding its the list with building_id, vechilie ids etc
                    * @param {number} cnt current count
                    * @param {number} complexId current complex Id 
                    * @param {Array} complexTotalJobList total count everyday,ThriceWeek and Onceweek Jobs all building for that complex
                    * @param {number} isComplex flag to show its complex or not // all building are now in complex
                    * @param {number} buildingList tottal building count in complex 
                    * @return It returns the  Assigned executive List , Assignes building list and complex total Jobs {"assignedExecutiveId":executiveList,"assignedBuilding":assignedBuilding,"complexTotalJobList":complexTotalJobList}
                    */
                  
                    updatedJobList = await this.getAllEveryDayJobAssignment(allJobsList.building_list[cnt],currentExecutiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,buildingList)  
                    complexTotalJobList = updatedJobList.complexTotalJobList
                    //console.log("updatedJobList",updatedJobList)

                    

                    if(cnt==0){
                   //     console.log("1234123412341234updatedJobList=========>",updatedJobList)
                    }
                    
                    currentExecutiveList =  await this.getExecutiveList(currentExecutiveList,updatedJobList.assignedExecutiveId);
                //   console.log("complexTotalJobList",complexTotalJobList)  


                //   console.log("\n \n getAllEveryDayJobAssignment",updatedJobList)





                   // console.log("currentExecutiveList =========>",currentExecutiveList)
                    //assignedBuilding[cnt] = updatedJobList.assignedBuilding
                   // console.log("executiveList",executiveList)
                    executiveList = await this.getFinalExecutiveBuildingList(updatedJobList.assignedExecutiveId,executiveList)


                     updatedJobList = await this.getAllThriceWeekJobAssignment(allJobsList.building_list[cnt],currentExecutiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,buildingList)
                     complexTotalJobList = updatedJobList.complexTotalJobList

                     //console.log("updatedJobList 123 =====>",updatedJobList)
                     currentExecutiveList =  await this.getExecutiveList(currentExecutiveList,updatedJobList.assignedExecutiveId);
                     //assignedBuilding[cnt] = updatedJobList.assignedBuilding
                     executiveList =  await this.getFinalExecutiveBuildingList(updatedJobList.assignedExecutiveId,executiveList); 

                     updatedJobList = await this.getAllOnceWeekJobAssignment(allJobsList.building_list[cnt],currentExecutiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,buildingList) 
                     complexTotalJobList = updatedJobList.complexTotalJobList
                     
                     currentExecutiveList =  await this.getExecutiveList(currentExecutiveList,updatedJobList.assignedExecutiveId);
                     //assignedBuilding[cnt] = updatedJobList.assignedBuilding
                     executiveList =  await this.getFinalExecutiveBuildingList(updatedJobList.assignedExecutiveId,executiveList); 
                     buildingList--;
                //     await this.executiveBuildingJobAssignList(executiveList,complexId,allJobsList.building_list[cnt].building_id)



             //    console.log("updatedJobList.assignedBuilding[cnt].everydayPendingJobsList",updatedJobList.assignedBuilding[cnt].everydayPendingJobsList)
                 console.log("===============================1234getRefinedBuilding"+cnt,getRefinedBuilding) 




                 console.log("updatedJobList.assignedBuilding[cnt].thriceWeekPendingJobsList",updatedJobList.assignedBuilding[cnt].thriceWeekPendingJobsList)


                 console.log("==============> updatedJobList.assignedBuilding[cnt].thriceWeekPendingJobsList",JSON.parse(updatedJobList.assignedBuilding[cnt].thriceWeekPendingJobsList).length)

                    if(JSON.parse(updatedJobList.assignedBuilding[cnt].everydayPendingJobsList).length>0){
                      getRefinedBuilding[cnt].everydayVehicleId =  updatedJobList.assignedBuilding[cnt].everydayPendingJobsList
                    } else{
                        getRefinedBuilding[cnt].everydayVehicleId =  []
                    }
                    if(JSON.parse(updatedJobList.assignedBuilding[cnt].thriceWeekPendingJobsList).length>0){
                      getRefinedBuilding[cnt].thriceWeekVehicleId = updatedJobList.assignedBuilding[cnt].thriceWeekPendingJobsList
                    } else{
                        getRefinedBuilding[cnt].thriceWeekVehicleId = []
                    }
                    if(JSON.parse(updatedJobList.assignedBuilding[cnt].onceweekPendingJobsList).length>0){
                      getRefinedBuilding[cnt].onceWeekVehicleId =  updatedJobList.assignedBuilding[cnt].onceweekPendingJobsList
                    } else {
                        getRefinedBuilding[cnt].onceWeekVehicleId =  []
                    }

                    console.log("==============================="+cnt,getRefinedBuilding)


    
                }

            }
            await getQuestionList(); 
           // console.log("allJobsListOrg",allJobsList)
           // assignedBuilding =  await this.getBuildingDetails(updatedJobList.assignedBuilding,allJobsListOrg); 

            
        console.log(" \n \n getFinalExecutiveBuildingList : %O",{...complexTotalJobList[0], "building":updatedJobList.assignedBuilding,"executiveList": JSON.stringify(executiveList) })

       // return ;
      




      // *!@#*   await this.getBuildingExecutiveAllocationByThresholdSet({ ...complexTotalJobList[0], "building": updatedJobList.assignedBuilding},executiveList)
      
         // *!@#$* await this.setExecutiveJobList(executiveList)
     // *!@#*    await this.setComplexBuildingJobAssignList({...complexTotalJobList[0],"building":updatedJobList.assignedBuilding})
         //console.log("currentExecutiveList",currentExecutiveList)
         //console.log("executiveList",executiveList)

        
         let getAllExecutiveForScheduling = await this.getAllExecutiveForScheduling(executiveList)
    // *!@#*     await this.setBuildingPendingList(complexId,updatedJobList.assignedBuilding)
         //console.log("complexTotalJobList[0]",complexTotalJobList[0])
    // *!@#*     await this.setComplexPendingList({...complexTotalJobList[0]},complexId)

         //console.log(" \n \n \n \n \n getAllExecutiveForScheduling",getAllExecutiveForScheduling)
    //*!@#*     return getAllExecutiveForScheduling;
        if(forHRReport==1) {
         await this.getHRReportForExecutiveList(executiveList)
        }
       

        console.log("updatedJobList.assignedBuilding",updatedJobList.assignedBuilding)

        console.log(" \n \n \n \n 1234getRefinedBuilding",getRefinedBuilding)
        /* 
           Below API is used to Reassign the Executive to the building
        */
                     
         await this.executiveReassignToBuilding([{...complexTotalJobList[0],"complexId":complexId, "building_list":getRefinedBuilding}],executiveList)
           }  
           return;         
            
        } catch (error) {
            return promise.reject(error)
        }
    }

    
    
    async getUserDayList(executive_id,no_of_jobs,everydayDeduct,building_id,executivePendingJobs,evenJobs,oddJobs,type){
        let dayList = [1,2,3,4,5,6]; // 1: monday 7: Sunday 
     
       return dayList.map( day => {
           // console.log("========================")
           if(type == 1) {
               //console.log("evenJobs",evenJobs)
              // console.log('\n ExecutiveId => ' +executive_id + ' \n Executive Total Jobs ==>' + no_of_jobs +  ' \n EveryDay count => ' + everydayDeduct +  ' \n executivePendingJobs ==>' + executivePendingJobs + ' \n Building Id ==>'+ building_id +'\n Day =>' + day + '\n Job Id ==>' + evenJobs )
           } else if(type == 2) {
               if(day % 2 ==0) {
               // console.log('\n ExecutiveId => ' +executive_id + ' \n Executive Total Jobs ==>' + no_of_jobs +  ' \n EveryDay count => ' + everydayDeduct +  ' \n executivePendingJobs ==>' + executivePendingJobs + ' \n Building Id ==>'+ building_id +'\n Day =>' + day + '\n Job Id ==>' + evenJobs )
              } else {
               // console.log('\n ExecutiveId => ' +executive_id + ' \n Executive Total Jobs ==>' + no_of_jobs +  ' \n EveryDay count => ' + everydayDeduct +  ' \n executivePendingJobs ==>' + executivePendingJobs + ' \n Building Id ==>'+ building_id +'\n Day =>' + day + '\n Job Id ==>' + oddJobs )

              } 
          } else if(type ==3){ 
            
               //  console.log('\n ExecutiveId => ' +executive_id + ' \n Executive Total Jobs ==>' + no_of_jobs +  ' \n EveryDay count => ' + everydayDeduct +  ' \n executivePendingJobs ==>' + executivePendingJobs + ' \n Building Id ==>'+ building_id +'\n Day =>' + day + '\n Job Id ==>' + evenJobs )
              
          }
           
        })
    } 
    async getExecutiveList(executiveList,updatedJobList){
        let cnt = 0;
         //console.log("updatedJobList 123 =========>",updatedJobList)
        executiveList = await executiveList.map((item) =>{
            if( (updatedJobList.length - 1) >= cnt){
            if(item.executive_id == updatedJobList[cnt].executive_id) {
                updatedJobList[cnt].actual_jobs = item.actual_jobs
                // console.log("=========== updatedJobList[cnt].executive_id"+updatedJobList[cnt].executive_id)
                cnt++
                return updatedJobList[cnt-1]
            } else {
                return item
            } 
        } else {
            return item
        }
           
        } )
        // console.log(" ====================> executiveList 123",executiveList)
                
        return executiveList.filter((item) => item.executivePendingJobs != 0 )
    }
    async setExecutiveIdsVehicleList(executiveList,updatedJobList){
        let cnt = 0;
        executiveList = await executiveList.map((item) =>{
            if(item.executive_id == updatedJobList[cnt].executive_id) {
                cnt++  
             return updatedJobList[cnt]
            } else {
                cnt++  
                return item
            }  
        } )
                
        return executiveList.filter((item) => item.executivePendingJobs != 0 )
    }
    async setLatestBuildingCustomerDetail(){
       let currentSeting = dateHelper.getCurrentTimeStamp()
       let currentDate = dateHelper.getFormattedDate()

       let selectParams = `b.building_id,b.complex_id`,
           where = ` b.is_active = 1 AND subscription_end_date >= '${currentDate}' AND status = 1 GROUP BY b.building_id `,
           join = ` LEFT JOIN customer_subscription_relation cs ON cs.building_id=b.building_id` 
            
       let buildingPlan = await db.select('building b' + join, selectParams, where )
       let allBuildingDetail = []
       let getBuildingList = async _ => {
            for(let bcnt=0;bcnt<buildingPlan.length;bcnt++){
                // let selectParams = ` COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 1),0 ) as everyDay, 
                //                      COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 2),0 ) as thriceWeek, 
                //                      COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 3),0 )  as onceWeek `,
                let building_id = buildingPlan[bcnt].building_id,
                    complex_id = buildingPlan[bcnt].complex_id
                selectParams = ` COALESCE(COUNT(DISTINCT cs.vehicle_id) filter (where subscription_type = 1),0 ) as everyDay, 
                    COALESCE(COUNT(DISTINCT cs.vehicle_id) filter (where subscription_type = 2),0 ) as thriceWeek, 
                    COALESCE(COUNT(DISTINCT cs.vehicle_id) filter (where subscription_type = 3),0 )  as onceWeek , array_to_string(array_agg( case when subscription_type = 1 then cs.vehicle_id end ), ',') everydayList, array_to_string(array_agg( case when subscription_type = 2 then cs.vehicle_id end ), ',') thriceweekList,
                    COALESCE(( 
                        SELECT json_agg(item)
                        FROM (
                        SELECT max(b.customer_id) AS customer_id, min(b.vehicle_id) AS vehicle_id ,max(is_car) is_car, array_to_string(array_agg(executive_id), ',') block_list
                        FROM customer_subscription_relation b 
                        LEFT JOIN executive_customer_block_relation ec ON ec.customer_id= b.customer_id
                        WHERE b.subscription_type = 1 AND b.building_id = ${building_id} AND status=1 AND b.subscription_end_date >= '${currentDate}' GROUP BY b.vehicle_id
                        ) item
                    ),'[]') AS everyday_job_list,
                    COALESCE(( 
                        SELECT json_agg(item)
                        FROM (
                        SELECT max(b.customer_id) AS customer_id, min(b.vehicle_id) AS vehicle_id ,max(is_car) is_car, array_to_string(array_agg(executive_id), ',') block_list
                        FROM customer_subscription_relation b 
                        LEFT JOIN executive_customer_block_relation ec ON ec.customer_id= b.customer_id
                        WHERE b.subscription_type = 2 AND b.building_id = ${building_id} AND status=1 AND b.subscription_end_date >= '${currentDate}' GROUP BY b.vehicle_id
                        ) item
                    ),'[]') AS thriceweek_job_list,
                    COALESCE(( 
                        SELECT json_agg(item)
                        FROM (
                        SELECT max(b.customer_id) AS customer_id, min(b.vehicle_id) AS vehicle_id ,max(is_car) is_car , array_to_string(array_agg(executive_id), ',') block_list
                        FROM customer_subscription_relation b 
                        LEFT JOIN executive_customer_block_relation ec ON ec.customer_id= b.customer_id
                        WHERE b.subscription_type = 3 AND b.building_id = ${building_id} AND status=1 AND b.subscription_end_date >= '${currentDate}' GROUP BY b.vehicle_id
                        ) item
                    ),'[]') AS onceweek_job_list`,
                where = ` cs.subscription_start_date <= '${currentDate}' AND cs.subscription_end_date >= '${currentDate}' AND status = 1 AND cs.has_paid = 1 AND cs.building_id = ${building_id}`
                let userVehicleList = await db.select('customer_subscription_relation cs' , selectParams, where ) 
                if(userVehicleList.length>0){
                  allBuildingDetail.push(`(${building_id},${building_id},${complex_id},1,${parseInt(userVehicleList[0].everyday) + parseInt(userVehicleList[0].thriceweek) + parseInt(userVehicleList[0].onceweek)},${userVehicleList[0].everyday},${userVehicleList[0].thriceweek},${userVehicleList[0].onceweek},'${JSON.stringify(userVehicleList[0].everyday_job_list)}','${JSON.stringify(userVehicleList[0].thriceweek_job_list)}','${JSON.stringify(userVehicleList[0].onceweek_job_list)}',${currentSeting},${currentSeting})`)
                }
                //return userVehicleList;
            }
        }
        await getBuildingList();

        console.log("allBuildingDetail",JSON.stringify(allBuildingDetail) )
      

        db.bulkinsert('building_vehicle_weekly_relation','(building_complex_id,building_id,complex_id,is_complex,subscription_count,everyday_vehicle,thrice_a_week_vehicle,once_a_week_vehicle,everyday_job_list,thriceweek_job_list,onceweek_job_list,created_date,modified_date)',allBuildingDetail.join(','),'','')


    }
    async getFinalExecutiveBuildingList(updatedJobList,executiveList){

        //console.log(" \n \n updatedJobList",updatedJobList)
        //console.log(" \n \n executiveList ===>",executiveList)
        let cnt = 0;
        executiveList = await executiveList.map((item) =>{
            if( (updatedJobList.length - 1) >= cnt){
            if(item.executive_id == updatedJobList[cnt].executive_id) {
                updatedJobList[cnt].actual_jobs = item.actual_jobs
                //console.log("=========== updatedJobList[cnt].executive_id"+updatedJobList[cnt].executive_id)
                cnt++
                return updatedJobList[cnt-1]
            } else {
                return item
            } 
        } else {
            return item
        }
           
        } )
                
        return executiveList

    }  

    async getBuildingBlockExecutiveId(buildingId){ 
        let selectParams = `executive_id`,
           where = ` b.building_id = ${buildingId} AND is_blocked = 1 `
            
       let executiveList = await db.select('executive_building_relation b' , selectParams, where )
       if(executiveList.length >0){
           executiveList = await executiveList.map(item => parseInt(item.executive_id))   
           return executiveList.join(',')
       } else {
           return "";
       }

    }
    async getBuildingExecutiveAllocationByThresholdSetBackup(building,executiveList){ 
       // console.log("getBuildingExecutiveAllocationByThresholdSet building",building) 
      //  console.log("executiveList",executiveList)
        let executiveJobThreshold = 2
        let executiveFullyAssigned = await this.getFullyAssignedExecutives(executiveList)
        let getPendingJobList = await this.getPendingJobList(building[building.length - 1])
        let lastBuilding = 0

        console.log("executiveFullyAssigned",executiveFullyAssigned)
        console.log("getPendingJobList",getPendingJobList)
        let executiveJobRatio = Math.ceil((getPendingJobList / (executiveFullyAssigned.length) ))
        let ecnt = 0
        if( executiveJobRatio <= executiveJobThreshold ){

            // console.log("building[lastBuilding].everydayVehicleId",JSON.parse(building[lastBuilding].everydayPendingJobsList)[0])
            // executiveFullyAssigned[ecnt].everydayassignedJobList[0].executivejobList.push({"123":123})
            // console.log("building[lastBuilding].thriceWeekVehicleId[0]",building[lastBuilding].everydayPendingJobsList[0])
            // console.log("executiveFullyAssigned[ecnt].everydayassignedJobList[0]",executiveFullyAssigned[ecnt].everydayassignedJobList[0].executivejobList)
            
            for(let cnt =0;cnt<getPendingJobList;cnt++){
                console.log("executiveFullyAssigned[ecnt].onceWeekAssignedJobList[0].executivejobList",executiveFullyAssigned[ecnt].onceWeekAssignedJobList[0])

                console.log("========================cnt",cnt)
                if(building[lastBuilding].everydayPendingJobs!=0 && building[lastBuilding].everydayPendingJobsList.length>0){
                    if(cnt==0){
                      building[lastBuilding].everydayPendingJobsList = JSON.parse(building[lastBuilding].everydayPendingJobsList).slice(0)
                    }
                    executiveFullyAssigned[ecnt].no_of_jobs = executiveFullyAssigned[ecnt].no_of_jobs - 1
                    executiveFullyAssigned[ecnt].executivePendingJobs = executiveFullyAssigned[ecnt].executivePendingJobs - 1
                    let arrEveryday = building[lastBuilding].everydayPendingJobsList[0];
                    console.log("arrEveryday  =====>" + cnt ,arrEveryday)
                    if('executivejobList' in executiveFullyAssigned[ecnt].everydayassignedJobList){
                       executiveFullyAssigned[ecnt].everydayassignedJobList[0].executivejobList.push(arrEveryday)
                    } else {
                        executiveFullyAssigned[ecnt].everydayassignedJobList.push({"building_id":building[lastBuilding].building_id,"executivejobList":[arrEveryday]})
                    }
                    building[lastBuilding].everydayPendingJobsList = building[lastBuilding].everydayPendingJobsList.slice(1,building[lastBuilding].everydayPendingJobsList.length)

                } else if(building[lastBuilding].thriceWeekPendingJobs != 0 && building[lastBuilding].thriceWeekVehicleId.length>0){
                    if(cnt==1 || cnt==2){
                      building[lastBuilding].thriceWeekVehicleId = JSON.parse(building[lastBuilding].thriceWeekVehicleId).slice(0)
                    }
                    executiveFullyAssigned[ecnt].no_of_jobs = executiveFullyAssigned[ecnt].no_of_jobs - 1
                    executiveFullyAssigned[ecnt].executivePendingJobs = executiveFullyAssigned[ecnt].executivePendingJobs - 1
                    if('executivejobList' in executiveFullyAssigned[ecnt].thriceWeekassignedJobList){
                        executiveFullyAssigned[ecnt].thriceWeekassignedJobList[0].executivejobList.push(building[lastBuilding].thriceWeekVehicleId[0])
                    //    executiveFullyAssigned[ecnt].thriceWeekassignedJobList[0].executivejobList.push(arrEveryday)
                     } else {
                         executiveFullyAssigned[ecnt].thriceWeekassignedJobList.push({"building_id":building[lastBuilding].building_id,"executivejobList":[building[lastBuilding].thriceWeekVehicleId[0]]})
                     }

                    building[lastBuilding].thriceWeekVehicleId = building[lastBuilding].thriceWeekVehicleId.slice(1,building[lastBuilding].thriceWeekVehicleId.length)

                } else if(building[lastBuilding].onceweekPendingJobs!=0 && building[lastBuilding].onceWeekVehicleId.length>0){
                    if(cnt==1 || cnt==2 || cnt==3 ){
                      building[lastBuilding].onceWeekVehicleId = JSON.parse(building[lastBuilding].onceWeekVehicleId).slice(0)
                    }
                    executiveFullyAssigned[ecnt].no_of_jobs = executiveFullyAssigned[ecnt].no_of_jobs - 1
                    executiveFullyAssigned[ecnt].executivePendingJobs = executiveFullyAssigned[ecnt].executivePendingJobs - 1
                    if('executivejobList' in executiveFullyAssigned[ecnt].onceWeekAssignedJobList){
                        executiveFullyAssigned[ecnt].onceWeekAssignedJobList[0].executivejobList.push(building[lastBuilding].onceWeekVehicleId[0])
                        //executiveFullyAssigned[ecnt].onceWeekAssignedJobList[0].executivejobList.push(arrEveryday)
                     } else {
                         executiveFullyAssigned[ecnt].onceWeekAssignedJobList.push({"building_id":building[lastBuilding].building_id,"executivejobList":[building[lastBuilding].onceWeekVehicleId[0]]})
                     }

                    building[lastBuilding].onceWeekVehicleId = building[lastBuilding].onceWeekVehicleId.slice(1,building[lastBuilding].onceWeekVehicleId.length)
                }
                ecnt++;
                if(ecnt >= executiveFullyAssigned.length){
                    ecnt = 0
                }

                //console.log(" executiveFullyAssigned ================>",JSON.stringify(executiveFullyAssigned[ecnt].everydayassignedJobList) ) 


            }

            console.log(" \n \n ====================================================== ")

            console.log(" Executive ================>",executiveFullyAssigned) 

            console.log(" building ==============>",building)

            
        } else {
            console.log(" No Allocation")
        }
       // console.log(" thresold ===>  ",executiveJobThreshold * (executiveFullyAssigned.length) )

    }
    async getBuildingExecutiveAllocationByThresholdSet(buildingJobList,executiveList){ 
        // console.log("getBuildingExecutiveAllocationByThresholdSet building",building) 
       //  console.log("executiveList",executiveList) 
       // console.log(" \n \n \n \n ================ building",buildingJobList)


        
         let executiveJobThreshold = 10
         let executiveFullyAssigned = await this.getFullyAssignedExecutives(executiveList)
         let getPendingJobList = await this.getPendingJobList(buildingJobList)
         //let lastBuilding = buildingJobList.building.length - 1
 
         console.log("executiveFullyAssigned",executiveFullyAssigned)
         console.log("getPendingJobList",getPendingJobList)
         let executiveJobRatio = Math.ceil((getPendingJobList / (executiveFullyAssigned.length) ))
         let ecnt = 0
         if( executiveJobRatio <= executiveJobThreshold ){ 
             let updatedList =''
             let getBuildingList = async _ => {
                    for(let bcnt=0;bcnt<buildingJobList.building.length;bcnt++){
                       let getBuildingSpecificPendingJobList = await this.getBuildingSpecificPendingJobList(buildingJobList.building[bcnt])
                       //console.log("getBuildingSpecificPendingJobList",getBuildingSpecificPendingJobList)
                       if(getBuildingSpecificPendingJobList>0){
                        updatedList = await this.getBuildingExecutiveThresholdSet(buildingJobList.building[bcnt],executiveFullyAssigned,getBuildingSpecificPendingJobList,bcnt)
                        console.log("updatedList  ===============>"+buildingJobList.building[bcnt].building_id,updatedList)
                       }
                    }
                    }
                await getBuildingList()
 
             console.log(" \n \n ====================================================== ")
 
             console.log(" Executive ================>", JSON.stringify(updatedList.executiveFullyAssigned) )  
 
             //console.log(" building ==============>",building)
 
             
         } else {
             console.log(" No Allocation")
         }
        // console.log(" thresold ===>  ",executiveJobThreshold * (executiveFullyAssigned.length) )
 
     } 
    async getFullyAssignedExecutives(executiveList){
        return executiveList.filter((item) => item.executivePendingJobs == 0 )
    } 
    async getPendingJobList(building){
        return building.everydayTotalJob  + building.thriceweekTotalJob   + building.onceweekTotalJob

    }
    async getBuildingSpecificPendingJobList(building){
        return building.everydayPendingJobs   + building.thriceWeekPendingJobs    +  building.onceweekPendingJobs 

    }
    async getPartiallyAssignedExecutives(executiveList){
        console.log("getPartiallyAssignedExecutives",executiveList)
        return executiveList.filter((item) => item.executivePendingJobs != 0 )
    } 
    async setBuildingPendingList(complexId,buildingList){
        console.log("buildingList",buildingList)

        let sqlBuildingPendingJobs = [] 
        
        
        

        let currentSeting = dateHelper.getCurrentTimeStamp()
        let getBuildingList = async _ => {
                for(let cnt=0;cnt<buildingList.length;cnt++){ 
                    
                   // console.log("buildingList[cnt].everydayPendingJobsList" + cnt,buildingList[cnt].everydayPendingJobsList)
                    let strBuilding = `(${buildingList[cnt].building_id},${complexId},${buildingList[cnt].everydayVehicleId.length + buildingList[cnt].thriceWeekVehicleId.length + buildingList[cnt].onceWeekVehicleId.length},${buildingList[cnt].everydayPendingJobs},${buildingList[cnt].thriceWeekPendingJobs},${buildingList[cnt].onceweekPendingJobs}`
                    
                    if(typeof buildingList[cnt].everydayPendingJobsList == "string" ){
                      buildingList[cnt].everydayPendingJobsList = JSON.parse(buildingList[cnt].everydayPendingJobsList)
                    }
                    // console.log("buildingList[cnt].everydayPendingJobsList" + cnt,buildingList[cnt].everydayPendingJobsList)
                    if(typeof buildingList[cnt].thriceWeekPendingJobsList == "string" ){
                      buildingList[cnt].thriceWeekPendingJobsList = JSON.parse(buildingList[cnt].thriceWeekPendingJobsList)
                    }
                    if(typeof buildingList[cnt].onceweekPendingJobsList == "string"){
                      buildingList[cnt].onceweekPendingJobsList = JSON.parse(buildingList[cnt].onceweekPendingJobsList)
                    }
                    
                    if(buildingList[cnt].everydayPendingJobsList.length>0){
                        strBuilding += `,'${JSON.stringify(buildingList[cnt].everydayPendingJobsList)}'`
                    } else {
                        strBuilding += `,'[]'`
                    }
                    if(buildingList[cnt].thriceWeekPendingJobsList.length>0){
                        strBuilding += `,'${JSON.stringify(buildingList[cnt].thriceWeekPendingJobsList)}'`
                    } else {
                        strBuilding += `,'[]'`
                    }
                    if(buildingList[cnt].onceweekPendingJobsList.length>0){
                        strBuilding += `,'${JSON.stringify(buildingList[cnt].onceweekPendingJobsList)}'`
                    } else {
                        strBuilding += `,'[]'`
                    }
                    strBuilding += ` ,${buildingList[cnt].everydayPendingJobsList.length + Math.ceil(buildingList[cnt].thriceWeekPendingJobsList.length / 2) + Math.ceil(buildingList[cnt].onceweekPendingJobsList.length / 6 )},${currentSeting},${currentSeting})`
                    sqlBuildingPendingJobs.push(strBuilding)
                    //console.log("\n \n \n \n \n sqlBuildingPendingJobs",sqlBuildingPendingJobs)
                }
        }
        await getBuildingList()
        if(sqlBuildingPendingJobs.length>0){
           // db.bulkinsert('building_jobs_pending','(building_id,complex_id,no_of_jobs,no_of_ed_pending,no_of_tw_pending,no_of_ow_pending,everyday_pending_jobs_list,thriceweek_pending_jobs_list,onceweek_pending_jobs_list,building_total_pending_jobs,created_date,modified_date)', sqlBuildingPendingJobs.join(','),'', '')
          }
    } 
    async setComplexPendingList(complexList,complexId){
        console.log("complexList",complexList)
        let currentSeting = dateHelper.getCurrentTimeStamp()
        //db.bulkinsert('complex_pending_jobs','(complex_id,complex_job_pending,everyday_total_job,thriceweek_total_job,onceweek_total_job,created_date,modified_date)',`(${complexId},${complexList.everydayTotalJob + Math.ceil(complexList.thriceweekTotalJob / 2)  + Math.ceil(complexList.onceweekTotalJob / 6) },${complexList.everydayTotalJob},${ Math.ceil(complexList.thriceweekTotalJob /2 )}, ${Math.ceil(complexList.onceweekTotalJob / 6) },${currentSeting},${currentSeting})`,'', '')
    }
    async getAllExecutiveForScheduling(executiveList){
        return executiveList.filter((item) => item.executivePendingJobs == 0 ).map(item => item.executive_id)
    } 
    async setExecutiveJobList(executiveList){
        let sqlEverydayList = [],
            sqlThriceweekList = [],
            sqlOnceweekList = []
        
            console.log("\n \n \n \n executiveList",executiveList)

        for(let cnt=0;cnt<executiveList.length;cnt++){  

            console.log(" \n \n executiveList[cnt]",executiveList[cnt])
            console.log("=============================>cnt",cnt)
            let washType =1          
            await this.executiveJobAssignList(executiveList[cnt].everydayassignedJobList,executiveList[cnt].executive_id,executiveList[cnt].supervisor_id,executiveList[cnt].top_supervisor_id,washType,1)
            await this.executiveJobAssignList(executiveList[cnt].thriceWeekassignedJobList,executiveList[cnt].executive_id,executiveList[cnt].supervisor_id,executiveList[cnt].top_supervisor_id,washType,2)
            await this.executiveJobAssignList(executiveList[cnt].onceWeekAssignedJobList ,executiveList[cnt].executive_id,executiveList[cnt].supervisor_id,executiveList[cnt].top_supervisor_id,washType,3)
            sqlEverydayList = executiveList[cnt].everydayassignedJobList            
        }


    } 
    async getHRReportForExecutiveList(executiveList){ 
        let sqlEverydayList = [],
            sqlThriceweekList = [],
            sqlOnceweekList = []
        
            console.log("\n \n \n \n executiveList 1234 HR",executiveList)

        for(let cnt=0;cnt<executiveList.length;cnt++){  

            console.log(" \n \n executiveList[cnt]",executiveList[cnt])
            console.log("=============================>cnt",cnt)
            let washType = 2          
            // executiveList[cnt].everydayassignedJobList = await  executiveList[cnt].everydayassignedJobList.filter(function(list) {
            //         //console.log("list.block_list.split(',')",list.block_list.split(','))
            //         if(list.is_car =="1" ) {
            //             return list  
            //         }
            //    })
            // executiveList[cnt].thriceWeekassignedJobList = await  executiveList[cnt].thriceWeekassignedJobList.filter(function(list) {
            //         //console.log("list.block_list.split(',')",list.block_list.split(','))
            //         if(list.is_car =="1" ) {
            //             return list  
            //         }
            //    })
            // executiveList[cnt].onceWeekAssignedJobList = await  executiveList[cnt].onceWeekAssignedJobList.filter(function(list) {
            //         //console.log("list.block_list.split(',')",list.block_list.split(','))
            //         if(list.is_car == "1" ) {
            //             return list  
            //         }
            //    })
            console.log("executiveList[cnt].everydayassignedJobList",executiveList[cnt].everydayassignedJobList)
            await this.executiveJobAssignListForHR(executiveList[cnt].everydayassignedJobList,executiveList[cnt].executive_id,executiveList[cnt].supervisor_id,executiveList[cnt].top_supervisor_id,washType,1)
            await this.executiveJobAssignListForHR(executiveList[cnt].thriceWeekassignedJobList,executiveList[cnt].executive_id,executiveList[cnt].supervisor_id,executiveList[cnt].top_supervisor_id,washType,2)
            await this.executiveJobAssignListForHR(executiveList[cnt].onceWeekAssignedJobList ,executiveList[cnt].executive_id,executiveList[cnt].supervisor_id,executiveList[cnt].top_supervisor_id,washType,3)
            sqlEverydayList = executiveList[cnt].everydayassignedJobList            
        }


    } 
    async executiveJobAssignList(jobList,executiveId,supervisorId,topSupervisorId,washType,type){
        let sqlJobList = []
        let currentSeting = dateHelper.getCurrentTimeStamp();
        let vehicleWashDate = new Date(); 
        let dayNotWorking = 5
        vehicleWashDate.setDate(vehicleWashDate.getDate());
        //console.log("vehicleWashDate",vehicleWashDate) 


        console.log(" \n \n ===============>jobList",JSON.stringify(jobList))
        console.log("================================= type",type)


        let getExecutiveJobList = async _ => {
        if(jobList.length>0){
            for(let bcnt=0;bcnt<jobList.length;bcnt++){
            if('building_id' in jobList[bcnt]){     
                    if(type == 1){
                        jobList[bcnt].executivejobList.map( (item) => {
                            //console.log("====================>item",item)
                            let vehicleWashDate = new Date(); 
                            vehicleWashDate.setDate(vehicleWashDate.getDate());
                            for(let day = 1; day<=7; day++){
                                if(day != dayNotWorking){
                                sqlJobList.push(`(${jobList[bcnt].building_id},${jobList[bcnt].complexId},${executiveId},${supervisorId},${topSupervisorId},${this.formatDate(vehicleWashDate)},${washType},${item.vehicle_id},${item.customer_id},${item.is_car},${currentSeting},${currentSeting})`)
                                vehicleWashDate.setDate(vehicleWashDate.getDate()+1)
                             }
                            }
                        })
                    }
                    if(type == 2){
                        let getOdddayJobList =  jobList[bcnt].executivejobList.slice(0,Math.ceil(jobList[bcnt].executivejobList.length/2) ) 
                        let getJobList = jobList[bcnt].executivejobList.slice(Math.ceil(jobList[bcnt].executivejobList.length/2),jobList[bcnt].executivejobList.length) 

                        getOdddayJobList.map( (item) => {
                            //console.log("====================>item",item)
                            let vehicleWashDate = new Date(); 
                            vehicleWashDate.setDate(vehicleWashDate.getDate());
                            for(let day = 1; day<=7; day = day+2){
                                if(day != dayNotWorking){
                                sqlJobList.push(`(${jobList[bcnt].building_id}, ${jobList[bcnt].complexId},${executiveId},${supervisorId},${topSupervisorId},${this.formatDate(vehicleWashDate)},${washType},${item.vehicle_id},${item.customer_id},${item.is_car},${currentSeting},${currentSeting})`)
                                vehicleWashDate.setDate(vehicleWashDate.getDate()+2);
                             }
                            }
                        })
                        getJobList.map( (item) => {
                            //console.log("====================>item",item)
                            let vehicleWashDate = new Date(); 
                            vehicleWashDate.setDate(vehicleWashDate.getDate()+1);
                            for(let day = 2; day<=7; day = day + 2){
                                if(day != dayNotWorking){
                                sqlJobList.push(`(${jobList[bcnt].building_id},${jobList[bcnt].complexId},${executiveId},${supervisorId},${topSupervisorId},${this.formatDate(vehicleWashDate)},${washType},${item.vehicle_id},${item.customer_id},${item.is_car},${currentSeting},${currentSeting})`)
                                vehicleWashDate.setDate(vehicleWashDate.getDate()+2);
                             }
                            }
                        })
                    } 
                    if(type == 3){
                      //  let vehicleWashDate = new Date(); 
                     //   vehicleWashDate.setDate(vehicleWashDate.getDate()+7);
                        let day = 1
                        jobList[bcnt].executivejobList.map( (item) => {
                            //console.log("====================>item",item)
                                if(day != dayNotWorking){
                                sqlJobList.push(`(${jobList[bcnt].building_id},${jobList[bcnt].complexId},${executiveId},${supervisorId},${topSupervisorId},${this.formatDate(vehicleWashDate)},${washType},${item.vehicle_id},${item.customer_id},${item.is_car},${currentSeting},${currentSeting})`)
                                vehicleWashDate.setDate(vehicleWashDate.getDate()+1);
                             }
                             day++ 
                             if(day>=8){
                                 day = 1
                                 vehicleWashDate = new Date(); 
                                 vehicleWashDate.setDate(vehicleWashDate.getDate());

                             }
                            
                        })
                    }
                }
            }
            }
        }
       await getExecutiveJobList()
       if(sqlJobList.length>0){
         db.bulkinsert('vehicle_wash_active_week','(building_id,complex_id,executive_id,supervisor_id,top_supervisor_id,vehicle_wash_date,wash_type,vehicle_id,customer_id,is_car,created_date,modified_date)', sqlJobList.join(','),'', '')
       }

        console.log("sqlJobList",sqlJobList)

    }
    async executiveJobAssignListForHR(jobList,executiveId,supervisorId,topSupervisorId,washType,type){
        let sqlJobList = []
        let currentSeting = dateHelper.getCurrentTimeStamp();
        let vehicleWashDate = new Date(); 
        let dayNotWorking = 5
        vehicleWashDate.setDate(vehicleWashDate.getDate()+14);
        //console.log("vehicleWashDate",vehicleWashDate) 


        console.log(" \n \n ===============>jobListexecutiveJobAssignListForHR",JSON.stringify(jobList) )
        console.log("================================= type",type)


        let getExecutiveJobList = async _ => {
        if(jobList.length>0){
            if('building_id' in jobList[0]){     
                    if(type == 1){
                        let startSlot = '05:00',
                            endSlot = '08:00',
                            interval = 30,
                            timeslots = []
                        jobList[0].executivejobList.map( (item) => {
                            //console.log("====================>item",item)
                            //let vehicleWashDate = new Date(); 
                           // vehicleWashDate.setDate(vehicleWashDate.getDate());
                            for(let day = 1; day<=7; day++){
                                if(day != dayNotWorking){
                                for(let cnt=0;cnt<4;cnt++){
                                     startSlot = this.addMinutes(startSlot , interval) 
                                     timeslots.push(startSlot);                                    
                                }
                                console.log("timeslots",timeslots)
                                sqlJobList.push(`(${jobList[0].building_id},${jobList[0].complexId},${executiveId},${supervisorId},${topSupervisorId},${this.formatDate(vehicleWashDate)},${washType},${item.vehicle_id},${item.customer_id},${item.is_car},${currentSeting},${currentSeting})`)
                                vehicleWashDate.setDate(vehicleWashDate.getDate()+1)
                             }
                            }
                        })
                    }
                    if(type == 2){
                        let getOdddayJobList =  jobList[0].executivejobList.slice(0,Math.ceil(jobList[0].executivejobList.length/2) ) 
                        let getJobList = jobList[0].executivejobList.slice(Math.ceil(jobList[0].executivejobList/2),jobList[0].executivejobList.length) 
                        getOdddayJobList.map( (item) => {
                            //console.log("====================>item",item)
                            let vehicleWashDate = new Date(); 
                           // vehicleWashDate.setDate(vehicleWashDate.getDate()+7);
                            for(let day = 1; day<=7; day = day+2){
                                if(day != dayNotWorking){
                                sqlJobList.push(`(${jobList[0].building_id}, ${jobList[0].complexId},${executiveId},${supervisorId},${topSupervisorId},${this.formatDate(vehicleWashDate)},${washType},${item.vehicle_id},${item.customer_id},${item.is_car},${currentSeting},${currentSeting})`)
                                vehicleWashDate.setDate(vehicleWashDate.getDate()+1);
                             }
                            }
                        })
                        getJobList.map( (item) => {
                            //console.log("====================>item",item)
                            let vehicleWashDate = new Date(); 
                            vehicleWashDate.setDate(vehicleWashDate.getDate()+7);
                            for(let day = 2; day<=7; day = day + 2){
                                if(day != dayNotWorking){
                                sqlJobList.push(`(${jobList[0].building_id},${jobList[0].complexId},${executiveId},${supervisorId},${topSupervisorId},${this.formatDate(vehicleWashDate)},${washType},${item.vehicle_id},${item.customer_id},${item.is_car},${currentSeting},${currentSeting})`)
                                vehicleWashDate.setDate(vehicleWashDate.getDate()+1);
                             }
                            }
                        })
                    } 
                    if(type == 3){
                        let vehicleWashDate = new Date(); 
                        vehicleWashDate.setDate(vehicleWashDate.getDate()+7);
                        let day = 1
                        jobList[0].executivejobList.map( (item) => {
                            //console.log("====================>item",item)
                                if(day != dayNotWorking){
                                sqlJobList.push(`(${jobList[0].building_id},${jobList[0].complexId},${executiveId},${supervisorId},${topSupervisorId},${this.formatDate(vehicleWashDate)},${washType},${item.vehicle_id},${item.customer_id},${item.is_car},${currentSeting},${currentSeting})`)
                                vehicleWashDate.setDate(vehicleWashDate.getDate()+1);
                             }
                             day++ 
                             if(day>=8){
                                 day = 1
                                 vehicleWashDate = new Date(); 
                                 vehicleWashDate.setDate(vehicleWashDate.getDate()+7);

                             }
                            
                        })
                    }
                }
            }
        }
       await getExecutiveJobList()
       if(sqlJobList.length>0){
         db.bulkinsert('vehicle_wash_active_week_hr','(building_id,complex_id,executive_id,supervisor_id,top_supervisor_id,vehicle_wash_date,wash_type,vehicle_id,customer_id,is_car,created_date,modified_date)', sqlJobList.join(','),'', '')
       }

        console.log("sqlJobList",sqlJobList)

    } 
    async addMinutes(time, minutes) {
        try{
            var date = new Date(new Date('01/01/2015 ' + time).getTime() + minutes * 60000);
            var tempTime = ((date.getHours().toString().length == 1) ? '0' + date.getHours() : date.getHours()) + ':' +
            ((date.getMinutes().toString().length == 1) ? '0' + date.getMinutes() : date.getMinutes()) + ':' +
            ((date.getSeconds().toString().length == 1) ? '0' + date.getSeconds() : date.getSeconds());
            return tempTime;
        } catch(error){
            return promise.reject(error)
        }
    }
    async setLatestComplexCustomerDetail(){ 
        let currentSeting = dateHelper.getCurrentTimeStamp()
       let currentDate = dateHelper.getFormattedDate()

       let selectParams = `array_to_string(array_agg(DISTINCT b.building_id),',') building_id,b.complex_id`,
           where = ` b.is_active = 1 AND subscription_end_date >= '${currentDate}' GROUP BY b.complex_id `,
           join = ` LEFT JOIN customer_subscription_relation cs ON cs.building_id=b.building_id` 
            
       let buildingPlan = await db.select('building b' + join, selectParams, where )
       let allBuildingDetail = []
       let getBuildingList = async _ => {
            for(let bcnt=0;bcnt<buildingPlan.length;bcnt++){
                // let selectParams = ` COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 1),0 ) as everyDay, 
                //                      COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 2),0 ) as thriceWeek, 
                //                      COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 3),0 )  as onceWeek `,
                let building_id = buildingPlan[bcnt].building_id,
                    complex_id = buildingPlan[bcnt].complex_id
                selectParams = ` COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 1 AND status = 1),0 ) as everyDay, 
                                 COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 2 AND status = 1),0 ) as thriceWeek, 
                                 COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 3 AND status = 1),0 )  as onceWeek`
                where = ` cs.building_id IN (${building_id}) AND subscription_end_date >= '${currentDate}'`
                let userVehicleList = await db.select('customer_subscription_relation cs' , selectParams, where )       
                let executiveList = await this.getExecutiveListByBuildingId(building_id,1000)
                if(userVehicleList.length>0){
                    let totalSubs = (parseInt(userVehicleList[0].everyday) + parseInt(userVehicleList[0].thriceweek) + parseInt(userVehicleList[0].onceweek))
                  allBuildingDetail.push(`(${complex_id},${totalSubs},${executiveList.length},1,${executiveList.length > 0 ? (totalSubs/executiveList.length) : 1 },${currentSeting},${currentSeting})`)
                }
                //return userVehicleList;
            }
        }
        await getBuildingList();

        console.log("allBuildingDetail",JSON.stringify(allBuildingDetail) )

       

        db.bulkinsert('complex_subscription_relation','(complex_building_id,total_subs,total_executive,is_complex,ranking,created_date,modified_date)',allBuildingDetail.join(','),'','')




    }
    async getBuildingJobsDetails(){
        let buildingJobs = ''
            selectParams = ''
    }
    async executiveBuildingJobAssignList(buildingExecutiveList,complexId,building_id){  
        let sqlJobExecutiveList = []
        let currentSeting = dateHelper.getCurrentTimeStamp()
        console.log("buildingExecutiveList",buildingExecutiveList)
        let getExecutiveJobList = async _ => { 
            for(let cnt=0;cnt<buildingExecutiveList.length;cnt++){
                let executivePendingJobs = buildingExecutiveList[cnt].executivePendingJobs > 0 ? buildingExecutiveList[cnt].executivePendingJobs :0
                sqlJobExecutiveList.push(`(${buildingExecutiveList[cnt].executive_id},${building_id},${complexId},${buildingExecutiveList[cnt].actual_jobs} - ${executivePendingJobs},${buildingExecutiveList[cnt].actual_jobs},${currentSeting},${currentSeting})`)
            }

        }
        await getExecutiveJobList() 
        if(sqlJobExecutiveList.length>0){
           // db.bulkinsert('executive_job_assign_relation','(executive_id,building_id,complex_id,no_of_assigned_job,no_of_jobs,created_date,modified_date)', sqlJobExecutiveList.join(','),'', '')
          }

    } 
    formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();
    
        if (month.length < 2) 
            month = '0' + month;
        if (day.length < 2) 
            day = '0' + day;
    
        return "'"+ [year, month, day].join('-') + "'";
    } 
    /**
     * This API allocate the executive completely, not based on full allocatiopn
     * @param {Array} allJobsList building data for complex spesific
     * @param {Array} executiveList Executive list with allocation 
     * @returns it allocate the executive to building and insert in table
     */
    async executiveReassignToBuilding(allJobsList,executiveList){

       // *!@#* let allJobsList = await this.getallBuildingReassign();
        let executiveBuildingJobAssignList = {"assignedComplexList":[]}
        console.log("=============================1234allJobsList",JSON.stringify(allJobsList) )

        let allComplexList = allJobsList.map(function (item) { return item.complexId})
        let getBuildingExecutiveList = async _ => {
            for(let cnt=0;cnt<allJobsList.length;cnt++) {
                let buildingId = allJobsList[cnt].building_list.map(function (item) { return item.building_id})
            // *!@#*    let executiveList = await this.getallBuildingExecutiveReassign(allJobsList[cnt].complexId,buildingId.join(','),Math.round( ( allJobsList[cnt].everydayTotalJob + allJobsList[cnt].thriceweekTotalJob + allJobsList[cnt].onceweekTotalJob) /30) + 1 );
                let executiveToConsiderList = []
                let executiveToNotConsiderList = []
            //     if(cnt==0){
            //   executiveList = [{"executive_id":"1","no_of_jobs":17,"executivePendingJobs":17,"actual_jobs":17,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"2","no_of_jobs":5,"executivePendingJobs":5,"actual_jobs":5,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"3","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"4","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"5","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}]
                    
            //     } else if(cnt==1){
            //         executiveList = [{"executive_id":"6","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"7","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}]
            //     } else if(cnt==2){
            //         executiveList = [{"executive_id":"8","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"9","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}]                    
            //     }
            
            /*
              From all the allocated Executive list it filters the partially allocate
            */
                if('executiveList' in executiveBuildingJobAssignList){
                    executiveToConsiderList = await this.getPartiallyAssignedExecutives(JSON.parse(executiveBuildingJobAssignList.executiveList))
                }
              //  console.log("executiveToConsiderList"+cnt,executiveToConsiderList)
              //  console.log("===========>executiveList",executiveList)
                let getExecutiveList = async _ => {
                    for(let ecnt=0;ecnt<executiveList.length;ecnt++){
                        executiveList[ecnt].actual_jobs = executiveList[ecnt].no_of_jobs
                    // *!@#*    executiveList[ecnt].everydayassignedJobList = []
                    // *!@#*    executiveList[ecnt].thriceWeekassignedJobList = []
                    // *!@#*    executiveList[ecnt].onceWeekAssignedJobList = []
                    }
                    
                }
                
                
                
                
                // console.log("executiveList",executiveList)
                await getExecutiveList();
               // console.log("allJobsList"+cnt,allJobsList[cnt])

               /* 
               FROM all the assigned Executive list we deduct the no_of_jobs by / by 10 in order to fetch the actual jobs to consider 
               */
                let getExecutiveToConsiderList = async _ => {
                    if(executiveToConsiderList.length>0){
                        for(let ecnt=0;ecnt<executiveToConsiderList.length;ecnt++){
                            executiveToConsiderList[ecnt].actual_jobs = executiveToConsiderList[ecnt].actual_jobs
                             //= executiveToConsiderList[ecnt].no_of_jobs
                            executiveToConsiderList[ecnt].no_of_jobs = executiveToConsiderList[ecnt].executivePendingJobs = executiveToConsiderList[ecnt].no_of_jobs - Math.ceil(executiveBuildingJobAssignList.complexIdToassign.route_time / 10)                            
                        }
                    }
                }
                await getExecutiveToConsiderList();
               // console.log("executiveToConsiderList",executiveToConsiderList)
               
                if(executiveToConsiderList.length>0){
                    executiveList.unshift(... executiveToConsiderList)
                } 

              //  console.log(" \n \n \n \n  ",JSON.stringify(executiveList))

            //  console.log(" \n \n \n \n  1234ExecutiveList",JSON.stringify(executiveList))

                executiveBuildingJobAssignList =  await this.executiveBuildingReassignment(allJobsList[cnt],executiveList,allComplexList,executiveBuildingJobAssignList.assignedComplexList,cnt)  
               
            //   console.log("executiveBuildingJobAssignList",executiveBuildingJobAssignList)  
            
                
              

                //return;              
            }
        }
        await getBuildingExecutiveList();

    }
    async getallBuildingReassign(){ 
     let selectParams = `complex_id as "complexId",everyday_total_job "everydayTotalJob",thriceweek_total_job "thriceweekTotalJob" ,onceweek_total_job "onceweekTotalJob"`,
         orderCondition =` 1 = 1 ORDER BY complex_job_pending DESC`
    let complexList = await db.select('complex_pending_jobs' , selectParams , orderCondition)  
     let getBuildingExecutiveList = async _ => {
            for(let cnt=0;cnt<complexList.length;cnt++) {
                let selectParams = ` building_id,complex_id,everyday_pending_jobs_list "everydayVehicleId" ,thriceweek_pending_jobs_list "thriceWeekVehicleId" ,onceweek_pending_jobs_list "onceWeekVehicleId" ,building_total_pending_jobs,
                                       0 "thriceWeekPendingJobs",0 "onceweekPendingJobs", 0 "everydayPendingJobs",
                                      no_of_ed_pending everyday,no_of_tw_pending thriceweek,no_of_ow_pending onceweek `,
                    where = ` complex_id = ${complexList[cnt].complexId} `
              let buildingList = await db.select('building_jobs_pending' , selectParams , where) 
              buildingList = complexList

                let getExecutiveList = async _ => {
                    for(let ecnt =0;ecnt<buildingList.length;ecnt++){
                        buildingList[ecnt].everydayPendingJobsList =[]
                        buildingList[ecnt].thriceWeekPendingJobsList = []
                        buildingList[ecnt].onceweekPendingJobsList = []
                    }
                }
                await getExecutiveList();                
                complexList[cnt].building_list = buildingList
            }
        }
        await getBuildingExecutiveList();        
        console.log("complexList",JSON.stringify(complexList) )
        return complexList;

    }
    async getallBuildingExecutiveReassign(complexId,buildingId,executiveCount){ 
      try {
            console.log("\n \n \n \n ======================buildingId",buildingId)
            // supervisor_id,top_supervisor_id
            let selectParams = `no_of_jobs,executive_id,no_of_jobs "executivePendingJobs"`,
            where = ` executive_building_relation.building_id IN (${buildingId}) AND is_active=1 AND executive_building_relation.is_blocked=0  AND executive_building_relation.executive_id NOT IN (SELECT executive_id FROM executive_job_assign_relation WHERE complex_id = ${complexId})  ORDER BY distance DESC,has_vehicle ASC LIMIT ${executiveCount}  `,
            join = ` LEFT JOIN service_provider ON service_provider.service_provider_id = executive_building_relation.executive_id ` 
            let userDetail = await db.select('executive_building_relation' + join , selectParams, where )
            return userDetail
        } catch (error) {
            return promise.reject(error)
        }
      


    } 
    /**
     * This API helps in the Reassign the Jobs to all executive
     * @param {Array} allJobsList building list for complex
     * @param {Array} executiveList executive list with allocated jobs
     * @param {Array} allComplexList It has all the jobs count for all building in that complex 
     * @param {Array} assignedComplexList List with assigned complex
     * @param {number} cnt counter
     * @returns it allocate the jobs and insert in table
     */
    async executiveBuildingReassignment(allJobsList,executiveList,allComplexList,assignedComplexList,cnt){
        //console.log("\n \n \n \n =========================1234executiveList List"+cnt,executiveList)

        let assignedExecutiveId=[]  
            let assignedBuilding=[]  
            let userEveryDaySQL = []   
            let currentExecutiveList = '', updatedJobList = '' , getFinalExecutiveBuildingList= executiveList, isComplex=1;
            let buildingList = 2;
            let allJobsListOrg = []

            //console.log("=============================cnt",cnt)
             console.log(" \n \n \n \n 1234allJobsList ==============>",JSON.stringify(allJobsList) )



             console.log("================>executiveList",executiveList)
            
            if(cnt==0){
            //allJobsList = {"everydayTotalJob":35,"thriceweekTotalJob":15,"onceweekTotalJob":10,"complexId":"1","building_list":[{"building_id":1,"everyday":"20","thriceweek":"10","onceweek":"30","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":2,"everyday":"15","thriceweek":"20","onceweek":"25","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}
        //   allJobsList = {"everydayTotalJob":50,"thriceweekTotalJob":45,"onceweekTotalJob":5,"complexId":"1","building_list":[{"building_id":1,"everyday":"30","thriceweek":"40","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3,4,5"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":31,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":32,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":33,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":34,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":35,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":36,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":37,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":38,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":39,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":40,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":2,"everyday":"20","thriceweek":"50","onceweek":"10","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":31,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":32,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":33,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":34,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":35,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":36,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":37,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":38,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":39,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":40,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":41,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":42,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":43,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":44,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":45,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":46,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":47,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":48,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":49,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":50,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}
            //  executiveList = [{"executive_id":"1","no_of_jobs":19,"executivePendingJobs":19,"actual_jobs":19,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"2","no_of_jobs":22,"executivePendingJobs":22,"actual_jobs":22,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"3","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"4","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"5","no_of_jobs":20,"executivePendingJobs":20,"actual_jobs":20,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}]
              //executiveList = [{"executive_id":"1","no_of_jobs":17,"executivePendingJobs":17,"actual_jobs":17,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"2","no_of_jobs":5,"executivePendingJobs":5,"actual_jobs":5,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"3","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"4","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"5","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}]
           // console.log("buildingList",buildingList)
            } else if(cnt==1){
             //    allJobsList = {"everydayTotalJob":35,"thriceweekTotalJob":15,"onceweekTotalJob":10,"complexId":"2","building_list":[{"building_id":1,"everyday":"20","thriceweek":"10","onceweek":"30","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":"1,2,3"},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":2,"everyday":"15","thriceweek":"20","onceweek":"25","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}



        //     allJobsList = {"everydayTotalJob":10,"thriceweekTotalJob":10,"onceweekTotalJob":3,"complexId":"2","building_list":[{"building_id":1,"everyday":"30","thriceweek":"40","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}
            //  executiveList = [{"executive_id":"1","no_of_jobs":19,"executivePendingJobs":19,"actual_jobs":19,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"2","no_of_jobs":22,"executivePendingJobs":22,"actual_jobs":22,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"3","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"4","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"5","no_of_jobs":20,"executivePendingJobs":20,"actual_jobs":20,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}]
             // executiveList = [{"executive_id":"6","no_of_jobs":17,"executivePendingJobs":17,"actual_jobs":17,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"2","no_of_jobs":5,"executivePendingJobs":5,"actual_jobs":5,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"3","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"4","no_of_jobs":10,"executivePendingJobs":10,"actual_jobs":10,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1},{"executive_id":"5","no_of_jobs":30,"executivePendingJobs":30,"actual_jobs":30,"everydayassignedJobList":[],"thriceWeekassignedJobList":[],"onceWeekAssignedJobList":[],"supervisor_id":1,"top_supervisor_id":1}]
           // console.log("buildingList",buildingList)

            } else if(cnt==2){
        //        allJobsList = {"everydayTotalJob":50,"thriceweekTotalJob":45,"onceweekTotalJob":5,"complexId":"3","building_list":[{"building_id":1,"everyday":"30","thriceweek":"40","onceweek":"15","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":31,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":32,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":33,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":34,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":35,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":36,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":37,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":38,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":39,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":40,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]},{"building_id":2,"everyday":"20","thriceweek":"50","onceweek":"10","everydayVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":11,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":12,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":13,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":14,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":15,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":16,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":17,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":18,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":19,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":20,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":21,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":22,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":23,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":24,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":25,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":26,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":27,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":28,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":29,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":30,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":31,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":32,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":33,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":34,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":35,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":36,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":37,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":38,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":39,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":40,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":41,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":42,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":43,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":44,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":45,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":46,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":47,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":48,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":49,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":50,"customer_id":1,"is_car":1,"block_list":""}],"oddOnceWeekVehicleId":[14,15,16],"onceWeekVehicleId":[{"vehicle_id":1,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":2,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":3,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":4,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":5,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":6,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":7,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":8,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":9,"customer_id":1,"is_car":1,"block_list":""},{"vehicle_id":10,"customer_id":1,"is_car":1,"block_list":""}],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[],"everydayPendingJobs":0,"everydayPendingJobsList":[]}]}

            }
           
            //console.log("\n \n \n \n =========================executiveList List"+cnt,executiveList)

           //console.log("\n \n \n \n =====================allJobsList",allJobsList)
            let complexTotalJobList =[{"everydayTotalJob":allJobsList.everydayTotalJob,"thriceweekTotalJob":allJobsList.thriceweekTotalJob,"onceweekTotalJob":allJobsList.onceweekTotalJob}]
            let complexId = allJobsList.complexId
            

            if(allJobsList.building_list.length >0){
                currentExecutiveList = executiveList
                let getQuestionList = async _ => {
                for(let cnt=0;cnt<allJobsList.building_list.length;cnt++) { 
                    assignedBuilding.push({"building_id": allJobsList.building_list[cnt].building_id ,"everydayVehicleId": JSON.stringify(allJobsList.building_list[cnt].everydayVehicleId),"thriceWeekVehicleId": JSON.stringify(allJobsList.building_list[cnt].thriceWeekVehicleId) ,"onceWeekVehicleId": JSON.stringify(allJobsList.building_list[cnt].onceWeekVehicleId) ,    "everydayPendingJobs":0, "everydayPendingJobsList": [],"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[]  })

                    updatedJobList = await this.getAllEveryDayJobReassignment(allJobsList.building_list[cnt],currentExecutiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,buildingList)  
                    complexTotalJobList = updatedJobList.complexTotalJobList  

                    
                  currentExecutiveList =  await this.getExecutiveList(currentExecutiveList,updatedJobList.assignedExecutiveId);
                  // console.log("complexTotalJobList",complexTotalJobList)

                    executiveList = await this.getFinalExecutiveBuildingList(updatedJobList.assignedExecutiveId,executiveList)
                   // console.log("\n \n \n \n \n ================>updatedJobList",JSON.stringify(executiveList))
                   

                   
                    //console.log("updatedJobList",updatedJobList)


                     updatedJobList = await this.getAllThriceWeekJobReassignment(allJobsList.building_list[cnt],currentExecutiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,buildingList)
                     complexTotalJobList = updatedJobList.complexTotalJobList

                     //console.log("updatedJobList 123 =====>",updatedJobList)
                     currentExecutiveList =  await this.getExecutiveList(currentExecutiveList,updatedJobList.assignedExecutiveId);
                     //assignedBuilding[cnt] = updatedJobList.assignedBuilding
                     executiveList =  await this.getFinalExecutiveBuildingList(updatedJobList.assignedExecutiveId,executiveList); 

                    // console.log("executiveList", JSON.stringify(executiveList) )

                     updatedJobList = await this.getAllOnceWeekJobReassignment(allJobsList.building_list[cnt],currentExecutiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,buildingList) 
                    complexTotalJobList = updatedJobList.complexTotalJobList
                     
                     currentExecutiveList =  await this.getExecutiveList(currentExecutiveList,updatedJobList.assignedExecutiveId);
                     //assignedBuilding[cnt] = updatedJobList.assignedBuilding
                     executiveList =  await this.getFinalExecutiveBuildingList(updatedJobList.assignedExecutiveId,executiveList); 
                     buildingList--;
                //     await this.executiveBuildingJobAssignList(executiveList,complexId,allJobsList.building_list[cnt].building_id)

    
                }

            }
            await getQuestionList();   

            console.log("getFinalExecutiveBuildingList"+complexId)
            console.log(" \n \n 1234getFinalExecutiveBuildingList : %O",{...complexTotalJobList[0], "building":updatedJobList.assignedBuilding,"executiveList": JSON.stringify(executiveList) })


           
            let complexIdToassign = await this.getNearestComplexById(complexId,assignedComplexList.join(','),allComplexList)
            assignedComplexList.push(complexId)
             // *!@#*     await this.setBuildingPendingList(complexId,updatedJobList.assignedBuilding)
         //console.log("complexTotalJobList[0]",complexTotalJobList[0])
    // *!@#*     await this.setComplexPendingList({...complexTotalJobList[0]},complexId)

         //console.log(" \n \n \n \n \n getAllExecutiveForScheduling",getAllExecutiveForScheduling)
    //*!@#*     return getAllExecutiveForScheduling;

            await this.setExecutiveJobList(executiveList)
             
            return {"assignedComplexList":assignedComplexList,"complexIdToassign":complexIdToassign,"executiveList":JSON.stringify(executiveList)}
            
        }

    }
    async getNearestComplexById(complexId,assignedComplex,allComplexList){
        let executiveDistance = 10 
        let selectParams = `source_complex_id,destination_complex_id,distance,route_time`,
            // where = ` (source_complex_id = ${complexId} OR destination_complex_id = ${complexId}) `
            //  if(assignedComplex!=''){
            //    where += ` AND source_complex_id NOT IN (${assignedComplex}) AND destination_complex_id NOT IN(${assignedComplex}) `
            //  }
            //  where +=` AND source_complex_id IN (${allComplexList}) AND destination_complex_id IN (${allComplexList})
            //           ORDER BY distance LIMIT 1 `

            where = ` (source_complex_id = ${complexId}) `
            if(assignedComplex!=''){
              where += ` AND destination_complex_id NOT IN(${assignedComplex}) `
            }
            where +=` AND destination_complex_id IN (${allComplexList}) AND distance <= ${executiveDistance}
                     ORDER BY distance LIMIT 1 `
              
        let complexList = await db.select('building_distance_relation'  , selectParams, where )
        if(complexList.length>0) {
            if(complexList[0].source_complex_id == complexId){
                return {"complexId":complexList[0].destination_complex_id,"distance":complexList[0].distance,"route_time":complexList[0].route_time}
            } else {
                return {"complexId": complexList[0].source_complex_id,"distance":complexList[0].distance,"route_time":complexList[0].route_time}
            }
        }

    }
    async setComplexBuildingJobAssignList(buildingList){  
        let sqlJobExecutiveList = []
        let currentSeting = dateHelper.getCurrentTimeStamp()
        let getExecutiveJobList = async _ => { 
            for(let cnt=0;cnt<buildingList.building.length;cnt++){
                //let executivePendingJobs = buildingList[cnt].executivePendingJobs > 0 ? buildingList[cnt].executivePendingJobs :0
                sqlJobExecutiveList.push({"building_id":buildingList.building[cnt].building_id,"complex_id": buildingList.complex_id,"no_of_ed_pending":buildingList.building[cnt].everydayPendingJobs,"no_of_tw_pending":buildingList.building[cnt].thriceWeekPendingJobs,"no_of_ow_pending":buildingList.building[cnt].onceweekPendingJobs,"created_date":currentSeting,"modified_date":currentSeting })
            }
        }
        await getExecutiveJobList()
    } 
    
    async getBuildingExecutiveThresholdSet(building,executiveFullyAssigned,getPendingJobList,lcnt){
         // console.log("getBuildingExecutiveAllocationByThresholdSet building",building) 
      //  console.log("executiveList",executiveList)
      let lastBuilding = 0 , ecnt =0 
      let getExecutiveList = async _ => {
          for(let cnt =0;cnt<getPendingJobList;cnt++){
              //console.log("executiveFullyAssigned[ecnt].onceWeekAssignedJobList[0].executivejobList",executiveFullyAssigned[ecnt].onceWeekAssignedJobList[0])

            //   console.log("========================cnt",cnt)
            //   console.log("========================lcnt",lcnt)

            //   console.log(" \n \n \n \n building[lastBuilding] ==========================",building)
              //console.log("executiveFullyAssigned[ecnt].everydayassignedJobList",executiveFullyAssigned[ecnt].everydayassignedJobList)
              if(typeof building.everydayPendingJobsList === "string"){
                building.everydayPendingJobsList = JSON.parse(building.everydayPendingJobsList).slice(0)
              }
              if(typeof building.thriceWeekPendingJobsList === "string"){
                building.thriceWeekPendingJobsList = JSON.parse(building.thriceWeekPendingJobsList).slice(0)
              }
              if(typeof building.onceweekPendingJobsList === "string"){
                building.onceweekPendingJobsList  = JSON.parse(building.onceweekPendingJobsList).slice(0)
              }

              if(building.everydayPendingJobs!=0 && building.everydayPendingJobsList.length>0){
                  
                  executiveFullyAssigned[ecnt].no_of_jobs = executiveFullyAssigned[ecnt].no_of_jobs - 1
                  executiveFullyAssigned[ecnt].executivePendingJobs = executiveFullyAssigned[ecnt].executivePendingJobs - 1
                  let arrEveryday = building.everydayPendingJobsList[0];
                 // console.log("arrEveryday  =====>" + cnt ,arrEveryday)
                  let flag =0
                   await executiveFullyAssigned[ecnt].everydayassignedJobList.map((item) => { 
                      if('building_id' in item){
                      if(item.building_id == building.building_id){
                        flag=1
                        item.executivejobList.push(arrEveryday)
                      }
                    }
 
                  })
                  if(flag==0){
                      executiveFullyAssigned[ecnt].everydayassignedJobList.push({"building_id":building.building_id,"executivejobList":[arrEveryday]})
                  }
                  
                  //console.log("\n \n \n \n executiveFullyAssigned[ecnt].everydayassignedJobList",executiveFullyAssigned[ecnt].everydayassignedJobList)
                  building.everydayPendingJobsList = building.everydayPendingJobsList.slice(1,building.everydayPendingJobsList.length)
                  building.everydayPendingJobs = building.everydayPendingJobsList.length

                  //console.log(" \n \n \n \n ===========================> building.everydayPendingJobsList",building.everydayPendingJobsList)
                  //console.log(" \n \n ==============> executiveFullyAssigned",executiveFullyAssigned[ecnt])

              } else if(building.thriceWeekPendingJobs != 0 && building.thriceWeekPendingJobsList.length>0){
                 
                  executiveFullyAssigned[ecnt].no_of_jobs = executiveFullyAssigned[ecnt].no_of_jobs - 1
                  executiveFullyAssigned[ecnt].executivePendingJobs = executiveFullyAssigned[ecnt].executivePendingJobs - 1
                  let arrThriceWeek= building.thriceWeekPendingJobsList.slice(0,2);
                 // console.log("arrEveryday arrThriceWeek  =====>" + cnt ,arrThriceWeek)
                  let flag =0
                  await executiveFullyAssigned[ecnt].thriceWeekassignedJobList.map((item) => { 
                    if('building_id' in item){
                        if(item.building_id == building.building_id){
                        flag=1
                        item.executivejobList.push(...arrThriceWeek)
                        }
                   }

                })
                if(flag==0){
                    executiveFullyAssigned[ecnt].thriceWeekassignedJobList.push({"building_id":building.building_id,"executivejobList":[...arrThriceWeek]})                    
                }
                
                  building.thriceWeekPendingJobsList = building.thriceWeekPendingJobsList.slice(2,building.thriceWeekPendingJobsList.length)
                  //console.log(" building.thriceWeekPendingJobs thriceWeekVehicleId", building.thriceWeekVehicleId)
                  building.thriceWeekPendingJobs = building.thriceWeekPendingJobsList.length

              } else if(building.onceweekPendingJobs!=0 && building.onceweekPendingJobsList.length>0){
                 
                  executiveFullyAssigned[ecnt].no_of_jobs = executiveFullyAssigned[ecnt].no_of_jobs - 1
                  executiveFullyAssigned[ecnt].executivePendingJobs = executiveFullyAssigned[ecnt].executivePendingJobs - 1
                  let arrOnceWeek= building.onceweekPendingJobsList.slice(0,6);
                 // console.log("arrEveryday  =====>" + cnt ,arrOnceWeek)
                  let flag =0
                  await executiveFullyAssigned[ecnt].onceWeekAssignedJobList.map((item) => { 
                    if('building_id' in item){
                      if(item.building_id == building.building_id){
                        flag=1
                        item.executivejobList.push(...arrOnceWeek)
                      } 
                    }
 
                  })
                  if(flag==0){
                      executiveFullyAssigned[ecnt].onceWeekAssignedJobList.push({"building_id":building.building_id,"executivejobList":[...arrOnceWeek]})
                  }
                  building.onceweekPendingJobsList = building.onceweekPendingJobsList.slice(6,building.onceweekPendingJobsList.length)
                  building.onceweekPendingJobs = building.onceweekPendingJobsList.length
              }
              ecnt++;
              if(ecnt >= executiveFullyAssigned.length){
                  ecnt = 0
              }

              //console.log(" executiveFullyAssigned ================>",building ) 
              

          }
        }
        await getExecutiveList()

        //   console.log(" \n \n ====================================================== ")

        //   console.log(" Executive ================>",executiveFullyAssigned) 

        //   console.log(" building ==============>",building)
          return {"building":building,"executiveFullyAssigned":executiveFullyAssigned}
      
     // console.log(" thresold ===>  ",executiveJobThreshold * (executiveFullyAssigned.length) )
    }
    async executiveEverydayJob(building,executiveFullyAssigned,lcnt){
        console.log("\n \n =================== lcnt",lcnt)
        console.log(" \n \n building.everydayPendingJobsList.length",building.everydayPendingJobsList.length)
        console.log("executiveFullyAssigned",executiveFullyAssigned)
        let ecnt=0
        //building.everydayPendingJobsList = await JSON.parse(building.everydayPendingJobsList)
        let getBuildingExecutiveList = async _ => {
            for(let cnt=0;cnt<building.everydayPendingJobsList.length;cnt++) {
                console.log("ecnt",ecnt)
                console.log("executiveFullyAssigned",executiveFullyAssigned[ecnt])
                executiveFullyAssigned[ecnt].no_of_jobs = executiveFullyAssigned[ecnt].no_of_jobs - 1
                executiveFullyAssigned[ecnt].executivePendingJobs = executiveFullyAssigned[ecnt].executivePendingJobs - 1
                let arrEveryday = building.everydayPendingJobsList[0];
                console.log("arrEveryday  =====>" + cnt)
                console.log("============ lcnt",lcnt)
                console.log("executiveFullyAssigned[ecnt].everydayassignedJobList[lcnt]",executiveFullyAssigned[ecnt].everydayassignedJobList.length)
                if(( executiveFullyAssigned[ecnt].everydayassignedJobList.length - 1) >=lcnt){
                  executiveFullyAssigned[ecnt].everydayassignedJobList[lcnt].executivejobList.push(arrEveryday)
                } else {
                  executiveFullyAssigned[ecnt].everydayassignedJobList.push({"building_id":building.building_id,"executivejobList":[arrEveryday]})
                }
                building.everydayPendingJobsList = building.everydayPendingJobsList.slice(1,building.everydayPendingJobsList.length)
                ecnt++
            }
      }
      await getBuildingExecutiveList();
      return {"building":building,"executiveFullyAssigned":executiveFullyAssigned}

    }
    async getBuildingDetails(assignedBuilding,allJobsList){
        let cnt = 0;
        allJobsList = await allJobsList.map((item) =>{

            console.log(" ================== thriceWeekVehicleId",item.thriceWeekVehicleId)
            if(item.building_id  == assignedBuilding[cnt].building_id ) {
                assignedBuilding[cnt].everydayVehicleId = JSON.stringify(item.everydayVehicleId)
                assignedBuilding[cnt].thriceWeekVehicleId = JSON.stringify(item.thriceWeekVehicleId)
                assignedBuilding[cnt].onceWeekVehicleId = JSON.stringify(item.onceWeekVehicleId)
            } 
            cnt++
            return assignedBuilding[cnt-1]
                   
        } )
        console.log(" \n \n \n \n \n allJobsList  =======>",allJobsList)
        return;
                
        return allJobsList
    }
    async getAllEveryDayJobAssignment(allJobsListExecutive,executiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,isLastBuilding){
        try {
            
            let assignedExecutiveId=[]  
            //let assignedBuilding=[]  
            let userEveryDaySQL = []  

            //console.log("executiveList getAllEveryDayJobAssignment",executiveList)            


            // let getQuestionList = async _ => {
            //     let cnt = 0
                //for(let cnt=0;cnt<allJobsList.length;cnt++) { 
                    //console.log(" \n \n allJobsList ==> ",allJobsListExecutive)
                    //console.log(" \n \n ============================ \n \n ")
                    let allJobsList = ''
                    let getExecutiveList = async _ => {
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            console.log("getAllEveryDayJobAssignment"+allJobsListExecutive.building_id+ "==========================> "+ecnt)
                            let flag= 0
                            let assignedJobList = []
                            allJobsList = allJobsListExecutive
                            // check whether 
                            //  console.log(" \n \n =================== Before ")
                            //  console.log("allJobsList[cnt].everyday",allJobsList.everyday)
                            //  console.log("executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)
                            //  console.log(" \n  ===================  ")
                            
                            let everyDayBlockList =  await this.getExecutiveBlockJobs(allJobsListExecutive.everydayVehicleId,executiveList[ecnt].executive_id,1)
                              allJobsList.everydayVehicleId = await this.getExecutiveJobs(allJobsListExecutive.everydayVehicleId,executiveList[ecnt].executive_id,1)

                              console.log("1234allJobsList.everydayVehicleId",allJobsList.everydayVehicleId)
                              console.log("everyDayBlockList",everyDayBlockList)
                              allJobsList.everyday =  allJobsList.everydayVehicleId.length;

                             // console.log(" \n \n \n \n ======== allJobsList.everydayVehicleId",allJobsList.everydayVehicleId)

                              console.log(" allJobsList.everyday", allJobsList.everyday)  
                                                         


                             if(allJobsList.everyday!=0 && (complexTotalJobList[0].everydayTotalJob >= executiveList[ecnt].no_of_jobs) ) {
                                 // let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.everyday
                                 // let everydayDeduct = executiveList[ecnt].no_of_jobs - allJobsList.everyday;
                                 let executivePendingJobs = executiveList[ecnt].no_of_jobs
                                 let everydayDeduct = 0;
                                 console.log("isComplex",isComplex)
                                 
                                 console.log(" \n \n \n \n isLastBuilding",isLastBuilding)

                                 console.log(" \n \n allJobsList.everyday",allJobsList.everyday)
                                 if(isComplex==1 && isLastBuilding!=1) { 
                                    executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.everyday
                                    everydayDeduct = allJobsList.everyday;
                                 }
                                if(allJobsList.everyday >= executiveList[ecnt].no_of_jobs) {
                                   // console.log(" in allJobsList",executiveList[ecnt].no_of_jobs )
                                    everydayDeduct = executiveList[ecnt].no_of_jobs 
                                    executivePendingJobs = 0
                                }
                                //console.log("everydayDeduct ==>",everydayDeduct)
                                console.log("everydayDeduct ==>",everydayDeduct)
                                assignedJobList.push({"building_id":allJobsList.building_id,"complexId":complexId,"executivejobList": allJobsList.everydayVehicleId.slice(0,everydayDeduct)})
                                //console.log("assignedJobList =====>",assignedJobList)

            
                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,everydayDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.everydayVehicleId.slice(0,everydayDeduct).toString(),'',1)  
                                allJobsList.everydayVehicleId = allJobsList.everydayVehicleId.slice(everydayDeduct); console.log(" \n \n allJobsList.everydayVehicleId",allJobsList.everydayVehicleId.length)

                                //console.log("allJobsList.everydayVehicleId",allJobsList.everydayVehicleId) 
                               // console.log("allJobsList.everydayVehicleId",allJobsList.everydayVehicleId)
                                allJobsList.everyday = allJobsList.everydayVehicleId.length

                                complexTotalJobList[0].everydayTotalJob = complexTotalJobList[0].everydayTotalJob - everydayDeduct


                                console.log("complexTotalJobList =====================>",complexTotalJobList)
            
                                //  console.log(" \n \n =================== After  ")
                                //  console.log("allJobsList[cnt].everyday",allJobsList.everyday)
                                //  console.log("executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)


                                //console.log(" \n \n executivePendingJobs ======>",executivePendingJobs)
                                //  console.log(" \n  ===================   ")
            
                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs,"everydayassignedJobList":JSON.stringify(assignedJobList) }) 
                                executiveList[ecnt].executivePendingJobs = executivePendingJobs
                                //executiveList[ecnt].actual_jobs = executiveList[ecnt].no_of_jobs
                                executiveList[ecnt].no_of_jobs = executivePendingJobs
                                executiveList[ecnt].everydayassignedJobList.push(assignedJobList[0] )
                              //   console.log("\n \n assignedExecutiveId ============>",assignedExecutiveId)

                                //console.log(" \n \n ====================== everyDayBlockList",everyDayBlockList)
                                if(allJobsList.everyday ==0){
                                    flag = 1
                                    // console.log("assignedExecutiveId inside ==>",assignedExecutiveId)
                                  // break;
                                 }    

                                allJobsListExecutive.everydayVehicleId = everyDayBlockList.concat(allJobsList.everydayVehicleId)
                                allJobsListExecutive.everyday = allJobsListExecutive.everydayVehicleId.length ;
                                allJobsList.everyday = allJobsList.everydayVehicleId.length
                              console.log("\n \n \n \n ==================== 1allJobsListExecutive",allJobsListExecutive.everydayVehicleId)
                             //   console.log("\n \n \n \n ================ allJobsListExecutive.everyday",allJobsListExecutive.everyday)
                             //  console.log(" \n  \n \n assignedExecutiveId =======>",assignedExecutiveId)

                                if(flag == 1){
                                     //return assignedExecutiveId;
                                   //  break
                                }
                                
                                //console.log("userEveryDaySQL",userEveryDaySQL)
            
                            }  else {
                                allJobsListExecutive.everydayVehicleId = everyDayBlockList.concat(allJobsList.everydayVehicleId)
                                allJobsListExecutive.everyday = allJobsListExecutive.everydayVehicleId.length ;
                                allJobsList.everyday = allJobsList.everydayVehicleId.length
                                console.log("\n \n \n \n ==================== 2allJobsListExecutive",allJobsListExecutive.everydayVehicleId)

                                //break ;
                            }
                            
            
                            console.log(" \n \n \n \n  ==============> assignedBuilding"+ecnt,assignedBuilding)
                        }

                       } 
                     await getExecutiveList()                      
                     //assignedBuilding.push({"building_id": allJobsList.building_id  ,  "everydayPendingJobs": allJobsList.everyday,"everydayPendingJobsList": JSON.stringify(allJobsList.everydayVehicleId),"thriceWeekPendingJobs":0,"thriceWeekPendingJobsList":[],"onceweekPendingJobs":0,"onceweekPendingJobsList":[]  })
                     
                     assignedBuilding[cnt].everydayPendingJobs =  allJobsList.everyday ? allJobsList.everyday : 0
                     assignedBuilding[cnt].everydayPendingJobsList = JSON.stringify(allJobsList.everydayVehicleId ? allJobsList.everydayVehicleId : [])
                     //console.log("assignedBuilding",assignedBuilding)
                    // console.log(" =====> assignedExecutiveId",assignedExecutiveId)

                   
     

                     return {"assignedExecutiveId":executiveList,"assignedBuilding":assignedBuilding,"complexTotalJobList":complexTotalJobList};


                    //  assignedBuilding.push({"building_id": allJobsList[cnt].building_id  ,  "everydayPendingJobs": allJobsList[cnt].everyday  })
                    //  console.log("assignedBuilding",assignedBuilding)          
                   // } 
               // }
                //await getQuestionList();
               // console.log("========================>",assignedExecutiveId)
                //return assignedExecutiveId;

                //return {"allJobsList":allJobsList}

        
        } catch (error) {
            return promise.reject(error)
        } 
    } 

    async getAllThriceWeekJobAssignment(allJobsListExecutive,executiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,isLastBuilding){
        try {
            let assignedExecutiveId=[]  
            // let assignedBuilding=[]  
            let userEveryDaySQL = []   

           // console.log("executiveList getAllEveryDayJobAssignment",executiveList)
                    let allJobsList = ''
                    let getExecutiveList = async _ => {
                        //console.log(" \n ============== allJobsList.thriceweek =========> ",allJobsList.thriceweek )
                        allJobsList = allJobsListExecutive
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            console.log("\n \n \n \n getAllThriceWeekJobAssignment "+allJobsList.building_id +" ============================>",ecnt)
                            console.log("============================>",executiveList[ecnt].executive_id)
                            let flag= 0
                            let assignedJobList = []
                            if(ecnt==0){
                              allJobsList.thriceweek = Math.ceil(allJobsList.thriceweek / 2)
                            } 
                              

                            let thriceWeekBlockList =  await this.getExecutiveBlockJobs(allJobsListExecutive.thriceWeekVehicleId,executiveList[ecnt].executive_id,2)
                            allJobsList.thriceWeekVehicleId = await this.getExecutiveJobs(allJobsListExecutive.thriceWeekVehicleId,executiveList[ecnt].executive_id,2)
                            console.log("everyDayBlockList",thriceWeekBlockList)
                            //console.log("thriceWeekVehicleId =====>",allJobsList.thriceWeekVehicleId)
                            console.log("building_id =====>",allJobsList.building_id)
                            allJobsList.thriceweek =  Math.ceil((allJobsList.thriceWeekVehicleId.length) / 2);

                            //console.log("\n =============== allJobsList.thriceweek",allJobsList.thriceweek)
                            //console.log("\n =============== executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs) 

                            console.log(" \n \n \n \n  The thrice Week  ===============>",allJobsList.thriceweek)
                            console.log(" \n executive no of jobs =====================>",executiveList[ecnt].no_of_jobs)

                            
                             if(allJobsList.thriceweek >0 && (complexTotalJobList[0].thriceweekTotalJob >= Math.ceil(executiveList[ecnt].no_of_jobs / 2) ) ) {
                                //let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.thriceweek
                                //let thriceweekDeduct =  allJobsList.thriceweek ;

                                let executivePendingJobs = executiveList[ecnt].no_of_jobs
                                 let thriceweekDeduct = 0;
                                 console.log("isComplex",isComplex)
                                 
                             //    console.log(" \n \n \n \n isLastBuilding",isLastBuilding)

                              //   console.log(" \n \n allJobsList.everyday",allJobsList.thriceweek)
                                 if(isComplex==1 && isLastBuilding!=1) { 
                                    executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.thriceweek
                                    thriceweekDeduct = allJobsList.thriceweek;
                                 }
                                //console.log("thriceweekDeduct =====>",thriceweekDeduct)
                                if(allJobsList.thriceweek >= Math.ceil(executiveList[ecnt].no_of_jobs)) {
                                   // console.log(" in allJobsList",executiveList[ecnt].no_of_jobs )
                                   thriceweekDeduct = executiveList[ecnt].no_of_jobs  
                                    executivePendingJobs = 0
                                }
                                console.log("everydayDeduct ==>",thriceweekDeduct)
                                

                                //let allJobsList = [{"building_id":1,"everyday":"82","thriceweek":"13","onceweek":"10", "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[17,18,19,20,21,22,23]}],

                                assignedJobList.push({"building_id":allJobsList.building_id,"complexId":complexId,"executivejobList": allJobsList.thriceWeekVehicleId.slice(0,thriceweekDeduct * 2) })
                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,thriceweekDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.thriceWeekVehicleId.slice(0,thriceweekDeduct * 2).toString(),'',2)  
                                allJobsList.thriceWeekVehicleId = allJobsList.thriceWeekVehicleId.slice(thriceweekDeduct * 2,allJobsList.thriceWeekVehicleId.length); //console.log("\n ======== allJobsList.thriceWeekVehicleId",allJobsList.thriceWeekVehicleId);
                                complexTotalJobList[0].thriceweekTotalJob = complexTotalJobList[0].thriceweekTotalJob - thriceweekDeduct
                                
                                //console.log("\n ======== allJobsList.thriceWeekVehicleId",allJobsList.thriceWeekVehicleId);
                                
                                //allJobsList.thriceweek = (allJobsList.thriceweek - thriceweekDeduct) > 0 ? (allJobsList.thriceweek - thriceweekDeduct) : 0 
                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs , "thriceWeekassignedJobList":JSON.stringify(assignedJobList) })
                                executiveList[ecnt].no_of_jobs= executivePendingJobs ,
                                executiveList[ecnt].executivePendingJobs= executivePendingJobs ,
                                //executiveList[ecnt].actual_jobs= executiveList[ecnt].actual_jobs ,
                                executiveList[ecnt].thriceWeekassignedJobList.push(assignedJobList[0] ) ,

                                allJobsList.thriceweek = allJobsList.thriceWeekVehicleId.length ;  
                               
                                
                                allJobsListExecutive.thriceWeekVehicleId = thriceWeekBlockList.concat(allJobsList.thriceWeekVehicleId)
                                allJobsListExecutive.thriceweek = Math.ceil(allJobsListExecutive.thriceWeekVehicleId.length / 2 ) ; 
                                allJobsList.thriceweek = allJobsListExecutive.thriceweek ;  
                                
                                //console.log(" \n \n allJobsList.everyday ===============> ",allJobsListExecutive.everyday)

                                console.log(" \n \n \n \n  thrice Week  ===============>",allJobsList.thriceweek)
                                
                                
                                
                                //console.log(" \n \n \n \n  Merge =====> ",allJobsListExecutive.thriceWeekVehicleId)


                                //console.log(" \n \n count =====>",allJobsListExecutive.thriceweek)
                                
                                //console.log("assignedExecutiveId",assignedExecutiveId)
                                //console.log("assignedExecutiveId",assignedExecutiveId)
                                console.log(" \n \n 2 count =====>",allJobsListExecutive.thriceweek)   
                                if(allJobsList.thriceweek == 0){
                                    flag = 1
                                    // break;
                                }
                                if(flag == 1){
                                    //break
                                }                             
            
                            }  else {
                                allJobsListExecutive.thriceWeekVehicleId = thriceWeekBlockList.concat(allJobsList.thriceWeekVehicleId)
                                allJobsListExecutive.thriceweek = Math.ceil(allJobsListExecutive.thriceWeekVehicleId.length / 2 ) ; 
                                allJobsList.thriceweek = allJobsListExecutive.thriceweek ;  
                                //break ;
                            }
            
                        }
                       } 
                       
                       await getExecutiveList() 
                
                     
                    //console.log("assignedBuilding",assignedBuilding)
                     assignedBuilding[cnt].thriceWeekPendingJobs = allJobsListExecutive.thriceweek
                     assignedBuilding[cnt].thriceWeekPendingJobsList = JSON.stringify(allJobsListExecutive.thriceWeekVehicleId) 
                     //console.log("assignedBuilding",assignedBuilding)
                     return {"assignedExecutiveId":executiveList,"assignedBuilding":assignedBuilding,"complexTotalJobList": complexTotalJobList }

        
        } catch (error) {
            return promise.reject(error)
        } 

    } 

    async getAllOnceWeekJobAssignment(allJobsListExecutive,executiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,isLastBuilding){ 
        try {
            let assignedExecutiveId=[]  
           // let assignedBuilding=[]  
            let userEveryDaySQL = []   

           //console.log("getAllOnceWeekJobAssignment executiveList getAllEveryDayJobAssignment",executiveList)
                   
                    let allJobsList = ''
                    let getExecutiveList = async _ => {
                        //console.log(" \n ============== allJobsList.thriceweek =========> ",allJobsList.thriceweek )
                        allJobsList = allJobsListExecutive
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            let flag = 0
                            let assignedJobList = []
                            console.log( " getAllOnceWeekJobAssignment"+ allJobsList.building_id+" ====================================================="+ecnt);
                            if(ecnt==0){
                              allJobsList.onceweek = Math.ceil(allJobsList.onceweek / 6)
                            } 

                            //console.log("\n =============== allJobsList.thriceweek",allJobsList.thriceweek)
                            //console.log("\n =============== executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)

                          //  console.log(" ====> allJobsList.onceweek ====>",allJobsList.onceweek)
                            let onceweekBlockList =  await this.getExecutiveBlockJobs(allJobsListExecutive.onceWeekVehicleId,executiveList[ecnt].executive_id,3)
                              allJobsList.onceWeekVehicleId = await this.getExecutiveJobs(allJobsListExecutive.onceWeekVehicleId,executiveList[ecnt].executive_id,3)
                              console.log("everyDayBlockList",onceweekBlockList)
                              allJobsList.onceweek =  Math.ceil( allJobsList.onceWeekVehicleId.length / 6 );

                              //console.log(" \n \n \n \n ======== allJobsList.onceWeekVehicleId",allJobsList.onceWeekVehicleId)

                              console.log(" allJobsList.everyday", allJobsList.onceweek) 
                            
                             if(allJobsList.onceweek >0 && (complexTotalJobList[0].onceweekTotalJob >= Math.ceil(executiveList[ecnt].no_of_jobs / 6) ) ) {
                                let executivePendingJobs = executiveList[ecnt].no_of_jobs
                                let onceweekDeduct =  0 ;
                                //console.log("onceweekDeduct =====>",onceweekDeduct)

                             //   console.log("===================== allJobsList.onceweek ",allJobsList.onceweek)
                            //    console.log("===================== executiveList[ecnt].no_of_jobs ",executiveList[ecnt].no_of_jobs)

                            //    console.log("====== isLastBuilding",isLastBuilding)
                            //    console.log("isComplex",isComplex)

                                if(isComplex==1 && isLastBuilding!=1) { 
                                    executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.onceweek
                                    onceweekDeduct = allJobsList.onceweek;
                                 }
                                if(allJobsList.onceweek >=  executiveList[ecnt].no_of_jobs ) {
                                   // console.log(" in allJobsList",executiveList[ecnt].no_of_jobs )
                                   onceweekDeduct =  executiveList[ecnt].no_of_jobs 
                                    executivePendingJobs = 0
                                }
                            //    console.log("everydayDeduct ==>",onceweekDeduct)
                               // console.log("allJobsList.onceWeekVehicleId",allJobsList.onceWeekVehicleId.slice(0,onceweekDeduct * 6))


                                //let allJobsList = [{"building_id":1,"everyday":"82","thriceweek":"13","onceweek":"10", "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[17,18,19,20,21,22,23]}],

                              
                                
                                assignedJobList.push({"building_id":allJobsList.building_id,"complexId":complexId,"executivejobList": allJobsList.onceWeekVehicleId.slice(0,onceweekDeduct * 6)})

                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,onceweekDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.onceWeekVehicleId.slice(0,onceweekDeduct * 6).toString(), '',3)  
                                allJobsList.onceWeekVehicleId = allJobsList.onceWeekVehicleId.slice(onceweekDeduct * 6,allJobsList.onceWeekVehicleId.length); //console.log("\n ======== allJobsList.evenThriceWeekVehicleId",allJobsList.evenThriceWeekVehicleId);
                                allJobsList.onceweek = allJobsListExecutive.onceWeekVehicleId.length ; 

                                complexTotalJobList[0].onceweekTotalJob = complexTotalJobList[0].onceweekTotalJob - onceweekDeduct
                                

                                
                               // allJobsList.onceweek = (allJobsList.onceweek - onceweekDeduct) > 0 ? (allJobsList.onceweek - onceweekDeduct) : 0           
            
                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs,"onceWeekAssignedJobList":JSON.stringify(assignedJobList) })
                                executiveList[ecnt].no_of_jobs= executivePendingJobs ,
                                executiveList[ecnt].executivePendingJobs= executivePendingJobs ,
                                //executiveList[ecnt].actual_jobs= executiveList[ecnt].actual_jobs ,
                                executiveList[ecnt].onceWeekAssignedJobList.push(assignedJobList[0] ) 

                                if(allJobsList.onceweek == 0){
                                    flag = 1
                                   // return assignedExecutiveId;
                                  //break;
                                }
                                allJobsListExecutive.onceWeekVehicleId =  onceweekBlockList.concat(allJobsList.onceWeekVehicleId )
                                allJobsListExecutive.onceweek = Math.ceil( allJobsListExecutive.onceWeekVehicleId.length / 6) ;
                                allJobsList.onceweek = allJobsListExecutive.onceweek ;

                                
                                //console.log("\n \n \n \n ==================== allJobsListExecutive",allJobsListExecutive.onceWeekVehicleId)
                                console.log("\n \n \n \n ================ allJobsListExecutive.everyday",allJobsListExecutive.onceweek)
                                //console.log("assignedExecutiveId",assignedExecutiveId)
                                //console.log("assignedExecutiveId",assignedExecutiveId)
                                if(flag == 1){
                                    //return assignedExecutiveId;
                                  // break
                               }

            
                            }  else {
                                allJobsListExecutive.onceWeekVehicleId =  onceweekBlockList.concat(allJobsList.onceWeekVehicleId)
                                allJobsListExecutive.onceweek = Math.ceil( allJobsListExecutive.onceWeekVehicleId.length / 6) ;
                                allJobsList.onceweek = allJobsListExecutive.onceweek ;
                                //break ;
                            }
            
                        }
                       } 
                     await getExecutiveList()  
                     
                     assignedBuilding[cnt].onceweekPendingJobs = allJobsList.onceweek
                     assignedBuilding[cnt].onceweekPendingJobsList = JSON.stringify(allJobsList.onceWeekVehicleId)                     
                     //console.log("assignedBuilding",assignedBuilding)
                     return {"assignedExecutiveId":executiveList,"assignedBuilding":assignedBuilding ,"complexTotalJobList": complexTotalJobList };

        
        } catch (error) {
            return promise.reject(error)
        }

    }




   async getAllEveryDayJobReassignment(allJobsListExecutive,executiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,isLastBuilding){
        try { 
            let assignedExecutiveId=[]  
            //let assignedBuilding=[]  
            let userEveryDaySQL = []  
           // console.log("getAllEveryDayJobReassignment========>executiveList",executiveList)

           console.log("getAllEveryDayJobReassignment",allJobsListExecutive)

                    let allJobsList = ''
                    let getExecutiveList = async _ => {
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            console.log("getAllEveryDayJobReassignment"+allJobsListExecutive.building_id+ "==========================> "+ecnt)
                            let flag= 0
                            let assignedJobList = []
                            if(typeof allJobsListExecutive.everydayVehicleId == 'string'){ 
                                allJobsListExecutive.everydayVehicleId = JSON.parse(allJobsListExecutive.everydayVehicleId)
                            } 
                            if(typeof allJobsListExecutive.everydayPendingJobsList == 'string') {
                                allJobsListExecutive.everydayPendingJobsList = JSON.parse(allJobsListExecutive.everydayPendingJobsList)
                            }
                            allJobsList = allJobsListExecutive
                            // check whether 
                            //  console.log(" \n \n =================== Before ")
                            //  console.log("allJobsList[cnt].everyday",allJobsList.everyday)
                            //  console.log("executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)
                            //  console.log(" \n  ===================  ")
                            
                            let everyDayBlockList =  await this.getExecutiveBlockJobs(allJobsListExecutive.everydayVehicleId,executiveList[ecnt].executive_id,1)
                              allJobsList.everydayVehicleId = await this.getExecutiveJobs(allJobsListExecutive.everydayVehicleId,executiveList[ecnt].executive_id,1)
                            //  console.log("everyDayBlockList",everyDayBlockList)
                              allJobsList.everyday =  allJobsList.everydayVehicleId.length;


                              

                              console.log("executive_id",executiveList[ecnt].executive_id)

                              console.log("1234everyDayBlockList",everyDayBlockList)
                             

                             // console.log(" \n \n \n \n ======== allJobsList.everydayVehicleId",allJobsList.everydayVehicleId)

                              console.log(" allJobsList.everyday", allJobsList.everyday)  


                              if(complexId == 2){

                              //  console.log(" \n \n \n \n Executive List",executiveList[ecnt])
                              }
                                                         


                             if(allJobsList.everyday!=0) {
                                 // let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.everyday
                                 // let everydayDeduct = executiveList[ecnt].no_of_jobs - allJobsList.everyday;
                                 let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.everyday
                                 let everydayDeduct = allJobsList.everyday;
                                 console.log("isComplex",isComplex)
                                 

                              //   console.log("executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)
                              //   console.log(" \n \n \n \n isLastBuilding",isLastBuilding)

                              //   console.log(" \n \n allJobsList.everyday",allJobsList.everyday)
                                 if(allJobsList.everyday >= executiveList[ecnt].no_of_jobs) {
                                    executivePendingJobs = 0
                                    everydayDeduct = executiveList[ecnt].no_of_jobs;
                                    
                                 }
                                //console.log("everydayDeduct ==>",everydayDeduct)
                                console.log("everydayDeduct ==>",everydayDeduct)
                                
                                assignedJobList.push({"building_id":allJobsList.building_id,"complexId":complexId,"executivejobList": allJobsList.everydayVehicleId.slice(0,everydayDeduct)})
                                //console.log("assignedJobList =====>",assignedJobList)
            
                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,everydayDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.everydayVehicleId.slice(0,everydayDeduct).toString(),'',1)  
                                allJobsList.everydayVehicleId = allJobsList.everydayVehicleId.slice(everydayDeduct); console.log(" \n \n allJobsList.everydayVehicleId",allJobsList.everydayVehicleId.length)
                               
                                allJobsList.everyday = allJobsList.everydayVehicleId.length

                                complexTotalJobList[0].everydayTotalJob = complexTotalJobList[0].everydayTotalJob - everydayDeduct
            
                              
            
                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs,"everydayassignedJobList":JSON.stringify(assignedJobList) }) 
                                executiveList[ecnt].executivePendingJobs = executivePendingJobs
                                //executiveList[ecnt].actual_jobs = executiveList[ecnt].no_of_jobs
                                executiveList[ecnt].no_of_jobs = executivePendingJobs
                                //console.log(" \n \n \n \n =========assignedJobList",assignedJobList[0])

                                console.log("\n \n \n \n 1234assignedJobList",assignedJobList[0])
                                executiveList[ecnt].everydayassignedJobList.push(assignedJobList[0] )
                                //console.log("\n \n assignedExecutiveId ============>",assignedExecutiveId)

                                //console.log(" \n \n ====================== everyDayBlockList",everyDayBlockList)
                                if(allJobsList.everyday ==0){
                                    flag = 1
                                   
                                 }    

                                allJobsListExecutive.everydayVehicleId = everyDayBlockList.concat(allJobsList.everydayVehicleId)
                                allJobsListExecutive.everyday = allJobsListExecutive.everydayVehicleId.length ;
                                allJobsList.everyday = allJobsList.everydayVehicleId.length
                              

                                if(flag == 1){
                                     //return assignedExecutiveId;
                                   //  break
                                } 

                                
                                
 


                                //console.log("userEveryDaySQL",userEveryDaySQL)
            
                            }  else {
                                allJobsListExecutive.everydayVehicleId = everyDayBlockList.concat(allJobsList.everydayVehicleId)
                                allJobsListExecutive.everyday = allJobsListExecutive.everydayVehicleId.length ;
                                allJobsList.everyday = allJobsList.everydayVehicleId.length
                                //break ;
                            }
                            
            
                        //    console.log("allJobsList.everydayVehicleId"+ecnt,allJobsList.everydayVehicleId)
                        }
                       } 
                     await getExecutiveList()                      
                     
                     assignedBuilding[cnt].everydayPendingJobs =  allJobsList.everyday ? allJobsList.everyday : 0
                     assignedBuilding[cnt].everydayPendingJobsList = JSON.stringify(allJobsList.everydayVehicleId ? allJobsList.everydayVehicleId : [])



 
                     return {"assignedExecutiveId":executiveList,"assignedBuilding":assignedBuilding,"complexTotalJobList":complexTotalJobList};

    
                   // } 
               // }
                //await getQuestionList();
               // console.log("========================>",assignedExecutiveId)
                //return assignedExecutiveId;

                //return {"allJobsList":allJobsList}

        
        } catch (error) {
            return promise.reject(error)
        } 
    } 

    async getAllThriceWeekJobReassignment(allJobsListExecutive,executiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,isLastBuilding){
        try {
            let assignedExecutiveId=[]  
            // let assignedBuilding=[]  
            let userEveryDaySQL = []   

           // console.log("executiveList getAllEveryDayJobAssignment",executiveList)
                    let allJobsList = ''
                    let getExecutiveList = async _ => {
                        //console.log(" \n ============== allJobsList.thriceweek =========> ",allJobsList.thriceweek )
                        allJobsList = allJobsListExecutive
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            console.log("\n \n \n \n getAllThriceWeekJobAssignment "+allJobsList.building_id +" ============================>",ecnt)
                            console.log("============================>",executiveList[ecnt].executive_id)
                            let flag= 0
                            let assignedJobList = []
                            if(ecnt==0){
                              allJobsList.thriceweek = Math.ceil(allJobsList.thriceweek / 2)
                            } 
                              

                            let thriceWeekBlockList =  await this.getExecutiveBlockJobs(allJobsListExecutive.thriceWeekVehicleId,executiveList[ecnt].executive_id,2)
                            allJobsList.thriceWeekVehicleId = await this.getExecutiveJobs(allJobsListExecutive.thriceWeekVehicleId,executiveList[ecnt].executive_id,2)
                            console.log("everyDayBlockList",thriceWeekBlockList)
                            //console.log("thriceWeekVehicleId =====>",allJobsList.thriceWeekVehicleId)
                            console.log("building_id =====>",allJobsList.building_id)

                            console.log("allJobsList.thriceWeekVehicleId",allJobsList.thriceWeekVehicleId)
                            allJobsList.thriceweek =  Math.ceil((allJobsList.thriceWeekVehicleId.length) / 2);

                            //console.log("\n =============== allJobsList.thriceweek",allJobsList.thriceweek)
                            //console.log("\n =============== executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs) 

                        //    console.log(" \n \n \n \n  The thrice Week  ===============>",allJobsList.thriceweek)
                        //    console.log(" \n executive no of jobs =====================>",executiveList[ecnt].no_of_jobs)

                            
                             if(allJobsList.thriceweek >0) {
                                //let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.thriceweek
                                //let thriceweekDeduct =  allJobsList.thriceweek ;

                                let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.thriceweek
                                 let thriceweekDeduct = allJobsList.thriceweek ;
                                 
                                //  if(isComplex==1 && isLastBuilding!=1) { 
                                //     executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.thriceweek
                                //     thriceweekDeduct = allJobsList.thriceweek;
                                //  }
                                //console.log("thriceweekDeduct =====>",thriceweekDeduct)
                                 if(allJobsList.thriceweek >= executiveList[ecnt].no_of_jobs) {
                                    // console.log(" in allJobsList",executiveList[ecnt].no_of_jobs )
                                    executivePendingJobs = 0
                                    thriceweekDeduct = allJobsList.no_of_jobs;
                                 }
                                console.log("everydayDeduct ==>",thriceweekDeduct)
                                

                                assignedJobList.push({"building_id":allJobsList.building_id,"complexId":complexId,"executivejobList": allJobsList.thriceWeekVehicleId.slice(0,thriceweekDeduct * 2) })
                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,thriceweekDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.thriceWeekVehicleId.slice(0,thriceweekDeduct * 2).toString(),'',2)  
                                allJobsList.thriceWeekVehicleId = allJobsList.thriceWeekVehicleId.slice(thriceweekDeduct * 2,allJobsList.thriceWeekVehicleId.length); //console.log("\n ======== allJobsList.thriceWeekVehicleId",allJobsList.thriceWeekVehicleId);
                                complexTotalJobList[0].thriceweekTotalJob = complexTotalJobList[0].thriceweekTotalJob - thriceweekDeduct
                                

                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs , "thriceWeekassignedJobList":JSON.stringify(assignedJobList) })
                                executiveList[ecnt].no_of_jobs= executivePendingJobs ,
                                executiveList[ecnt].executivePendingJobs= executivePendingJobs ,
                                //executiveList[ecnt].actual_jobs= executiveList[ecnt].actual_jobs ,
                                executiveList[ecnt].thriceWeekassignedJobList.push(assignedJobList[0] ) ,

                                allJobsList.thriceweek = allJobsList.thriceWeekVehicleId.length ;  
                               
                                
                                allJobsListExecutive.thriceWeekVehicleId = thriceWeekBlockList.concat(allJobsList.thriceWeekVehicleId)
                                allJobsListExecutive.thriceweek = Math.ceil(allJobsListExecutive.thriceWeekVehicleId.length / 2 ) ; 
                                allJobsList.thriceweek = allJobsListExecutive.thriceweek ;  
                                
                                //console.log(" \n \n allJobsList.everyday ===============> ",allJobsListExecutive.everyday)

                            //    console.log(" \n \n \n \n  thrice Week  ===============>",allJobsList.thriceweek)
                                
                                
                                console.log(" \n \n 2 count =====>",allJobsListExecutive.thriceweek)   
                                if(allJobsList.thriceweek == 0){
                                    flag = 1
                                    // break;
                                }
                                if(flag == 1){
                                    //break
                                }                             
            
                            }  else {
                                allJobsListExecutive.thriceWeekVehicleId = thriceWeekBlockList.concat(allJobsList.thriceWeekVehicleId)
                                allJobsListExecutive.thriceweek = Math.ceil(allJobsListExecutive.thriceWeekVehicleId.length / 2 ) ; 
                                allJobsList.thriceweek = allJobsListExecutive.thriceweek ;  
                                //break ;
                            }
            
                        }
                       } 
                       
                       await getExecutiveList() 
                
                     
                    //console.log("assignedBuilding",assignedBuilding)
                     assignedBuilding[cnt].thriceWeekPendingJobs = allJobsListExecutive.thriceweek
                     assignedBuilding[cnt].thriceWeekPendingJobsList = JSON.stringify(allJobsListExecutive.thriceWeekVehicleId) 
                     //console.log("assignedBuilding",assignedBuilding)
                     return {"assignedExecutiveId":executiveList,"assignedBuilding":assignedBuilding,"complexTotalJobList": complexTotalJobList }

        
        } catch (error) {
            return promise.reject(error)
        } 

    } 

    async getAllOnceWeekJobReassignment(allJobsListExecutive,executiveList,assignedBuilding,cnt,complexId,complexTotalJobList,isComplex,isLastBuilding){ 
        try {
            let assignedExecutiveId=[]  
           // let assignedBuilding=[]  
            let userEveryDaySQL = []   

           //console.log("getAllOnceWeekJobAssignment executiveList getAllEveryDayJobAssignment",executiveList)
                   
                    let allJobsList = ''
                    let getExecutiveList = async _ => {
                        //console.log(" \n ============== allJobsList.thriceweek =========> ",allJobsList.thriceweek )
                        allJobsList = allJobsListExecutive
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            let flag = 0
                            let assignedJobList = []
                            console.log( " getAllOnceWeekJobAssignment"+ allJobsList.building_id+" ====================================================="+ecnt);
                            if(ecnt==0){
                              allJobsList.onceweek = Math.ceil(allJobsList.onceweek / 6)
                            } 

                            //console.log("\n =============== allJobsList.thriceweek",allJobsList.thriceweek)
                            //console.log("\n =============== executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)

                            console.log(" ====> allJobsList.onceweek ====>",allJobsList.onceweek)
                            let onceweekBlockList =  await this.getExecutiveBlockJobs(allJobsListExecutive.onceWeekVehicleId,executiveList[ecnt].executive_id,3)
                              allJobsList.onceWeekVehicleId = await this.getExecutiveJobs(allJobsListExecutive.onceWeekVehicleId,executiveList[ecnt].executive_id,3)
                              console.log("everyDayBlockList",onceweekBlockList)
                              allJobsList.onceweek =  Math.ceil( allJobsList.onceWeekVehicleId.length / 6 );

                              //console.log(" \n \n \n \n ======== allJobsList.onceWeekVehicleId",allJobsList.onceWeekVehicleId)

                              console.log(" allJobsList.everyday", allJobsList.onceweek) 
                            
                             if(allJobsList.onceweek >0) {
                                let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.onceweek
                                let onceweekDeduct =  allJobsList.onceweek ;
                                //console.log("onceweekDeduct =====>",onceweekDeduct)

                            //    console.log("===================== allJobsList.onceweek ",allJobsList.onceweek)
                           //     console.log("===================== executiveList[ecnt].no_of_jobs ",executiveList[ecnt].no_of_jobs)

                            //    console.log("====== isLastBuilding",isLastBuilding)
                            //    console.log("isComplex",isComplex)

                                // if(isComplex==1 && isLastBuilding!=1) { 
                                //     executivePendingJobs = allJobsList.onceweek - executiveList[ecnt].no_of_jobs 
                                //     onceweekDeduct =  executiveList[ecnt].no_of_jobs ;
                                //  }
                                 if(allJobsList.onceweek >=  executiveList[ecnt].no_of_jobs ) {
                                    // console.log(" in allJobsList",executiveList[ecnt].no_of_jobs )
                                    executivePendingJobs = 0 
                                    onceweekDeduct =  executiveList[ecnt].no_of_jobs ;
                                 }
                                console.log("everydayDeduct ==>",onceweekDeduct)
                               // console.log("allJobsList.onceWeekVehicleId",allJobsList.onceWeekVehicleId.slice(0,onceweekDeduct * 6))


                                //let allJobsList = [{"building_id":1,"everyday":"82","thriceweek":"13","onceweek":"10", "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[17,18,19,20,21,22,23]}],

                              
                                
                                assignedJobList.push({"building_id":allJobsList.building_id,"complexId":complexId,"executivejobList": allJobsList.onceWeekVehicleId.slice(0,onceweekDeduct * 6)})

                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,onceweekDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.onceWeekVehicleId.slice(0,onceweekDeduct * 6).toString(), '',3)  
                                allJobsList.onceWeekVehicleId = allJobsList.onceWeekVehicleId.slice(onceweekDeduct * 6,allJobsList.onceWeekVehicleId.length); //console.log("\n ======== allJobsList.evenThriceWeekVehicleId",allJobsList.evenThriceWeekVehicleId);
                                allJobsList.onceweek = allJobsListExecutive.onceWeekVehicleId.length ; 

                                complexTotalJobList[0].onceweekTotalJob = complexTotalJobList[0].onceweekTotalJob - onceweekDeduct
                                
            
                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs,"onceWeekAssignedJobList":JSON.stringify(assignedJobList) })
                                executiveList[ecnt].no_of_jobs= executivePendingJobs ,
                                executiveList[ecnt].executivePendingJobs= executivePendingJobs ,
                                //executiveList[ecnt].actual_jobs= executiveList[ecnt].actual_jobs ,
                                executiveList[ecnt].onceWeekAssignedJobList.push(assignedJobList[0] ) 

                                if(allJobsList.onceweek == 0){
                                    flag = 1
                                   // return assignedExecutiveId;
                                  //break;
                                }
                                allJobsListExecutive.onceWeekVehicleId =  onceweekBlockList.concat(allJobsList.onceWeekVehicleId )
                                allJobsListExecutive.onceweek = Math.ceil( allJobsListExecutive.onceWeekVehicleId.length / 6) ;
                                allJobsList.onceweek = allJobsListExecutive.onceweek ;

                                
                         //       console.log("\n \n \n \n ================ allJobsListExecutive.everyday",allJobsListExecutive.onceweek)

                                if(flag == 1){
                                    //return assignedExecutiveId;
                                  // break
                               }

            
                            }  else {
                                allJobsListExecutive.onceWeekVehicleId =  onceweekBlockList.concat(allJobsList.onceWeekVehicleId)
                                allJobsListExecutive.onceweek = Math.ceil( allJobsListExecutive.onceWeekVehicleId.length / 6) ;
                                allJobsList.onceweek = allJobsListExecutive.onceweek ;
                                //break ;
                            }
            
                        }
                       } 
                     await getExecutiveList()  
                     
                     assignedBuilding[cnt].onceweekPendingJobs = allJobsList.onceweek
                     assignedBuilding[cnt].onceweekPendingJobsList = JSON.stringify(allJobsList.onceWeekVehicleId)                     
                     //console.log("assignedBuilding",assignedBuilding)
                     return {"assignedExecutiveId":executiveList,"assignedBuilding":assignedBuilding ,"complexTotalJobList": complexTotalJobList };

        
        } catch (error) {
            return promise.reject(error)
        }

    }
    
    
    
    async getExecutiveJobs(allJobsList,executive_id,type){
     //   return allJobsList;
     if(typeof allJobsList == "string"){
         allJobsList = JSON.parse(allJobsList)
     }
        if(type == 1 || type ==2 || type==3 ){
        return allJobsList.filter(function(list) {
            //console.log("list.block_list.split(',')",list.block_list.split(','))
            if(type == 1 || type==2 || type==3 ) {
                if(list.block_list.split(',').indexOf(JSON.stringify(executive_id)) == -1){
                return list            
                }
            }
           })
        }

    }
    async getExecutiveBlockJobs(allJobsList,executive_id,type){
      //  return []

      console.log("allJobsList",allJobsList)
       if(typeof allJobsList == "string"){
           allJobsList = JSON.parse(allJobsList)
       }
        if(type == 1 || type == 2 || type ==3){
        return allJobsList.filter(function(list) {
            //console.log("list.block_list.split(',')",list.block_list.split(','))

            if(type ==2){
                console.log("list.block_list.split(',').indexOf(executive_id )",list.block_list.split(',').indexOf(JSON.stringify(executive_id) ))
            }
            if(type == 1 || type == 2 || type ==3) {
               if(list.block_list.split(',').indexOf(JSON.stringify(executive_id) ) != -1){
                return list            
                }
            }
           })
        }

    }
    

    async updateUserFlag(user_id, flag) {
        try {
            let where = ` id=${user_id} `,
                data = {
                    is_active: flag,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            let result = await db.update('users', where, data)
            if (result.rowCount === 0) {
                throw 'USER_WITH_ID_NOT_FOUND'
            } else {
                if (!flag) {
                    let where = `user_id=${user_id}`
                    db.delete('user_auth_relation', where)
                }
                return true
            }
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }
}

module.exports = new UserScheduleHelper()