const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')


/**
 * This BikeHelper class contains Bike brand and model related API's logic and required database operations.
 */

class BikeHelper {
    async getBikeBrandList(body) {
        try {
            let selectParams = ` * `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(brand_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            if ('getAllBrandListNames' in body) {
                selectParams = ` brand_id, brand_name`;
                let data = await db.select('bike_brand', selectParams, '');
                return { data };
            } else {
                let data = await db.select('bike_brand', selectParams, where + pagination),
                    totalCount = await db.select('bike_brand', `COUNT(*)`, where)
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
                brand = await db.select('bike_brand', selectParams, where)
            if (brand.length === 0) {
                throw 'BIKE_BRAND_NOT_FOUND'
            } else {
                return brand[0]
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async addEditBikeBrand(body) {

        console.log("addEditBikeBrand :: ", body)
        try {
            let data = {
                brand_name: body.brand_name,
                brand_name_lang: body.brand_name_lang,
                // brand_name_en: body.brand_name_en.toString().trim(),
                // brand_name_tr: body.brand_name_tr.toString().trim(),
                // brand_name_fa: body.brand_name_fa.toString().trim(),
                // brand_name_ar: body.brand_name_ar.toString().trim(),
                is_active: ('is_active' in body) ? body.is_active : 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if ('brand_image' in body && body.brand_image !== 'undefined') {
                data['brand_image'] = body.brand_image;
            }

            if ('brand_id' in body) {
                data['brand_id'] = body.brand_id;
                data['created_date'] = body.created_date;
            }
            let brand = await db.upsert('bike_brand', data, 'brand_id')
            return brand
        } catch (error) {
            return promise.reject(error)
        }
    }
    async insertBuilding(body) {
        try {
            let data = {
                building_name: body.building_name,
                location: body.location,
                latitude: +body.latitude,
                longitude: +body.longitude,
                has_demo: +body.has_demo,
                is_active: 1,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            console.log("Insert Data :::: ", data);
            let brand = await db.insert('building', data)
            return brand
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateBuilding(body) {
        try {
            let condition = ` building_id = ${body.building_id}`,
                data = {
                    building_name: body.building_name,
                    location: body.location,
                    latitude: +body.latitude,
                    longitude: +body.longitude,
                    has_demo: +body.has_demo,
                    modified_date: dateHelper.getCurrentTimeStamp()
                }
            let result = await db.update('building', condition, data)
            if (result.rowCount === 0) {
                throw 'BUILDING_DATA_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async buildingStatusUpdate(building_id, flag, key) {
        try {
            let where = ` building_id = ${building_id} `,
                data = {
                    [key]: flag,
                    modified_date: dateHelper.getCurrentTimeStamp()
                },
                result = await db.update('building', where, data)
            if (result.rowCount === 0) {
                throw 'BUILDING_DATA_NOT_FOUND'
            } else {
                return true
            }
        } catch (error) {
            console.log(error)
            return promise.reject(error)
        }
    }

    async isBikeBrandExist(body, flag) { // true = edit brand , false = add brand
        try {
            console.log("\n\n\n\n\n", flag == true ? 'Edit brand' : 'Add brand');
            let selectParams = "*",
                where = ` brand_name = '${body.brand_name}' `;

            if (flag) {
                where = ` brand_name = '${body.brand_name}' AND brand_id <> ${body.brand_id} `;
            }
            let brand = await db.select('bike_brand', selectParams, where)
            console.log("brand ::: ", brand);
            if (brand.length > 0) {
                throw 'BIKE_BRAND_EXIST'
            } else if (flag == false && brand.length == 0) {
                return [];
            }
            else {
                where = ` brand_id = ${body.brand_id} `;
                brand = await db.select('bike_brand', selectParams, where);
                console.log("Return :::::::: ", brand[0]);
                return brand;
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getBuildingList(body, language) {
        try {
            let selectParams = `building_id, building_name_lang->>'${language}' building_name, complex_id, location, latitude, longitude, 
                                has_demo, is_active, demo_id `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(building_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            let data = await db.select('building', selectParams, where + pagination),
                totalCount = await db.select('building', `COUNT(*)`, where)
            return { data, total: totalCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }








    async isBikeModelExist(body, flag) { // true = edit model , false = add model
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
            let models = await db.select('bike_model', selectParams, where)
            console.log("models ::: ", models);
            if (models.length > 0) {
                throw 'MODEL_BRAND_EXIST'
            } else if (flag == false && models.length == 0) {
                return [];
            }
            else {
                where = ` model_id = ${body.model_id} `;
                models = await db.select('bike_model', selectParams, where);
                console.log("Return :::::::: ", models[0]);
                return models;
            }
        } catch (error) {
            return promise.reject(error)
        }
    }



    async addEditBikeModel(body) {
        try {
            let data = {

                model_name: body.model_name_lang.en,
                // model_name_en: body.model_name_en.toString().trim(),
                // model_name_tr: body.model_name_tr.toString().trim(),
                // model_name_fa: body.model_name_fa.toString().trim(),
                // model_name_ar: body.model_name_ar.toString().trim(),
                model_name_lang: JSON.stringify(body.model_name_lang),
                is_active: ('is_active' in body) ? body.is_active : 1,
                brand_id: body.brand_id,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp()
            }
            if ('model_id' in body) {
                data['model_id'] = body.model_id;
                data['created_date'] = body.created_date;
            }
            let model = await db.upsert('bike_model', data, 'model_id')
            return model
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getBikeModelList(body) {
        try {
            let selectParams = ` bike_model.*, b.brand_name `,
                join = ` LEFT JOIN bike_brand b ON b.brand_id = bike_model.brand_id `,
                where = ` 1=1 `,
                pagination = ` ORDER BY created_date DESC LIMIT ${Number(body.limit)} OFFSET ${Number(body.limit) * (Number(body.page_no) - 1)}`
            if (body.search && body.search.trim().length > 0) {
                where += ` AND LOWER(model_name) LIKE LOWER('%${body.search.replace(/'/g, "''")}%')`
            }
            if ('getAllModelsListNames' in body) {
                selectParams = ` model_id, model_name`;
                let data = await db.select('bike_model', selectParams, '');
                return { data };
            } else {
                let data = await db.select('bike_model' + join, selectParams, where + pagination),
                    totalCount = await db.select('bike_model', `COUNT(*)`, where)
                return { data, total: totalCount[0].count }
            }
        } catch (error) {
            return promise.reject(error)
        }
    }

}

module.exports = new BikeHelper()