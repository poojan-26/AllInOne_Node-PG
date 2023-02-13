const bikeHelper = require('../helpers/bikeHelper')
const bikeValidator = require('../validators/bikeValidator')
const responseHelper = require('../../utils/responseHelper')
const S3helper = require('../../utils/S3helper')

/**
 * This Bike class contains Bike Brand and Bike Model related APIs
 */


class Bike {

    /**
     * Add Edit and Status Change Related Bike Brand API
     * @param {string} brand_name_lang  brand name in multiple languages
     * @param {string} brand_image  brand Image
     * @returns success response with Brand Detail
     * @date 2020-01-02
     */

    async addEditBikeBrand(req, res) {
        try {
            delete req.body['user_id'];
            if ('is_active' in req.body) {
                await bikeValidator.brandStatusUpdateValidator(req.body);
            } else {
                await bikeValidator.addEditBikeBrandValidator(req.body);
            }
            if(req.file && req.file !== 'undefined') {
                req.body['brand_image'] = await S3helper.uploadImageOnS3("tekoto/vehicles/", req.file)
            }
            let jsnBrand = JSON.parse(req.body.brand_name_lang);
            console.log("brand_name_lang",jsnBrand.en)
            req.body['brand_name'] = jsnBrand.en;
            let brandData = await bikeHelper.isBikeBrandExist(req.body, ('brand_id' in req.body) ? true : false);
            if (brandData.length > 0) {
                req.body['created_date'] = brandData[0].created_date;
            }
            

            if ('is_active' in req.body) {
                req.body['brand_name_lang'] = brandData[0].brand_name_lang;
            }
            await bikeHelper.addEditBikeBrand(req.body);
            responseHelper.success(res, ('is_active' in req.body) ? 'BRAND_UPDATED_SUCCESS' : ('brand_id' in req.body) ? 'EDIT_BRAND_SUCCESS' : 'ADD_BRAND_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


    /**
     * Get bike brand list API
     * @param {string} brand_name  search brand name
     * @returns success response with Brand Detail
     * @date 2020-01-02
     */

    async getBikeBrandList(req, res) {
        try {
            delete req.body['user_id'];
            await bikeValidator.getBikeBrandListValidator(req.body);
            let response = await bikeHelper.getBikeBrandList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


     /**
     * Add Edit and Status Change Related Bike Model API
     * @param {string} model_name_lang  brand model in multiple languages
     *  @param {string} brand_id  brand id
     * @returns success response with Model Detail
     * @date 2020-01-02
     */

    async addEditBikeModel(req, res) {
        try {
            delete req.body['user_id'];
            console.log("addEditBikeModel req ====================================", req.body);
            if ('is_active' in req.body) {
                await bikeValidator.modelStatusUpdateValidator(req.body);
            } else {
                await bikeValidator.addEditBikeModelValidator(req.body);

                //Check brand id exist or not 
                await bikeHelper.selectBrand(req.body.brand_id);
            }
            if('model_name_lang' in req.body){
                req.body['model_name'] = req.body.model_name_lang.en;
            }
           

            let modelData = await bikeHelper.isBikeModelExist(req.body, ('model_id' in req.body) ? true : false);
            if (modelData.length > 0) {
                req.body['created_date'] = modelData[0].created_date;
            }
            if ('is_active' in req.body) {
                req.body['model_name_lang'] = modelData[0].model_name_lang;
                req.body['brand_id'] = modelData[0].brand_id;
            }
            await bikeHelper.addEditBikeModel(req.body);
            responseHelper.success(res, ('is_active' in req.body) ? 'MODEL_UPDATED_SUCCESS' : ('model_id' in req.body) ? 'EDIT_MODEL_SUCCESS' : 'ADD_MODEL_SUCCESS', req.headers.language);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }


     /**
     * Get Bike Model API
     * @param {string} model_name  search model name
     * @returns success response with Bike model Detail
     * @date 2020-01-03
     */

    async getBikeModelList(req, res) {
        try {
            delete req.body['user_id'];
            await bikeValidator.getBikeModelListValidator(req.body);
            let response = await bikeHelper.getBikeModelList(req.body);
            responseHelper.success(res, 'SUCCESS', req.headers.language, response.data, '', response.total);
        } catch (error) {
            console.log(error);
            responseHelper.error(res, error, req.headers.language);
        }
    }



}

module.exports = new Bike();