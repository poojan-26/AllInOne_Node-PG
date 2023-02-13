const config = require('./config')
const AWS = require('aws-sdk')
AWS.config.update({
    accessKeyId: config.awsAccesskey,
    secretAccessKey: config.awsSecretkey
})
const s3 = new AWS.S3()
const promise = require('bluebird');

class S3 { 
    uploadImageOnS3(path, file) {
        // console.log("uploadImageOnS3", path)
        // console.log("uploadImageOnS3", file)
        return new promise((resolve, reject) => {
            let fileName;
            let params;
            // if (file.mimetype.includes('video')) {
            //     fileName = this.createImageThumbnail(file)
            // }
            fileName = path + Date.now() + "-" + file.originalname.toString().trim(),
                params = {
                    Bucket: config.s3bucketName,
                    Key: fileName,
                    Body: file.buffer,
                    ACL: 'public-read'
                }
            // console.log("filename=======================", fileName);
            // return            
            s3.putObject(params, (error, result) => {
                console.log("params+++++++++", params)
                console.log(result)
                if (error) {
                    console.log(error)
                    reject({ code: 0, message: 'ERROR_UPLOADING_IMAGE' })
                } else {
                    // console.log(result)
                    resolve(`${config.s3uploadURL}/${fileName}`)
                }
            })
        })
    }

    deleteImageFromS3(fullPath) {
        console.log("fulpath===============",fullPath)
        if (!fullPath) {
            console.log("PATH NOT FOUND")
        } else {
            return new promise((resolve, reject) => {
                let fileName = fullPath.replace(config.s3uploadURL + '/' + config.s3bucketName + '/', ''),
                    params = {
                        Bucket: config.s3bucketName,
                        Key: 'tekoto/'+fileName
                    }
                console.log("\n\n\n\n\n\ [S3 Delete parmas]=============",params)
                s3.deleteObject(params, function (err, data) {
                    if (err) {
                        console.log("error===========", err)
                        console.log(err, err.stack); // an error occurred
                        reject()
                    } else {
                        console.log("delete image data",data)
                        console.log("Delete image successfully...");
                        resolve()
                    }
                });
            })
        }
    }
    // createImageThumbnail(imageData) {
    //     return new promise((resolve, reject) => {
    //         sharp(imageData)
    //             .resize(200)
    //             .toBuffer()
    //             .then((data) => {
    //                 console.log("data==============", data)
    //                 resolve(data)
    //             })
    //             .catch((error) => {
    //                 reject('COMPRESSION_ERROR')
    //             })
    //     })
    // }
}

module.exports = new S3()
