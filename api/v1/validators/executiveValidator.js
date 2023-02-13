const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')
const language = config.language;


/**
 * This ExecutiveValidator class contains complex add edit list related API's validation.
 */


class ExecutiveValidator {

    async addEditExecutiveValidator(body) {
        try {

            let schema = joi.object().keys({
                service_provider_id: joi.number().optional(),
                name: joi.optional(),

                // name_lang: joi.object().keys({
                //     en: joi.string().label('Enter Full name English').required(),
                //     tr: joi.string().label('Enter Full name Turkish').required(),
                //     fa: joi.string().label('Enter Full name Farsi').required(),
                //     ar: joi.string().label('Enter Full name Arabic').required()
                //   }).required(),
                country_code: joi.string().trim().required(),
                phone_number: joi.string().trim().required(),
                password: joi.string().trim().optional(),
                email: joi.string().trim().required(),
                has_vehicle :joi.number().required(),
                no_of_jobs :joi.number().required(),
                location: joi.string().trim().required(),
                latitude: joi.number().required(),
                longitude: joi.number().required(),    
                profile_picture: joi.string().optional(),
                id_proof: joi.string().optional(),
                boss_id: joi.number().required(),
                type: joi.number().optional(),
                supervisor_executive_relation_id : joi.number().optional(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    
    async addEditSupervisorValidator(body) {
        try {

            let schema = joi.object().keys({
                service_provider_id: joi.number().optional(),
                name: joi.optional(),

                // name_lang: joi.object().keys({
                //     en: joi.string().label('Enter Full name English').required(),
                //     tr: joi.string().label('Enter Full name Turkish').required(),
                //     fa: joi.string().label('Enter Full name Farsi').required(),
                //     ar: joi.string().label('Enter Full name Arabic').required()
                //   }).required(),
                country_code: joi.string().trim().required(),
                phone_number: joi.string().trim().required(),
                password: joi.string().trim().optional(),
                email: joi.string().trim().required(),
                has_vehicle :joi.number().required(),
                // no_of_jobs :joi.number().required(),
                // location: joi.string().trim().required(),
                // latitude: joi.number().required(),
                // longitude: joi.number().required(), 
                profile_picture: joi.string().optional(),
                id_proof: joi.string().optional(),
                topsupervisor_supervisor_relation_id : joi.number().optional(),
                boss_id: joi.number().optional(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
    
    async executiveStatusUpdateValidator(body) {
        try {
            let schema = joi.object().keys({
                service_provider_id: joi.number().required(),
                is_active: joi.number().valid(1,0).required()                                
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }   


    async getExecutiveListValidator(body) {
        try {
            let schema = joi.object().keys({
                search: joi.string().optional(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required(),
                type: joi.number().integer().required()
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }    

    async getBindBuildingIds(body){
        try {
            let schema = joi.object().keys({
                complex_id: joi.number().required()                  
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

    async addEditCarModelValidator(body) {
        try {
            let schema = joi.object().keys({
                model_id: joi.number().optional(),
                model_name: joi.string().trim().required(),
                brand_id: joi.number().required()                              
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getModelListValidator(body) {
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

    async deleteServiceProviderRequest(body) {
        try {
            let schema = joi.object().keys({
                service_provider_id: joi.number().integer().required(),
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }
}

module.exports = new ExecutiveValidator()