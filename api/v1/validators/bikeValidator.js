const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')

/**
 * This BikeValidator class contains bike brand and model related API's validation.
 */

class BikeValidator {

    async addEditBikeBrandValidator(body) {
        try {
            let schema = joi.object().keys({
                brand_id: joi.number().optional(),
                brand_name_lang: joi.optional(),
                // brand_name_lang: joi.object().keys({
                //     en: joi.string().label('Enter brand name English').required(),
                //     tr: joi.string().label('Enter brand name Turkish').required(),
                //     fa: joi.string().label('Enter brand name Farsi').required(),
                //     ar: joi.string().label('Enter brand name Arabic').required()
                //   }).required(),

                brand_image : joi.string().optional(),                          
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }   
    
    async brandStatusUpdateValidator(body){
        try {
            let schema = joi.object().keys({
                brand_id: joi.number().optional(),
                is_active: joi.number().valid(1,0).required()                
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getBikeBrandListValidator(body) {
        try {
            let schema = joi.object().keys({
                search: joi.string().optional(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required(),
                getAllBrandListNames: joi.boolean().optional()                 
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }


    async modelStatusUpdateValidator(body){
        try {
            let schema = joi.object().keys({
                model_id: joi.number().required(),
                is_active: joi.number().valid(1,0).required()                
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }

    async addEditBikeModelValidator(body) {
        try {
            let schema = joi.object().keys({
                model_id: joi.number().optional(),
                model_name_lang: joi.optional(),
                // model_name_lang: joi.object().keys({
                //     en: joi.string().label('Enter model name English').required(),
                //     tr: joi.string().label('Enter model name Turkish').required(),
                //     fa: joi.string().label('Enter model name Farsi').required(),
                //     ar: joi.string().label('Enter model name Arabic').required()
                //   }).required(),
                brand_id: joi.number().required()                              
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getBikeModelListValidator(body) {
        try {
            let schema = joi.object().keys({
                search: joi.string().optional(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required(),
                getAllModelsListNames: joi.boolean().optional()                 
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new BikeValidator()