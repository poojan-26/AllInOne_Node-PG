const carHelper = require('../helpers/carHelper')
const carValidator = require('../validators/carValidator')
const responseHelper = require('../../utils/responseHelper')
const S3helper = require('../../utils/S3helper')

/**
 * This Car class contains Car Brand and Car Model and Car types related APIs
 */

class Car {

    /**
     * Add Edit and Status Change Related Bike Brand API
     * @param {string} brand_name_lang  brand name in multiple languages
     * @param {string} brand_image  brand Image
     * @returns success response with Brand Detail
     * @date 2020-01-02
     */

    async addEditCarBrand(req, res) {
        try {
            console.log('addEditCarBrand req.body::',req.body)

            delete req.body['user_id'];
            if ('is_active' in req.body) {
                await carValidator.brandStatusUpdateValidator(req.body);
            } else {
                await carValidator.addEditCarBrandValidator(req.body);
            }
            if(req.file && req.file != 'undefined') {
                req.body['brand_image'] = await S3helper.uploadImageOnS3("tekoto/vehicles/", req.file)
            }
            if('brand_name_lang' in req.body){
                let jsnBrand = JSON.parse(req.body.brand_name_lang);
                console.log(jsnBrand.en)
                req.body['brand_name'] = jsnBrand.en;
                console.log(req.body.brand_name_lang.en)
            }
          
           
            let brandData = await carHelper.isCarBrandExist(req.body, ('brand_id' in req.body) ? true : false);
            if (brandData.length > 0) {
                req.body['created_date'] = brandData[0].created_date;
            }
            if ('is_active' in req.body) {
                req.body['brand_name'] = brandData[0].brand_name;
                req.body['brand_name_lang'] = JSON.stringify(brandData[0].brand_name_lang);
            }
            await carHelper.addEditCarBrand(req.body);
            responseHelper.success(res, ('is_active' in req.body) ? 'BRAND_UPDATED_SUCCESS' : ('brand_id' in req.body) ? 'EDIT_BRAND_SUCCESS' : 'ADD_BRAND_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


     /**
     * Add Edit and Status Change Related Car Type API
     * @param {string} type_name_lang  type name in multiple languages
     * @returns success response with Car type Detail
     * @date 2020-01-03
     */


    async addEditCarType(req, res) {
        try {
            delete req.body['user_id'];
            if ('is_active' in req.body) {
                await carValidator.carTypeStatusUpdateValidator(req.body);
            } else {
                await carValidator.addEditCarTypeValidator(req.body);
            }
            let brandData = await carHelper.isCarTypeExist(req.body, ('type_id' in req.body) ? true : false);
            if (brandData.length > 0) {
                req.body['created_date'] = brandData[0].created_date;
            }
            if ('is_active' in req.body) {
                req.body['type_name_lang'] = brandData[0].type_name_lang;
            }
            await carHelper.addEditCarType(req.body);
            responseHelper.success(res, ('is_active' in req.body) ? 'CAR_TYPE_UPDATED_SUCCESS' : ('type_id' in req.body) ? 'EDIT_CAR_TYPE_SUCCESS' : 'ADD_CAR_TYPE_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    /**
     * Get car brand list API
     * @param {string} brand_name  search brand_name
     * @returns success response with All car brand details
     * @date 2020-01-03
     */

    async getBrandList(req, res) {
        try {
            delete req.body['user_id'];
            await carValidator.getBrandListValidator(req.body);
            let response = await carHelper.getBrandList(req.body);
            console.log('getBrandListgetBrandListgetBrandList',response)
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }

    /**
     * Get car type list API
     * @param {string} type_name  search type_name
     * @returns success response with All car type details
     * @date 2020-01-04
     */

    async getCarTypeList(req, res) {
        try {
            delete req.body['user_id'];
            await carValidator.getCarTypeListValidator(req.body);
            let response = await carHelper.getCarTypeList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


    /**
     * Add Edit and Status Change Related Car Model API
     * @param {string} model_name_lang  model name in multiple languages
     * @param {integer} brand_id  car brand id
     * @param {integer} type_id  Car type id
     * @returns success response with Car type Detail
     * @date 2020-01-03
     */

    async addEditCarModel(req, res) {
        try {
            delete req.body['user_id'];
            console.log("addEditCarModel req ====================================", req.body);
            if ('is_active' in req.body) {
                await carValidator.modelStatusUpdateValidator(req.body);
            } else {
                await carValidator.addEditCarModelValidator(req.body);

                //Check brand id exist or not 
                await carHelper.selectBrand(req.body.brand_id);
            }
            if ('model_name_lang' in req.body) {
                let jsnBrand = req.body.model_name_lang;
                req.body['model_name'] = jsnBrand.en;
            }
            let modelData = await carHelper.isCarModelExist(req.body, ('model_id' in req.body) ? true : false);
            if (modelData.length > 0) {
                req.body['created_date'] = modelData[0].created_date;
            }
            if ('is_active' in req.body) {
                req.body['model_name_lang'] = modelData[0].model_name_lang;
                req.body['brand_id'] = modelData[0].brand_id;
                req.body['type_id'] = modelData[0].type_id;
            }
            await carHelper.addEditCarModel(req.body);
            responseHelper.success(res, ('is_active' in req.body) ? 'MODEL_UPDATED_SUCCESS' : ('model_id' in req.body) ? 'EDIT_MODEL_SUCCESS' : 'ADD_MODEL_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


    /**
     * Get car model list API
     * @param {string} model_name  search model name
     * @returns success response with All car models details
     * @date 2020-01-04
     */
    async getModelList(req, res) {
        try {
            delete req.body['user_id'];
            await carValidator.getModelListValidator(req.body);
            let response = await carHelper.getModelList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }



}

module.exports = new Car();