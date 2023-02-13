const db = require('../../utils/db')
const promise = require('bluebird')
const joi = require('joi')
const joiValidator = require('../../utils/joiValidator')
const config = require('../../utils/config')
const language = config.language;


/**
 * This ComplexValidator class contains complex add edit list related API's validation.
 */


class ComplexValidator {


    // async addEditComplexValidator(body) {
    //     try {
    //         let schema = joi.object().keys({
    //             building_name: joi.string().trim().required(),
    //             location: joi.string().trim().required(),
    //             latitude: joi.number().required(),
    //             longitude: joi.number().required(),
    //             has_demo: joi.number().required(),
    //             Cbuidings :joi.array()             
    //         })
    //         await joiValidator.validateJoiSchema(body, schema);
    //     } catch (error) {
    //         return promise.reject(error)
    //     }
    // }    


    async addEditComplexValidator(body) {
        try {


            let schema = joi.object().keys({
                complex_id: joi.number().optional(),
                complex_name_lang: joi.optional(),
                // complex_name_lang: joi.object().keys({
                //     en: joi.string().label('Enter Complex name English').required(),
                //     tr: joi.string().label('Enter Complex name Turkish').required(),
                //     fa: joi.string().label('Enter Complex name Farsi').required(),
                //     ar: joi.string().label('Enter Complex name Arabic').required()
                //   }).required(),
                location: joi.string().trim().required(),
                latitude: joi.number().required(),
                longitude: joi.number().required(),
                hasChangeInBuildings: joi.boolean().required(),
                buildings: joi.array().min(1).required().label('Building'),
                // buildings:joi.array().min(1).optional().label('Building') ,                      
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }   
    
    async complexStatusUpdateValidator(body){
        try {
            let schema = joi.object().keys({
                complex_id: joi.number().required(),
                is_active: joi.number().valid(1,0).required()                
            })
            await joiValidator.validateJoiSchema(body, schema);
        } catch (error) {
            return promise.reject(error)
        }
    }

    async getComplexListValidator(body) {
        try {
            let schema = joi.object().keys({
                search: joi.string().optional(),
                page_no: joi.number().integer().required(),
                limit: joi.number().integer().required()                             
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
}

module.exports = new ComplexValidator()