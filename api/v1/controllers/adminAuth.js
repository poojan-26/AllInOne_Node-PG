const adminAuthHelper = require('../helpers/adminAuthHelper')
const responseHelper = require('../../utils/responseHelper')
const adminAuthValidator = require('../validators/adminAuthValidator')
const codeHelper = require('../../utils/codeHelper')
const mailHelper = require('../../utils/mailHelper')

/**
 * This AdminAuth class contains Admin account related APIs
 */

class AdminAuth {
    /**
     * Admin signin API
     * @param {string} username  Username
     * @param {string} password  Password
     * @returns success response with Admin details
     * @date 2020-01-01
     */
    async signin(req, res) {
        try {
            await adminAuthValidator.validateSigninForm(req.body)
            let token,
                user = await adminAuthValidator.isUserWithUserNameExist(req.body.username, false)
            await adminAuthValidator.validatePassword(user.password, req.body.password)
            console.log("Admin signin ::: ", user);
            token = await codeHelper.getJwtToken(user.admin_id, 4, true)
            // await adminAuthHelper.insertToken(user.id, token)
            delete user.password
            responseHelper.success(res, 'SIGNIN_SUCCESS', req.headers.language, { user: user, auth_token: token })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    /**
     * Forgot Password API
     * @param {string} email  Email
     * @returns success response with Send Mail
     * @date 2020-01-01
     */

    async sendForgotPasswordMail(req, res) {
        try {
            await adminAuthValidator.validateSendForgotPasswordMailForm(req.body)
            let user = await adminAuthValidator.isUserWithEmailExist(req.body.email, false),
                link = await codeHelper.getLink(user.id, req.body.email)
            mailHelper.sendForgotPasswordMail(req.body.email, link)
            responseHelper.success(res, 'FORGOT_PASSWORD_MAIL_SENT', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language, {})
        }
    }

    /**
     * Change Password API
     * @param {string} password  password
     * @returns success response for change Passowrd
     * @date 2020-01-01
     */

    async changePassword(req, res) {
        try {
            await adminAuthValidator.validateChnagePasswordForm(req.body)
            let user = await adminAuthValidator.isUserWithEmailExist(req.email, false)
            await adminAuthValidator.validatePassword(user.password, req.body.old_password)
            await adminAuthHelper.changePassword(req.body.new_password, req.user_id)
            responseHelper.success(res, 'CHANGE_PASSWORD_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language, {})
        }
    }
     /**
     *Refresh Token API
     * @returns success response with New Token
     * @date 2020-01-01
     */
    async refreshToken(req, res) {
        try {
            //await userAuthValidator.isTokenExists(req.headers.auth_token)
            console.log("Admin refreshToken...");
            console.log("req.headers.auth_token...", req.headers.auth_token);
            console.log("req.headers.refresh_token...", req.headers.refresh_token);
            let auth_token = await codeHelper.refreshToken(req.headers.auth_token,req.headers.refresh_token,1)
           // await userAuthHelper.updateToken(auth_token, req.headers.auth_token)
            responseHelper.success(res, 'TOKEN_REFRESHED', req.headers.language, { new_token: auth_token })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }

     /**
     * Get Counts API
     * @returns success response for user,brand, vehicles Counts
     * @date 2020-01-01
     */

    async getCounts(req, res) {
        try {
            let counts = await adminAuthHelper.selectCounts()
            responseHelper.success(res, 'GET_COUNTS_SUCESS', req.headers.language, counts)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    
    async resetPassword(req, res) {
        try {
            await adminAuthValidator.validateResetPasswordForm(req.body)
            let user = await adminAuthValidator.isUserWithEmailExist(req.email, false)
            await adminAuthHelper.changePassword(req.body.new_password, user.id)
            responseHelper.success(res, 'CHANGE_PASSWORD_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}

module.exports = new AdminAuth()