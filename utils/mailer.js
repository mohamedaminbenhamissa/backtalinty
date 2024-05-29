'use strict';
const nodemailer = require('nodemailer');
const fs = require('fs');
const { promisify } = require('util');
const sendHtmlEmail = async (email, subject, payload) => {
    try {
        const transport = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PWD,
            },
        });

        const options = () => {
            return {
                from: "L'équipe RH Talenty  <astrolabit@gmail.com>",
                to: email,
                subject: subject,
                html: payload,
            };
        };

        // Send email
        return await transport.sendMail(options()).then((result) => {
            if (result) {
                return true;
            } else {
                return false;
            }
        });
    } catch (error) {
        return error;
    }
};
module.exports = { sendHtmlEmail };
