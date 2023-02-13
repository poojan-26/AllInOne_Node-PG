const promise = require('bluebird')
const dateHelper = require('../../utils/dateHelper')
const db = require('../../utils/db')
const config = require('../../utils/config')

class DemoGuideHelper {
    async addEditDemoGuide(body) {
        console.log("in add==============================================")
        try {
            let data = {
                is_active: ('is_active') in body ? body.is_active : 0,
                created_date: dateHelper.getCurrentTimeStamp(),
                modified_date: dateHelper.getCurrentTimeStamp(),
                demo_type: body.demo_type
            }
            if ('demo_data' in body) {
                data['demo_data'] = body.demo_data
            }
            console.log("data================", data)
            let result = await db.insert('mst_demo', data)
            return result
        } catch (error) {
            return promise.reject(error)
        }
    }
    async updateRecordIfExists(body, demo) {
        console.log("body==============", body)
        // return
        let data = {
            is_active: ('is_active') in body ? body.is_active : 0,
            modified_date: dateHelper.getCurrentTimeStamp(),
            demo_type: body.demo_type,
            demo_data: body.demo_data
        }
        console.log("data===========", data)
        let where = `demo_type=${body.demo_type} AND is_active=0`
        return await db.update('mst_demo', where, data)
    }
    async editDemoGuide(body, demo) {
        try {
            let index = demo[0].demo_data.mediaPath.findIndex(x => x == body.old_image);
            console.log("index===============================", index);
            let data = {
                is_active: ('is_active') in body ? body.is_active : 0,
                modified_date: dateHelper.getCurrentTimeStamp(),
                demo_type: body.demo_type
            }
            if ('url' in body && body.url !== 'undefined' && demo != undefined) {
                console.log("demo ========================        ", demo[0])
                demo[0].demo_data.mediaPath[index] = body.url;
                data['demo_data'] = JSON.stringify({ 'mediaPath': demo[0].demo_data.mediaPath })
            }
            let where = `demo_type=${body.demo_type} AND is_active=0`
            return await db.update('mst_demo', where, data)
        } catch (error) {
            return promise.reject(error)
        }
    }
    async editVideoGuide(body) {
        try {
            let data = {
                is_active: ('is_active') in body ? body.is_active : 0,
                modified_date: dateHelper.getCurrentTimeStamp(),
                demo_type: body.demo_type
            }
            if ('mediaUrl' in body && body.mediaUrl !== 'undefined' && 'thumbUrl' in body && body.thumbUrl !== 'undefined') {
                data['demo_data'] = JSON.stringify({ 'mediaPath': [body.mediaUrl], 'thumbnail': [body.thumbUrl] })
            }
            console.log("data====================",data)
            let where = `demo_type=${body.demo_type} AND is_active=0`
            return await db.update('mst_demo', where, data)
        } catch (error) {
            return promise.reject(error)
        }
    }
    async selectDemo(body) {
        try {
            let selectParams = "*",
                where = ` is_active = 0 AND demo_data IS NOT NULL`;
                
            if ('demo_type' in body) {
                where += ` AND demo_type=${body.demo_type}`
            }
            let demo = await db.select('mst_demo', selectParams, where),
                demoCount = await db.select('mst_demo', `COUNT(*)`, where)
            return { demo, demoCount: demoCount[0].count }
        } catch (error) {
            return promise.reject(error)
        }
    }
    async deleteDemoGuide(body, demo) {
        console.log("body==================", body)
        console.log("demo", demo[0].demo_data.mediaPath);
        try {
            let where = `demo_type=${body.demo_type} AND is_active=0`;
            if (body.demo_type == 1) {
                demo[0].demo_data.mediaPath.splice(body.id, 1);
            } else {
                return await db.delete('mst_demo', where)
            }
            console.log("thumbnail===========", demo[0].demo_data)
            let data = {
                is_active: ('is_active') in body ? body.is_active : 0,
                modified_date: dateHelper.getCurrentTimeStamp(),
                demo_type: body.demo_type
            }
            data['demo_data'] = JSON.stringify({ 'mediaPath': demo[0].demo_data.mediaPath })
            console.log("data==============", data)
            return await db.update('mst_demo', where, data)
        } catch (error) {
            return promise.reject(error)
        }
    }
}
module.exports = new DemoGuideHelper();