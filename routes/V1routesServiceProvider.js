const express = require('express')
const router = express.Router()
const Multer = require('multer')

const headerValidator = require('../api/utils/headersValidator')
const serviceProviderAuth = require('../api/v1/controllers/serviceProviderAuth')
const remarks = require('../api/v1/controllers/remarks')
const vehicleWash = require('../api/v1/controllers/vehicleWash')
const leave = require('../api/v1/controllers/leave')

const multer = Multer({
    storage: Multer.MemoryStorage,
    limits: {
        fileSize: 10 * 1024 * 1024, // Maximum file size is 10MB
    },
});

const post_wash_image_fields = [
    { name: 'car_wash_images', maxCount: 2 },
    { name: 'promotion_images' }
]

//authentication
router.post('/signin', headerValidator.nonAuthValidation, serviceProviderAuth.signin)
router.post('/forgotPassword', headerValidator.nonAuthValidation, serviceProviderAuth.forgotPassword)
router.post('/resendOTP', headerValidator.nonAuthValidation, serviceProviderAuth.resendOTP)
router.post('/resetPassword', headerValidator.nonAuthValidation, serviceProviderAuth.resetPassword)
router.post('/changePassword', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, serviceProviderAuth.changePassword)
router.post('/getProfile', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, serviceProviderAuth.getProfile)
router.post('/getMinimumExteriorJobs', headerValidator.authValidation, headerValidator.isExecutive, serviceProviderAuth.getMinimumExteriorJobs)
router.post('/setMinimumExteriorJobs', headerValidator.authValidation, headerValidator.isExecutive,  serviceProviderAuth.setMinimumExteriorJobs)
router.post('/refreshToken', headerValidator.authValidation,serviceProviderAuth.refreshToken)
router.post('/dashboard', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, serviceProviderAuth.dashboard)
router.post('/deleteUserDeviceRelation', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, serviceProviderAuth.deleteUserDeviceRelation)

//notification
router.post('/readNotification', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, serviceProviderAuth.readNotification)
router.post('/getNotification', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, serviceProviderAuth.getNotification)

//remarks
router.post('/getAllVehicleParts', headerValidator.authValidation, headerValidator.isExecutive, remarks.getAllVehicleParts)
router.post('/getAllRemarkNames', headerValidator.authValidation, headerValidator.isExecutive, remarks.getAllRemarkNames)
router.post('/addRemark', multer.single('remark_image'), headerValidator.authValidation, headerValidator.isExecutive, remarks.addRemark)
router.post('/deleteRemark', headerValidator.authValidation, headerValidator.isExecutive, remarks.deleteRemark)
router.post('/getRemarks', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, remarks.getRemarks)

//Vehicle Wash
router.post('/getWashServices', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, vehicleWash.getWashServices)
router.post('/startDay', headerValidator.authValidation, headerValidator.isExecutive, vehicleWash.startDay)
router.post('/endDay', headerValidator.authValidation, headerValidator.isExecutive, vehicleWash.endDay)
router.post('/getUserVehicleWashDetail', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, vehicleWash.getUserVehicleWashDetail)
router.post('/uploadVehicleImage', headerValidator.authValidation, headerValidator.isExecutive, multer.single('vehicle_image'), vehicleWash.uploadVehicleImage)
router.post('/getUserVehicleWashHistoryList', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, vehicleWash.getUserVehicleWashHistoryList)
router.post('/getIncompletedPromotions', headerValidator.authValidation, headerValidator.isExecutiveOrSupervisorOrTopSupervisor, vehicleWash.getIncompletedPromotions)
router.post('/addPreWashImages', multer.array('car_wash_images', 2), headerValidator.authValidation, headerValidator.isExecutive, vehicleWash.addPreWashImages)
router.post('/addPostWashImages', multer.fields(post_wash_image_fields), headerValidator.authValidation, headerValidator.isExecutive, vehicleWash.addPostWashImages)
router.post('/addVehicleWashData', headerValidator.authValidation, headerValidator.isExecutive, vehicleWash.addVehicleWashData)

//leaves
router.post('/addLeave', headerValidator.authValidation, headerValidator.isExecutive, leave.addLeave)
router.post('/getExecutiveLeaves', headerValidator.authValidation, headerValidator.isExecutive, leave.getExecutiveLeaves)

// Supervisor APIs

//leaves
router.post('/getSupervisorLeaves', headerValidator.authValidation, headerValidator.isSupervisor, leave.getSupervisorLeaves)
router.post('/rejectLeave', headerValidator.authValidation, headerValidator.isSupervisor, leave.rejectLeave)
router.post('/approveLeave', headerValidator.authValidation, headerValidator.isSupervisor, leave.approveLeave)
router.post('/getSingleLeaveWithExecutives', headerValidator.authValidation, headerValidator.isSupervisor, leave.getSingleLeaveWithExecutives)
router.post('/assignJobToSubstitute', headerValidator.authValidation, headerValidator.isSupervisor, leave.assignJobToSubstitute)
router.post('/assignJobToAvailableExecutive', headerValidator.authValidation, headerValidator.isSupervisor, leave.assignJobToAvailableExecutive)

//listing
router.post('/getAllExecutives', headerValidator.authValidation, headerValidator.isSupervisorOrTopSupervisor, serviceProviderAuth.getAllExecutives)
router.post('/getSingleExecutive', headerValidator.authValidation, headerValidator.isSupervisorOrTopSupervisor, serviceProviderAuth.getSingleExecutive)
router.post('/getSingleCustomer', headerValidator.authValidation, headerValidator.isSupervisorOrTopSupervisor, serviceProviderAuth.getSingleCustomer)
router.post('/getExecutivesByLatitudeLongitude', headerValidator.authValidation, headerValidator.isSupervisorOrTopSupervisor, serviceProviderAuth.getExecutivesByLatitudeLongitude)

//ticket
router.post('/getRaisedTickets', headerValidator.authValidation, headerValidator.isSupervisor, vehicleWash.getRaisedTickets)
router.post('/getExecutivesForTicket', headerValidator.authValidation, headerValidator.isSupervisor, vehicleWash.getExecutivesForTicket)
router.post('/assignTicket', headerValidator.authValidation, headerValidator.isSupervisor, vehicleWash.assignTicket)

// Top Supervisor APIs
router.post('/getWashServicesForTopSupervisor', headerValidator.authValidation, headerValidator.isTopSupervisor, vehicleWash.getWashServicesForTopSupervisor)
router.post('/getAllSupervisors', headerValidator.authValidation, headerValidator.isTopSupervisor, serviceProviderAuth.getAllSupervisors)
router.post('/getSingleSupervisor', headerValidator.authValidation, headerValidator.isTopSupervisor, serviceProviderAuth.getSingleSupervisor)


module.exports = router