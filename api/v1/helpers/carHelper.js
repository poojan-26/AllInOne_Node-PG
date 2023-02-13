const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')


/**
 * This CarHelper class contains car brand model and type add edit retrieve and status changes related API's logic and required database operations.
*/

class CarHelper {
    async getBrandList(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(brand_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            if ('getAllBrandListNames' in body) {
                selectParams = ` brand_id, brand_name`;
                let data = await db.select('car_brand', selectParams, '');
                return {data};
            } else {
                let data = await db.select('car_brand', selectParams, where + pagination),
                    totalCount = await db.select('car_brand', `COUNT(*)`, where)
                return { data, total: totalCount[0].count }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getCarTypeList(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(type_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            if ('getAllCarTypeListNames' in body) {
                selectParams = `type_id, type_name`;
                let data = await db.select('vehicle_type', selectParams, '');
                return {data};
            } else {
                let data = await db.select('vehicle_type', selectParams, where + pagination),
                    totalCount = await db.select('vehicle_type', `COUNT(*)`, where)
                return { data, total: totalCount[0].count }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    
    async selectBrand(brand_id) {
        try {
            let selectParams = "*",
                where = ` brand_id = ${brand_id} `,
                brand = await db.select('car_brand', selectParams, where)
            if (brand.length === 0) {
                throw 'CAR_BRAND_NOT_FOUND'
            } else {
                return brand[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async addEditCarBrand(body) {
        try {
            let data = {
                brand_name: body.brand_name,
                brand_name_lang : body.brand_name_lang,
                is_active: ('is_active') in body ? body.is_active : 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if('brand_image' in body && body.brand_image !== 'undefined'){
                data['brand_image'] = body.brand_image;
            }
            if ('brand_id' in body) {
                data['brand_id'] = body.brand_id;
                data['created_date'] = body.created_date;
            }
            let brand = await db.upsert('car_brand', data, 'brand_id')
            return brand
        } catch (error) {
            return promise.reject(error)
        }
    }

    async addEditCarType(body) {
        console.log(body)
        try {
            let data = {
                type_name: body.type_name_lang.en,
                type_name_lang : JSON.stringify(body.type_name_lang),
                is_active: ('is_active') in body ? body.is_active : 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if ('type_id' in body) {
                data['type_id'] = body.type_id;
                data['created_date'] = body.created_date;
            }
            let carType = await db.upsert('vehicle_type', data, 'type_id')
            return carType
        } catch (error) {
            return promise.reject(error)
        }
    }

    async isCarBrandExist(body, flag) { // true = edit brand , false = add brand
        try {
            console.log("\n\n\n\n\n", flag == true ? 'Edit brand' : 'Add brand');
            let selectParams = "*",
                where = ` brand_name = '${body.brand_name}' `;

            if (flag) {
                where = ` brand_name = '${body.brand_name}' AND brand_id <> ${body.brand_id} `;
            }
            let brand = await db.select('car_brand', selectParams, where)
            console.log("brand ::: ", brand);
            if (brand.length > 0) {
                throw 'CAR_BRAND_EXIST'
            } else if (flag == false && brand.length == 0) {
                return [];
            }
            else {
                where = ` brand_id = ${body.brand_id} `;
                brand = await db.select('car_brand', selectParams, where);
                console.log("Return :::::::: ", brand[0]);
                return brand;
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async isCarTypeExist(body, flag) { // true = edit brand , false = add brand
        try {
            console.log("\n\n\n\n\n", flag == true ? 'Edit Car Type' : 'Add Car Type');
            let selectParams = "*",
                where = ` type_name = '${body.type_name}' `;

            if (flag) {
                where = ` type_name = '${body.type_name}' AND type_id <> ${body.type_id} `;
            }
            let carType = await db.select('vehicle_type', selectParams, where)
            console.log("carType ::: ", carType);
            if (carType.length > 0) {
                throw 'CAR_TYPE_EXIST'
            } else if (flag == false && carType.length == 0) {
                return [];
            }
            else {
                where = ` type_id = ${body.type_id} `;
                carType = await db.select('vehicle_type', selectParams, where);
                console.log("Return :::::::: ", carType[0]);
                return carType;
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async isCarModelExist(body, flag) { // true = edit model , false = add model
        try {
            console.log("\n\n\n\n\n", flag == true ? 'Edit model' : 'Add model');
            let selectParams = "*",
                where = ` model_name = '${body.model_name}' `;

            if (flag) {
                where = ` model_name = '${body.model_name}' AND model_id <> ${body.model_id} `;
            }

            // if('is_active' in body){
            //     where = ` model_id = ${body.model_id} `;
            // }
            let models = await db.select('car_model', selectParams, where)
            console.log("models ::: ", models);
            if (models.length > 0) {
                throw 'MODEL_BRAND_EXIST'
            } else if (flag == false && models.length == 0) {
                return [];
            }
            else {
                where = ` model_id = ${body.model_id} `;
                models = await db.select('car_model', selectParams, where);
                console.log("Return :::::::: ", models[0]);
                return models;
            }
        } catch (error) {
            return promise.reject(error)
        }
    }



    async addEditCarModel(body) {
        try {
            let data = {
                model_name: body.model_name_lang.en,
                model_name_lang : JSON.stringify(body.model_name_lang),
                is_active: ('is_active' in body) ? body.is_active : 1,
                brand_id: body.brand_id,
                type_id : body.type_id,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if ('model_id' in body) {
                data['model_id'] = body.model_id;
                data['created_date'] = body.created_date;
            }
            let model = await db.upsert('car_model', data, 'model_id')
            return model
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getModelList(body) {
        try {
            let selectParams = ` car_model.*, b.brand_name, vt.type_name`,
                join = ` LEFT JOIN car_brand b ON b.brand_id = car_model.brand_id LEFT JOIN vehicle_type vt ON vt.type_id = car_model.type_id`,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(model_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            if ('getAllModelsListNames' in body) {
                selectParams = ` model_id, model_name`;
                let data = await db.select('car_model', selectParams, '');
                return {data};
            } else {
                let data = await db.select('car_model' + join, selectParams, where + pagination),
                    totalCount = await db.select('car_model', `COUNT(*)`, where)
                return { data, total: totalCount[0].count }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

}

module.exports = new CarHelper()