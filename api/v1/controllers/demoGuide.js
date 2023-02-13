const demoGuideHelper = require('../helpers/demoGuideHelper');
const demoGuideValidator = require('../validators/demoGuideValidator');
const responseHelper = require('../../utils/responseHelper')
const S3helper = require('../../utils/S3helper')
const codeHelper = require('../../utils/codeHelper')
const config = require('../../utils/config')

class DemoGuide {
    async addEditDemoGuide(req, res) {
        try {
            delete req.body.user_id;
            // return
            await demoGuideValidator.addEditDemoGuideValidator(req.body);
            let demo_data = [];
            let reqData = {
                demo_type: req.body.demo_type
            }
            let deleteThumbnailPath;
            let deleteMediaPath;
            let result = await demoGuideHelper.selectDemo(reqData);  // Get row data  
            console.log("result demo=================", result.demo);

            console.log("req files==========", req.files)
            console.log("req body==========", req.body)
            // return
            if (req.body.demo_type == 1) {
                if (result.demo.length > 0 && result.demo.length >= 5) {  // Data already exist so now check length must be < 5
                    throw 'ALREADY_5_IMAGES_EXIST'
                }
                // Check count of existing image and new images... Total must be less then 5.. 
                // console.log("length============", result.demo[0].demo_data.mediaPath.length + req.files['demo_data'].length)
                if (result.demo.length > 0 && (result.demo[0].demo_data.mediaPath.length + req.files['demo_data'].length) > 5) {
                    throw 'MAX_IMAGE_UPLOAD_LIMIT_EXCEED'
                }

                if (req.body.demo_type == 1 && req.files && req.files['demo_data']) {  // For image                 
                    for (let i = 0; i < req.files['demo_data'].length; i++) {
                        await codeHelper.validateRequestImageFilter(req, '', true, '', '', true, 'demo_data', req.body.demo_type)
                        demo_data.push(await S3helper.uploadImageOnS3("tekoto/demo/", req.files['demo_data'][i]));
                    }
                    req.body['demo_data'] = JSON.stringify({ 'mediaPath': demo_data });
                }
                if (result.demo.length > 0) {  // Some images already exist so now just add more images in array ;
                    let temp = result.demo[0].demo_data.mediaPath;          //existing array 
                    for (let i = 0; i < req.files['demo_data'].length; i++) {
                        await codeHelper.validateRequestImageFilter(req, '', true, '', '', true, 'demo_data', req.body.demo_type)
                        temp.push(await S3helper.uploadImageOnS3("tekoto/demo/", req.files['demo_data'][i]));
                    }
                    req.body['demo_data'] = JSON.stringify({ 'mediaPath': temp });
                    await demoGuideHelper.updateRecordIfExists(req.body);
                    console.log("Some images already exist so now just add more images in array");
                } else {   // There is no image data found so just add a new data in db
                    console.log("There is no image data found so just add a new data in db");
                    await demoGuideHelper.addEditDemoGuide(req.body);
                }
            }
            if (req.body.demo_type == 2) {
                let video_data = [];
                let demo_data = [];
                if (req.body.demo_type == 2 && req.files && req.files['videoThumb'] && req.files['demo_data']) {  // For video
                    console.log("req files=========", req.files['videoThumb'])
                    await codeHelper.validateRequestImageFilter(req, '', true, '', '', true, 'videoThumb', req.body.demo_type)
                    video_data.push(await S3helper.uploadImageOnS3("tekoto/demo/", req.files['videoThumb'][0]));
                    demo_data.push(await S3helper.uploadImageOnS3("tekoto/demo/", req.files['demo_data'][0]));
                    req.body['demo_data'] = JSON.stringify({ 'mediaPath': demo_data, 'thumbnail': video_data });
                }
                console.log("req body==============", req.body)
                if (result.demo.length > 0) {  // Some images already exist so now just add more images in array ;
                    console.log(" req.files['videoThumb']", req.files)
                    let thumbUrl = await S3helper.uploadImageOnS3("tekoto/demo/", req.files['videoThumb'][0]);
                    let mediaUrl = await S3helper.uploadImageOnS3("tekoto/demo/", req.files['demo_data'][0]);
                    req.body['thumbUrl'] = thumbUrl;
                    req.body['mediaUrl'] = mediaUrl;
                    deleteThumbnailPath = result.demo[0].demo_data.thumbnail[0];
                    deleteMediaPath = result.demo[0].demo_data.mediaPath[0];
                    console.log("deleteThumbnailPath",deleteThumbnailPath);
                    console.log("deleteMediaPath",deleteMediaPath)
                    await demoGuideHelper.editVideoGuide(req.body);
                    await S3helper.deleteImageFromS3(deleteThumbnailPath);
                    await S3helper.deleteImageFromS3(deleteMediaPath)
                    console.log("video  already exist so now just update video record");
                } else {   // There is no image data found so just add a new data in db
                    console.log("There is no image data found so just add a new data in db");
                    await demoGuideHelper.addEditDemoGuide(req.body);
                }
            }
            responseHelper.success(res, 'ADD_DEMO_GUIDE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async editDemoGuide(req, res) {
        try {
            // delete req.body.user_id;
            console.log("body======", req)
            console.log("req.fiel", req.files);
            let result = await demoGuideHelper.selectDemo(req.body);
            if (req.body.demo_type == 1) {
                if(req.files['demo_data']){
                    let url = await S3helper.uploadImageOnS3("tekoto/demo/", req.files['demo_data'][0])
                    req.body['url'] = url;
                    await demoGuideHelper.editDemoGuide(req.body, result.demo);
                    let index = result.demo[0].demo_data.mediaPath.findIndex(x => x == req.body.old_image);
                    await S3helper.deleteImageFromS3(result.demo[0].demo_data.mediaPath[index])
                }else{
                    let index = result.demo[0].demo_data.mediaPath.findIndex(x => x == req.body.old_image);
                    req.body['url'] = result.demo[0].demo_data.mediaPath[index];
                    await demoGuideHelper.editDemoGuide(req.body, result.demo);
                }
            }
            if (req.body.demo_type == 2) {
                let mediaUrl = await S3helper.uploadImageOnS3("tekoto/demo/", req.files['demo_data'][0])
                let thumbUrl = await S3helper.uploadImageOnS3("tekoto/demo/", req.files['videoThumb'][0])
                req.body['mediaUrl'] = mediaUrl;
                req.body['thumbUrl'] = thumbUrl;
                await demoGuideHelper.editVideoGuide(req.body);
                let deleteThumbnailPath;
                if (req.body.demo_type == 2) {
                    deleteThumbnailPath = result.demo[0].demo_data.thumbnail[0]
                }
                // console.log(" req.body.old_image===============", req.body.old_image)
                // let index = result.demo[0].demo_data.mediaPath.findIndex(x => x == req.body.old_image);
                // console.log("index=============",index);
                console.log("result.demo[0]================", result.demo[0])
                await S3helper.deleteImageFromS3(result.demo[0].demo_data.mediaPath[0])
                if (req.body.demo_type == 2) {
                    await S3helper.deleteImageFromS3(deleteThumbnailPath);
                }
            }
            responseHelper.success(res, 'EDIT_DEMO_GUIDE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async deleteDemoGuide(req, res) {
        try {
            delete req.body.user_id;
            console.log("req.body", req.body)
            let result = await demoGuideHelper.selectDemo(req.body);
            let deleteImagePath = result.demo[0].demo_data.mediaPath[req.body.id];
            let deleteThumbnailPath;
            if (req.body.demo_type == 2) {
                deleteThumbnailPath = result.demo[0].demo_data.thumbnail[0]
            }
            console.log("result demo==============", result.demo[0].demo_data.mediaPath[req.body.id])
            await demoGuideHelper.deleteDemoGuide(req.body, result.demo);
            await S3helper.deleteImageFromS3(deleteImagePath);
            if (req.body.demo_type == 2) {
                await S3helper.deleteImageFromS3(deleteThumbnailPath);
            }
            responseHelper.success(res, 'DELETE_DEMO_GUIDE_SUCCESS', req.headers.language)
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
    async getAllDemo(req, res) {
        try {
            // await demoGuideValidator.validateGetAllDemoForm(req.body)
            let demo = await demoGuideHelper.selectDemo(req.body)
            responseHelper.success(res, 'GET_DEMO_SUCCESS', req.headers.language, { total: Number(demo.demoCount), total_page: Math.ceil(demo.demoCount / config.paginationCount), demo: demo.demo })
        } catch (error) {
            console.log(error)
            responseHelper.error(res, error, req.headers.language)
        }
    }
}
module.exports = new DemoGuide()