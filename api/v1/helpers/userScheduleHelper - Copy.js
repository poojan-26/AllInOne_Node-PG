const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

class UserScheduleHelper {
    async getUserVehicleWashList(body) {
        try {
            let getUserUpcommingWashListExterior = await this.getUserUpcommingWashListExterior(body)
            let getUserUpcommingWashListInterior = await this.getUserUpcommingWashListInterior(body)
            let getUserPreviousWashListExterior = await this.getUserPreviousWashListExterior(body)
            let getUserPreviousWashListInterior = await this.getUserPreviousWashListInterior(body)
            return {userExteriorWashDetail:getUserUpcommingWashListExterior,userInteriorWashDetail:getUserUpcommingWashListInterior,userPreviuosExteriorWashDetail:getUserPreviousWashListExterior,userPreviousInteriorWashDetail:getUserPreviousWashListInterior}
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleWashHistoryList(body) {
        try { 

            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name
                                ELSE bb.brand_name
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name
                                ELSE bm.model_name
                                END model_name  ,
                                ct.type_name ,wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name,cvr.vehicle_image,ticket_id`,
                where = ` aw.customer_id = ${body.user_id} AND aw.is_completed = 1 ORDER BY aw.created_date DESC `,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.car_brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.car_model_id = cvr.vehicle_model  
                         LEFT JOIN car_type ct ON ct.car_type_id = cvr.vehicle_type 
                         LEFT JOIN bike_brand bb ON bb.bike_brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.bike_model_id = cvr.vehicle_model 
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  ` ;
             let pagination = ''
             if('vehicle_wash_id' in body) {
                where = ` aw.customer_id = ${body.user_id} AND aw.is_completed = 1 AND aw.vehicle_wash_id = ${body.vehicle_wash_id}`
             } else {
                pagination = ` LIMIT ${Number(config.paginationCount)} OFFSET ${Number(config.paginationCount) * (Number(body.page_no) - 1)}`
             }
               
          let userScheduleHistory = await db.select('vehicle_wash_active_week aw' + join , selectParams, where + pagination)
          return userScheduleHistory;
            
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleWashDetail(body) {
        try { 
          let userVehicleWashDetail = await this.getUserVehicleWashHistoryList(body);
          let getUserVehicleWashImagePreService = await this.getUserVehicleWashImageByType(body,1);
          let getUserVehicleWashImagePostService = await this.getUserVehicleWashImageByType(body,2);
          let getUserVehicleWashPromotionalService = await this.getUserVehicleWashPromotionImage(body);
          return {userVehicleWashDetail:userVehicleWashDetail,userVehicleWashImagePreService:(getUserVehicleWashImagePreService.length >0)?getUserVehicleWashImagePreService[0].vehicle_wash_picture_path.split(","):[] ,userVehicleWashImagePostService: (getUserVehicleWashImagePostService.length >0)?getUserVehicleWashImagePostService[0].vehicle_wash_picture_path.split(","):[] ,userVehicleWashPromotionalService: (getUserVehicleWashPromotionalService.length >0)?getUserVehicleWashPromotionalService[0].vehicle_promotional_picture_path.split(","):[]};
            
        } catch (error) {
            return promise.reject(error)
        }
    } 

    async getUserVehicleWashImageByType(body,type) {
        try { 
              let selectParams = `array_to_string(array_agg(vehicle_wash_picture_path),',') vehicle_wash_picture_path  ` ,
                  where = ` vehicle_wash_picture_type = ${type} AND vehicle_wash_id = ${body.vehicle_wash_id} GROUP BY vehicle_wash_id`            
               
          let userVehicleWashImage = await db.select('vehicle_wash_picture_relation' , selectParams, where )
          if(userVehicleWashImage.length>0){
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
              let selectParams = `array_to_string(array_agg(vehicle_promotional_picture_path),',') vehicle_promotional_picture_path  ` ,
                  where = `  vehicle_wash_id = ${body.vehicle_wash_id} AND is_completed = 1 GROUP BY vehicle_wash_id`            
               
          let userVehicleWashImage = await db.select('customer_promotional_relation' , selectParams, where )
          if(userVehicleWashImage.length>0){
            return userVehicleWashImage;
          } else {
              return [];
          }
            
        } catch (error) {
            return promise.reject(error)
        }
    } 
    async getUserUpcommingWashListExterior(body) {
        try {
            let currentSeting = dateHelper.getFormattedDate();
            console.log("currentSeting",currentSeting)
            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name
                                ELSE bb.brand_name
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name
                                ELSE bm.model_name
                                END model_name  ,
                                ct.type_name ,wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name, cvr.vehicle_image,ticket_id`,
                where = ` aw.customer_id = ${body.user_id} AND  vehicle_wash_date >= '${currentSeting}' AND aw.wash_type = 0 AND aw.is_completed = 0 ORDER BY vehicle_wash_id LIMIT 1`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.car_brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.car_model_id = cvr.vehicle_model  
                         LEFT JOIN car_type ct ON ct.car_type_id = cvr.vehicle_type 
                         LEFT JOIN bike_brand bb ON bb.bike_brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.bike_model_id = cvr.vehicle_model 
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  ` 
         
            let usersVehicleWashList = await db.select('vehicle_wash_active_week aw' + join, selectParams, where )
            return usersVehicleWashList
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserUpcommingWashListInterior(body) {
        try {
            let currentSeting = dateHelper.getFormattedDate();
            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name
                                ELSE bb.brand_name
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name
                                ELSE bm.model_name
                                END model_name  ,
                                ct.type_name ,wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name,cvr.vehicle_image,ticket_id`,
                where = ` aw.customer_id = ${body.user_id} AND  vehicle_wash_date >= '${currentSeting}' AND aw.wash_type = 1 AND aw.is_completed = 0 ORDER BY vehicle_wash_id LIMIT 1`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.car_brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.car_model_id = cvr.vehicle_model  
                         LEFT JOIN car_type ct ON ct.car_type_id = cvr.vehicle_type 
                         LEFT JOIN bike_brand bb ON bb.bike_brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.bike_model_id = cvr.vehicle_model 
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  ` 
         
            let usersVehicleWashList = await db.select('vehicle_wash_active_week aw' + join, selectParams, where )
            return usersVehicleWashList
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserPreviousWashListExterior(body) {
        try {
            let currentSeting = dateHelper.getFormattedDate();
            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name
                                ELSE bb.brand_name
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name
                                ELSE bm.model_name
                                END model_name  ,
                                ct.type_name ,wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name,cvr.vehicle_image,ticket_id`,
                where = ` aw.customer_id = ${body.user_id} AND  vehicle_wash_date <= '${currentSeting}' AND aw.wash_type = 0 AND aw.is_completed = 1 ORDER BY vehicle_wash_id DESC LIMIT 1`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.car_brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.car_model_id = cvr.vehicle_model  
                         LEFT JOIN car_type ct ON ct.car_type_id = cvr.vehicle_type 
                         LEFT JOIN bike_brand bb ON bb.bike_brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.bike_model_id = cvr.vehicle_model 
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  ` 
         
            let usersVehicleWashList = await db.select('vehicle_wash_active_week aw' + join, selectParams, where )
            return usersVehicleWashList
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserPreviousWashListInterior(body) {
        try {
            let currentSeting = dateHelper.getFormattedDate();
            let selectParams = `aw.vehicle_id,aw.is_car,
                                CASE aw.is_car
                                WHEN 1 THEN cb.brand_name
                                ELSE bb.brand_name
                                END brand_name, 
                                CASE aw.is_car
                                WHEN 1 THEN cm.model_name
                                ELSE bm.model_name
                                END model_name  ,
                                ct.type_name ,wash_type,is_completed,has_reviewed,cvr.vehicle_number,color_name,cvr.vehicle_image,ticket_id`,
                where = ` aw.customer_id = ${body.user_id} AND  vehicle_wash_date <= '${currentSeting}' AND aw.wash_type = 1 AND aw.is_completed = 1 ORDER BY vehicle_wash_id DESC LIMIT 1`,
                join = ` LEFT JOIN customer_vehicle_relation cvr ON cvr.vehicle_relation_id = aw.vehicle_id
                         LEFT JOIN car_brand cb ON cb.car_brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.car_model_id = cvr.vehicle_model  
                         LEFT JOIN car_type ct ON ct.car_type_id = cvr.vehicle_type 
                         LEFT JOIN bike_brand bb ON bb.bike_brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.bike_model_id = cvr.vehicle_model 
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color  ` 
         
            let usersVehicleWashList = await db.select('vehicle_wash_active_week aw' + join, selectParams, where )
            return usersVehicleWashList
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getUserSummary(body) {
        try {
            let getUserLocation = await this.getUserLocation(body)
            let getUserVehiclePlan = await this.getUserVehiclePlan(body)
            let getUserVehicleDuration = await this.getUserVehicleDuration(body)
            body.customer_subscription_id = getUserVehicleDuration[0].customer_subscription_relation_id
            let getUserVehiclePromotion = await this.getUserVehiclePromotion(body)
            getUserVehicleDuration.promotionList = getUserVehiclePromotion;
            let getUserVehicleList = await this.getUserVehicleList(body)

            return {userLocation:getUserLocation,userVehiclePlan:getUserVehiclePlan,userVehicleDuration:getUserVehicleDuration,userVehicleList:getUserVehicleList}
        } catch (error) {
            return promise.reject(error)
        }
    }
    
    async getUserLocation(body) {
        try {
            let selectParams = `location,latitude,longitude`,
                where = ` customer_id = ${body.user_id} `         
            let userDetail = await db.select('customer' , selectParams, where )
            return userDetail
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehiclePlan(body) {
        try {
            let vehicle_id = body.vehicle_id.split(',')
            let selectParams = `customer_subscription_relation.subscription_plan_id,subscription_plan,subscription_details`,
                where = ` vehicle_id = ${vehicle_id[0]} ` ,
                join = ` LEFT JOIN mst_subscription_plan ON mst_subscription_plan.subscription_plan_id = customer_subscription_relation.subscription_plan_id`        
            let userSubscriptionPlan = await db.select('customer_subscription_relation' + join , selectParams, where )
            return userSubscriptionPlan
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehicleDuration(body) {
        try {
            let vehicle_id = body.vehicle_id.split(',')
            let selectParams = `customer_subscription_relation.subscription_plan_duration_id,duration_title,customer_subscription_relation_id`,
                where = ` vehicle_id = ${vehicle_id[0]} AND customer_subscription_relation.customer_id = ${body.user_id} ` ,
                join = ` LEFT JOIN mst_subscription_plan_duration ON mst_subscription_plan_duration.subscription_plan_duration_id = customer_subscription_relation.subscription_plan_duration_id`        
            let userDuration = await db.select('customer_subscription_relation' + join , selectParams, where )
            return userDuration
        } catch (error) {
            return promise.reject(error)
        }
    }
    async getUserVehiclePromotion(body) {
        try {
            let selectParams = `promotional_text`,
                where = ` customer_subscription_id = ${body.customer_subscription_id} ` ,
                join = ` LEFT JOIN mst_promotional ON mst_promotional.promotional_id = customer_promotional_relation.promotional_id  `        
            let userDuration = await db.select('customer_promotional_relation' + join , selectParams, where )
            return userDuration
        } catch (error) {
            return promise.reject(error)
        }
    }
    
    async getUserVehicleList(body) {
        try {
            let selectParams = `color_name,cvr.is_car,
                                CASE cvr.is_car
                                WHEN 1 THEN cb.brand_name
                                ELSE bb.brand_name
                                END brand_name, 
                                CASE cvr.is_car
                                WHEN 1 THEN cm.model_name
                                ELSE bm.model_name
                                END model_name  ,
                                ct.type_name ,cvr.vehicle_number,cvr.vehicle_image`,
                where = ` cvr.vehicle_relation_id IN (${body.vehicle_id}) `,
                join = ` LEFT JOIN car_brand cb ON cb.car_brand_id = cvr.vehicle_brand   
                         LEFT JOIN car_model cm ON cm.car_model_id = cvr.vehicle_model  
                         LEFT JOIN car_type ct ON ct.car_type_id = cvr.vehicle_type 
                         LEFT JOIN bike_brand bb ON bb.bike_brand_id = cvr.vehicle_brand   
                         LEFT JOIN bike_model bm ON bm.bike_model_id = cvr.vehicle_model   
                         LEFT JOIN color c ON c.color_id = cvr.vehicle_color ` 
            let userDetail = await db.select('customer_vehicle_relation cvr' + join , selectParams, where )
            return userDetail
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

    async getVehicleWashByBuildingId(buildingId){
        let currentDate = dateHelper.getFormattedDate();

        // let selectParams = ` COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 1),0 ) as everyDay, 
        //                      COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 2),0 ) as thriceWeek, 
        //                      COALESCE(COUNT(cs.customer_subscription_relation_id) filter (where subscription_type = 3),0 )  as onceWeek `,
        let selectParams = ` 30 as everyDay, 
                              5 as thriceWeek, 
                              46 as onceWeek `,
        
                where = ` cs.subscription_start_date <= '${currentDate}' AND cs.subscription_end_date >= '${currentDate}' AND cs.has_paid = 1 AND cs.building_id = ${buildingId}`
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
                            where = ` executive_building_relation.building_id = ${buildingList[cnt].building_id}  ORDER BY distance DESC,has_vehicle ASC `,
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

    async scheduleExecutiveToUserVehicleRelation(body) {
        try { 
            let currentDate = dateHelper.getFormattedDate(),
                currentSeting = dateHelper.getCurrentTimeStamp()
            let day = [1,2,3,4,5,6]; // 1: monday 7: Sunday
        
            let selectParams = ` cs.complex_building_id,cs.is_complex `,
                where = ` total_subs >0  ORDER BY ranking DESC `
            let complexList = await db.select('complex_subscription_relation cs' , selectParams, where )
            //console.log("================================ complexList",complexList)
            if(complexList.length >0){
            let getQuestionList = async _ => {
                    for(let cnt=0;cnt<complexList.length;cnt++) { 
                        let selectParams = `building_id,everyday_vehicle everyday,thrice_a_week_vehicle thriceweek,once_a_week_vehicle onceweek,everyday_job_list,thriceweek_job_list,onceweek_job_list,subscription_count `
                            where = ` b.building_id = ${complexList[cnt].complex_building_id} `
                            if(complexList[cnt].is_complex == 0){
                                where = ` complex_id = ${complexList[cnt].complex_building_id} `
                            }                                        
                        let buildingList = await db.select('building_vehicle_weekly_relation b' , selectParams, where )
                        //console.log(" \n \n \n \n ============== buildingList \n \n ",buildingList)
                        let buildingId = buildingList.map(item => item.building_id)
                        //console.log("==========buildingId",buildingId)
                        let getExecutiveListByBuildingId = await this.getExecutiveListByBuildingId(buildingId.join(','),Math.round(buildingList[cnt].subscription_count/30) + 1 )
                        //console.log(" \n \n \n \n ======================= getExecutiveListByBuildingId",getExecutiveListByBuildingId)


                        //console.log(" \n \n \n \n  ==========================  buildingList.length",buildingList.length)

                      


                        for(let bcnt=0;bcnt<buildingList.length;bcnt++){
                            let thriceweekJobList = buildingList[bcnt].thriceweek_job_list.length > 0 ? buildingList[bcnt].thriceweek_job_list : []
                            let onceweekJobList = buildingList[bcnt].onceweek_job_list.length > 0 ? buildingList[bcnt].onceweek_job_list : []
                            buildingList[bcnt].everydayVehicleId = buildingList[bcnt].everyday_job_list.length > 0 ? buildingList[bcnt].everyday_job_list :[] 
                            buildingList[bcnt].evenThriceWeekVehicleId = thriceweekJobList.slice(0, Math.round(thriceweekJobList.length/2) )
                            buildingList[bcnt].oddThriceWeekVehicleId = thriceweekJobList.slice(Math.round(thriceweekJobList.length/2) )
                            buildingList[bcnt].oddOnceWeekVehicleId = onceweekJobList.slice(0,3)
                            buildingList[bcnt].equalOnceWeekVehicleId = onceweekJobList.slice(3 - (onceweekJobList.length) )
                        }
                        //console.log(" ============== cnt ",cnt)

                        //console.log(" \n \n \n \n ============== buildingList \n \n ",buildingList)

                        

                        await this.executiveJobsAllocatebyBuilding(buildingList,getExecutiveListByBuildingId)
                        return ;
                         
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
            let selectParams = `no_of_jobs,executive_id,no_of_jobs executivePendingJobs`,
                where = ` executive_building_relation.building_id IN (${buildingId})  ORDER BY distance DESC,has_vehicle ASC LIMIT ${executiveCount}  `,
                join = ` LEFT JOIN service_provider ON service_provider.service_provider_id = executive_building_relation.executive_id ` 
            let userDetail = await db.select('executive_building_relation' + join , selectParams, where )
            return userDetail
        } catch (error) {
            return promise.reject(error)
        }

    }
    
    async executiveJobsAllocatebyBuilding(allJobsList,executiveList) {
        try { 
            let currentDate = dateHelper.getFormattedDate(),
                currentSeting = dateHelper.getCurrentTimeStamp()
            let dayList = [1,2,3,4,5,6]; // 1: monday 7: Sunday

            //   let allJobsList = [{"building_id":1,"everyday":"82","thriceweek":"13","onceweek":"32","everydayVehicleId":[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,102,102,103,104,105], "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]},
            //                     {"building_id":2,"everyday":"82","thriceweek":"13","onceweek":"15","everydayVehicleId":[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,102,102,103,104,105], "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[14,15,16,17,18,19,20,21,22,23]}]
            let allJobsList = [{"building_id":1,"everyday":"82","thriceweek":"13","onceweek":"32","everydayVehicleId":[{"vehicle_id":24,"block_list":""},{"vehicle_id":25,"block_list":""},{"vehicle_id":26,"block_list":""},{"vehicle_id":27,"block_list":""},{"vehicle_id":28,"block_list":""},{"vehicle_id":29,"block_list":""},{"vehicle_id":30,"block_list":""},{"vehicle_id":31,"block_list":""},{"vehicle_id":32,"block_list":""},{"vehicle_id":33,"block_list":""},{"vehicle_id":34,"block_list":""},{"vehicle_id":35,"block_list":""},{"vehicle_id":36,"block_list":""},{"vehicle_id":37,"block_list":""},{"vehicle_id":38,"block_list":""},{"vehicle_id":39,"block_list":""},{"vehicle_id":40,"block_list":""},{"vehicle_id":41,"block_list":""},{"vehicle_id":42,"block_list":""},{"vehicle_id":43,"block_list":""},{"vehicle_id":44,"block_list":""},{"vehicle_id":45,"block_list":""},{"vehicle_id":46,"block_list":""},{"vehicle_id":47,"block_list":""},{"vehicle_id":48,"block_list":""},{"vehicle_id":49,"block_list":""},{"vehicle_id":50,"block_list":""},{"vehicle_id":51,"block_list":""},{"vehicle_id":52,"block_list":""},{"vehicle_id":53,"block_list":""},{"vehicle_id":54,"block_list":""},{"vehicle_id":55,"block_list":""},{"vehicle_id":56,"block_list":""},{"vehicle_id":57,"block_list":""},{"vehicle_id":58,"block_list":""},{"vehicle_id":59,"block_list":""},{"vehicle_id":60,"block_list":""},{"vehicle_id":61,"block_list":""},{"vehicle_id":62,"block_list":""},{"vehicle_id":63,"block_list":""},{"vehicle_id":64,"block_list":""},{"vehicle_id":65,"block_list":""},{"vehicle_id":66,"block_list":""},{"vehicle_id":67,"block_list":""},{"vehicle_id":68,"block_list":""},{"vehicle_id":69,"block_list":""},{"vehicle_id":70,"block_list":""},{"vehicle_id":71,"block_list":""},{"vehicle_id":72,"block_list":""},{"vehicle_id":73,"block_list":""},{"vehicle_id":74,"block_list":""},{"vehicle_id":75,"block_list":""},{"vehicle_id":76,"block_list":""},{"vehicle_id":77,"block_list":""},{"vehicle_id":78,"block_list":""},{"vehicle_id":79,"block_list":""},{"vehicle_id":80,"block_list":""},{"vehicle_id":81,"block_list":""},{"vehicle_id":82,"block_list":""},{"vehicle_id":83,"block_list":""},{"vehicle_id":84,"block_list":""},{"vehicle_id":85,"block_list":""},{"vehicle_id":86,"block_list":""},{"vehicle_id":87,"block_list":""},{"vehicle_id":88,"block_list":""},{"vehicle_id":89,"block_list":""},{"vehicle_id":90,"block_list":""},{"vehicle_id":91,"block_list":""},{"vehicle_id":92,"block_list":""},{"vehicle_id":93,"block_list":""},{"vehicle_id":94,"block_list":""},{"vehicle_id":95,"block_list":""},{"vehicle_id":96,"block_list":""},{"vehicle_id":97,"block_list":""},{"vehicle_id":98,"block_list":""},{"vehicle_id":99,"block_list":""},{"vehicle_id":100,"block_list":""},{"vehicle_id":101,"block_list":""},{"vehicle_id":102,"block_list":""},{"vehicle_id":103,"block_list":""},{"vehicle_id":104,"block_list":""},{"vehicle_id":105,"block_list":""}], "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45]},
                                {"building_id":2,"everyday":"82","thriceweek":"13","onceweek":"15","everydayVehicleId":[24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,102,102,103,104,105], "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[14,15,16,17,18,19,20,21,22,23]}]
             let executiveList = [{"executive_id":"1","no_of_jobs":5},{"executive_id":"2","no_of_jobs":10}]
            let assignedExecutiveId=[]  
            let assignedBuilding=[]  
            let userEveryDaySQL = []   
            //console.log("executiveList",executiveList) 
            //console.log("allJobsList",allJobsList)
            
             if(allJobsList.length >0){
                let getQuestionList = async _ => {
                //for(let cnt=0;cnt<allJobsList.length;cnt++) { 
                    //let updatedJobList = await this.getAllEveryDayJobAssignment(allJobsList[cnt],executiveList)  
                    //executiveList =  await this.getExecutiveList(updatedJobList);

                    // let updatedJobList = await this.getAllThriceWeekJobAssignment(allJobsList[cnt],executiveList)  
                    // executiveList =  await this.getExecutiveList(executiveList,updatedJobList); 

                    let updatedJobList = await this.getAllOnceWeekJobAssignment(allJobsList[0],executiveList)  
                     executiveList =  await this.getExecutiveList(executiveList,updatedJobList); 
                    

    
                //}
            }
            await getQuestionList();
                     
           }           
            
        } catch (error) {
            return promise.reject(error)
        }
    }

    
    
    async getUserDayList(executive_id,no_of_jobs,everydayDeduct,building_id,executivePendingJobs,evenJobs,oddJobs,type){
        let dayList = [1,2,3,4,5,6]; // 1: monday 7: Sunday 
     
       return dayList.map( day => {
           // console.log("========================")
           if(type == 1) {
              // console.log('\n ExecutiveId => ' +executive_id + ' \n Executive Total Jobs ==>' + no_of_jobs +  ' \n EveryDay count => ' + everydayDeduct +  ' \n executivePendingJobs ==>' + executivePendingJobs + ' \n Building Id ==>'+ building_id +'\n Day =>' + day + '\n Job Id ==>' + evenJobs )
           } else if(type == 2) {
               if(day % 2 ==0) {
               // console.log('\n ExecutiveId => ' +executive_id + ' \n Executive Total Jobs ==>' + no_of_jobs +  ' \n EveryDay count => ' + everydayDeduct +  ' \n executivePendingJobs ==>' + executivePendingJobs + ' \n Building Id ==>'+ building_id +'\n Day =>' + day + '\n Job Id ==>' + evenJobs )
              } else {
               // console.log('\n ExecutiveId => ' +executive_id + ' \n Executive Total Jobs ==>' + no_of_jobs +  ' \n EveryDay count => ' + everydayDeduct +  ' \n executivePendingJobs ==>' + executivePendingJobs + ' \n Building Id ==>'+ building_id +'\n Day =>' + day + '\n Job Id ==>' + oddJobs )

              } 
          } else if(type ==3){ 
            
                 console.log('\n ExecutiveId => ' +executive_id + ' \n Executive Total Jobs ==>' + no_of_jobs +  ' \n EveryDay count => ' + everydayDeduct +  ' \n executivePendingJobs ==>' + executivePendingJobs + ' \n Building Id ==>'+ building_id +'\n Day =>' + day + '\n Job Id ==>' + evenJobs )
              
          }
           
        })
    } 
    async getExecutiveList(executiveList,updatedJobList){
        let cnt = 0;
        executiveList = await executiveList.map((item) =>{
            if(item.executive_id == updatedJobList[cnt].executive_id) {
             return updatedJobList[cnt]
            } else {
                return item
            }            
        } )
                
        return executiveList.filter((item) => item.executivePendingJobs != 0 )
    }
    async getAllEveryDayJobAssignment(allJobsList,executiveList){
        try {
            
            let assignedExecutiveId=[]  
            let assignedBuilding=[]  
            let userEveryDaySQL = []   

            console.log("executiveList getAllEveryDayJobAssignment",executiveList) 
            let finalarr = arrLists.filter(function(list) {
                console.log("list.block_list.split(',')",list.block_list.split(','))
                if(list.block_list.split(',').indexOf("1") == -1){
                return list
                
                }
               })


            // let getQuestionList = async _ => {
            //     let cnt = 0
                //for(let cnt=0;cnt<allJobsList.length;cnt++) { 
                    //console.log(" \n \n allJobsList ==> ",allJobsList[cnt])
                    //console.log(" \n \n ============================ \n \n ")

                    let getExecutiveList = async _ => {
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            // check whether 
                            //  console.log(" \n \n =================== Before ")
                            //  console.log("allJobsList[cnt].everyday",allJobsList.everyday)
                            //  console.log("executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)
                            //  console.log(" \n  ===================  ")
                             if(allJobsList.everyday!=0) {
                                let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.everyday
                                let everydayDeduct = executiveList[ecnt].no_of_jobs - allJobsList.everyday;
                                if(allJobsList.everyday >= executiveList[ecnt].no_of_jobs) {
                                   // console.log(" in allJobsList",executiveList[ecnt].no_of_jobs )
                                    everydayDeduct = executiveList[ecnt].no_of_jobs 
                                    executivePendingJobs = 0
                                }
                                //console.log("everydayDeduct ==>",everydayDeduct)
            
                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,everydayDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.everydayVehicleId.slice(0,everydayDeduct).toString(),'',1)  
                                allJobsList.everydayVehicleId = allJobsList.everydayVehicleId.slice(everydayDeduct); console.log(" \n \n allJobsList.everydayVehicleId",allJobsList.everydayVehicleId.length)
                                //console.log("allJobsList.everydayVehicleId",allJobsList.everydayVehicleId) 
                                //console.log("allJobsList.everydayVehicleId",allJobsList.everydayVehicleId)
                                allJobsList.everyday = allJobsList.everydayVehicleId.length
            
                                // console.log(" \n \n =================== After  ")
                                // console.log("allJobsList[cnt].everyday",allJobsList.everyday)
                                // console.log("executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)
                                // console.log(" \n  ===================   ")
            
                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs})
                                //console.log("assignedExecutiveId",assignedExecutiveId)
                                if(allJobsList.everyday ==0){
                                   // console.log("assignedExecutiveId inside ==>",assignedExecutiveId)
                                    return assignedExecutiveId;
                                  break;
                                }            
                                
                                //console.log("userEveryDaySQL",userEveryDaySQL)
            
                            }  else {
                                break ;
                            }
            
                        }
                       } 
                     await getExecutiveList()  
                     
                     assignedBuilding.push({"building_id": allJobsList.building_id  ,  "everydayPendingJobs": allJobsList.everyday  })
                     console.log("assignedBuilding",assignedBuilding)
                     return assignedExecutiveId;


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

    async getAllThriceWeekJobAssignment(allJobsList,executiveList){
        try {
            let assignedExecutiveId=[]  
            let assignedBuilding=[]  
            let userEveryDaySQL = []   

           // console.log("executiveList getAllEveryDayJobAssignment",executiveList)

                    let getExecutiveList = async _ => {
                        //console.log(" \n ============== allJobsList.thriceweek =========> ",allJobsList.thriceweek )
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            if(ecnt==0){
                              allJobsList.thriceweek = Math.ceil(allJobsList.thriceweek / 2)
                            } 

                            //console.log("\n =============== allJobsList.thriceweek",allJobsList.thriceweek)
                            //console.log("\n =============== executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)
                            
                             if(allJobsList.thriceweek >0) {
                                let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.thriceweek
                                let thriceweekDeduct =  allJobsList.thriceweek ;
                                //console.log("thriceweekDeduct =====>",thriceweekDeduct)
                                if(allJobsList.thriceweek >= executiveList[ecnt].no_of_jobs) {
                                   // console.log(" in allJobsList",executiveList[ecnt].no_of_jobs )
                                   thriceweekDeduct = Math.ceil(executiveList[ecnt].no_of_jobs /2) 
                                    executivePendingJobs = 0
                                }
                                console.log("everydayDeduct ==>",thriceweekDeduct)
                                

                                //let allJobsList = [{"building_id":1,"everyday":"82","thriceweek":"13","onceweek":"10", "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[17,18,19,20,21,22,23]}],

            
                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,thriceweekDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.evenThriceWeekVehicleId.slice(thriceweekDeduct).toString(), allJobsList.oddThriceWeekVehicleId.slice(thriceweekDeduct).toString(),2)  
                                allJobsList.evenThriceWeekVehicleId = allJobsList.evenThriceWeekVehicleId.slice(thriceweekDeduct); //console.log("\n ======== allJobsList.evenThriceWeekVehicleId",allJobsList.evenThriceWeekVehicleId);
                                allJobsList.oddThriceWeekVehicleId = allJobsList.oddThriceWeekVehicleId.slice(thriceweekDeduct); //console.log("\n ======== allJobsList.oddThriceWeekVehicleId",allJobsList.oddThriceWeekVehicleId);
                                
                                
                                
                                allJobsList.thriceweek = (allJobsList.thriceweek - thriceweekDeduct) > 0 ? (allJobsList.thriceweek - thriceweekDeduct) : 0           
            
                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs})
                                //console.log("assignedExecutiveId",assignedExecutiveId)
                                console.log("assignedExecutiveId",assignedExecutiveId)
                                if(allJobsList.everyday == 0){
                                    return assignedExecutiveId;
                                  break;
                                }
            
                            }  else {
                                break ;
                            }
            
                        }
                       } 
                     await getExecutiveList()  
                     
                     assignedBuilding.push({"building_id": allJobsList.building_id  ,  "thriceWeekPendingJobs": allJobsList.thriceweek  })
                     console.log("assignedBuilding",assignedBuilding)
                     return assignedExecutiveId;

        
        } catch (error) {
            return promise.reject(error)
        } 

    } 

    async getAllOnceWeekJobAssignment(allJobsList,executiveList){ 
        try {
            let assignedExecutiveId=[]  
            let assignedBuilding=[]  
            let userEveryDaySQL = []   

           // console.log("executiveList getAllEveryDayJobAssignment",executiveList)

                    let getExecutiveList = async _ => {
                        //console.log(" \n ============== allJobsList.thriceweek =========> ",allJobsList.thriceweek )
                        for(let ecnt =0;ecnt<executiveList.length;ecnt++){
                            if(ecnt==0){
                              allJobsList.onceweek = Math.ceil(allJobsList.onceweek / 6)
                            } 

                            //console.log("\n =============== allJobsList.thriceweek",allJobsList.thriceweek)
                            //console.log("\n =============== executiveList[ecnt].no_of_jobs",executiveList[ecnt].no_of_jobs)
                            
                             if(allJobsList.onceweek >0) {
                                let executivePendingJobs = executiveList[ecnt].no_of_jobs - allJobsList.onceweek
                                let onceweekDeduct =  allJobsList.onceweek ;
                                //console.log("onceweekDeduct =====>",onceweekDeduct)
                                if(allJobsList.onceweek >= executiveList[ecnt].no_of_jobs) {
                                   // console.log(" in allJobsList",executiveList[ecnt].no_of_jobs )
                                   onceweekDeduct = executiveList[ecnt].no_of_jobs  
                                    executivePendingJobs = 0
                                }
                                console.log("everydayDeduct ==>",onceweekDeduct)
                                console.log("allJobsList.equalOnceWeekVehicleId",allJobsList.equalOnceWeekVehicleId.slice(0,onceweekDeduct * 6))

                                //let allJobsList = [{"building_id":1,"everyday":"82","thriceweek":"13","onceweek":"10", "evenThriceWeekVehicleId":[1,2,3,4,5,6,7],"oddThriceWeekVehicleId":[8,9,10,11,12,13],"oddOnceWeekVehicleId":[14,15,16],"equalOnceWeekVehicleId":[17,18,19,20,21,22,23]}],

            
                                userEveryDaySQL = await this.getUserDayList(executiveList[ecnt].executive_id, executiveList[ecnt].no_of_jobs,onceweekDeduct,allJobsList.building_id,executivePendingJobs,allJobsList.equalOnceWeekVehicleId.slice(0,onceweekDeduct * 6).toString(), '',3)  
                                allJobsList.equalOnceWeekVehicleId = allJobsList.equalOnceWeekVehicleId.slice(0,onceweekDeduct * 6); //console.log("\n ======== allJobsList.evenThriceWeekVehicleId",allJobsList.evenThriceWeekVehicleId);
                                
                                
                                
                                allJobsList.onceweek = (allJobsList.onceweek - onceweekDeduct) > 0 ? (allJobsList.onceweek - onceweekDeduct) : 0           
            
                                assignedExecutiveId.push({"executive_id":executiveList[ecnt].executive_id,"no_of_jobs": executivePendingJobs ,  "executivePendingJobs":executivePendingJobs, "actual_jobs":executiveList[ecnt].no_of_jobs})
                                //console.log("assignedExecutiveId",assignedExecutiveId)
                                console.log("assignedExecutiveId",assignedExecutiveId)
                                if(allJobsList.everyday == 0){
                                    return assignedExecutiveId;
                                  break;
                                }
            
                            }  else {
                                break ;
                            }
            
                        }
                       } 
                     await getExecutiveList()  
                     
                     assignedBuilding.push({"building_id": allJobsList.building_id  ,  "onceweekPendingJobs": allJobsList.onceweek  })
                     console.log("assignedBuilding",assignedBuilding)
                     return assignedExecutiveId;

        
        } catch (error) {
            return promise.reject(error)
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