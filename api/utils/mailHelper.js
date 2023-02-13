const nodemailer = require('nodemailer');
const config = require('./config')
const fs = require('fs');

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: config.mailerEmail,
        pass: config.mailerPassword
    }
});

class Mailer {
    async sendOTPMail(toMail, name, otp, For) {
        try {
            await fs.readFile(__dirname + '/mailTemplates/OTPTemplate.html', 'utf8', function (err, file) {
                if (err) {
                    console.log('ERROR -> read OTPTemplate.html  file !', err);
                    throw err
                } else {
                    let subject = `MotoLogs - Message`,
                        otpIsFor = "",
                        message = file
                    switch (For) {
                        case "signup":
                            otpIsFor = " sign up"
                            break;
                        case "signin":
                            otpIsFor = " sign in"
                            break;
                        case "verifyEmail":
                            otpIsFor = " verify email"
                            break;
                        case "emailChange":
                            otpIsFor = " change email"
                            break;
                        case "resetPassword":
                            otpIsFor = " reset password"
                            break;
                        default:
                            otpIsFor = ""
                            break;
                    }
                    message = message.replace("@@IMAGE_LOGO@@", config.colorLogoLink);
                    message = message.replace("@@USER@@", name ? name : "User");
                    message = message.replace("@@OTP@@", otp);
                    message = message.replace("@@OTP_IS_FOR@@", otpIsFor);
                    let mailOptions = {
                        from: config.mailerEmail,
                        to: toMail,
                        subject: subject,
                        html: message
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                            throw error
                        } else {
                            console.log('Email sent: ' + JSON.stringify(info));
                        }
                    });
                }
            })
        } catch (error) {
            console.log(error)
        }
    }
    async sendForgotPasswordMail(toMail, link) {
        try {
            await fs.readFile(__dirname + '/mailTemplates/forgotPasswordLinkTemplate.html', 'utf8', function (err, file) {
                if (err) {
                    console.log('ERROR -> read forgotPasswordLinkTemplate.html  file !', err);
                    throw err
                } else {
                    let subject = `MotoLogs - Message`,
                        message
                    message = file;
                    message = message.replace("@@IMAGE_LOGO@@", config.colorLogoLink);
                    message = message.replace("@@LINK@@", link);
                    let mailOptions = {
                        from: config.mailerEmail,
                        to: toMail,
                        subject: subject,
                        html: message
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                            throw error
                        } else {
                            console.log('Email sent: ' + JSON.stringify(info));
                        }
                    });
                }
            })
        } catch (error) {
            console.log(error)
        }
    }

    async sendServiceProviderMail(toMail) {
        try {
            let link = 'APP_LINK'
            await fs.readFile(__dirname + '/mailTemplates/serviceProviderTemplate.html', 'utf8', function (err, file) {
                if (err) {
                    console.log('ERROR -> read serviceProviderTemplate.html file !', err);
                    throw err
                } else {
                    let subject = `MotoLogs - Message`,
                        message
                    message = file;
                    message = message.replace("@@IMAGE_LOGO@@", config.colorLogoLink);
                    message = message.replace("@@LINK@@", link);
                    let mailOptions = {
                        from: config.mailerEmail,
                        to: toMail,
                        subject: subject,
                        html: message
                    };
                    transporter.sendMail(mailOptions, function (error, info) {
                        if (error) {
                            console.log(error);
                            throw error
                        } else {
                            console.log('Email sent: ' + JSON.stringify(info));
                        }
                    });
                }
            })
        } catch (error) {
            console.log(error)
        }
    }
}

module.exports = new Mailer()

