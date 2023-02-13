const promise = require('bluebird')
const joi = require('joi')

class joiValidator {
  validateJoiSchema(body, schema) {
    return new promise((resolve, reject) => {
      joi.validate(body, schema, (error, value) => {
        if (error) {          
          let param = error.details[0].context.key;          
          let type = error.details[0].type;          
          let message = error.details[0].message;          
          if('label' in error.details[0].context){
            param = error.details[0].context.label
          }         
          reject({ param , type, message })
        } else {
          resolve()
        }
      })
    })
  }
}

module.exports = new joiValidator()
