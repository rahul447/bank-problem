"use strict";
import {ResponseController} from "../../util/response.controller";

export class UserController {

    constructor(loggerInstance, config, userModel, crypto, uuid, nodemailer) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.userModel = userModel;
        this.crypto = crypto;
        this.uuid = uuid;
        this.nodemailer = nodemailer;
    }

    login(req, res) {
        if(!req.body.email && req.body.password) {
            this.loggerInstance.debug("Email and Password Not Found");
            return res.json(new ResponseController(200, "Email and Password Not Found"));
        }


        let email = req.body.email,
            password = req.body.password;

        this.userModel.findOne({ email: email }, function (err, user) {

            if (err) {
                this.loggerInstance.error("User Login DB Error");
                return res.json(new ResponseController(err.statusCode, "User Login DB Error", err));
            }

            if (user) {

                this.hashPassword(password, user.passwordSalt, (err, passwordHash) => {

                    if (passwordHash === user.passwordHash) {

                        this.session.userDetails = user;

                        this.loggerInstance.info("User Login Done");
                        return res.json(new ResponseController(200, "User Login Done", {"userDetails":
                            this.session.userDetails}));

                    } else {
                        this.loggerInstance.debug("User Password Not Matched");
                        return res.json(new ResponseController(200, "User Password Not Matched"));
                    }
                });
            } else {
                this.loggerInstance.debug("User Not Found");
                return res.json(new ResponseController(200, "User Not Found"));
            }
        });
    }

    register(req, res) {

        if(!req.body.email && req.body.password) {
            this.loggerInstance.debug("Email and Password Not Found");
            return res.json(new ResponseController(200, "Email and Password Not Found"));
        }


        let newUser = req.body.email,
            newUserpassword = req.body.password;

        this.userModel.findOne({ email: newUser }, function (err, user) {

            if (err) {
                this.loggerInstance.error("DB Error");
                return res.json(new ResponseController(err.statusCode, "DB Error", err));
            }

            if (user) {
                this.loggerInstance.debug("User Already Exists");
                return res.json(new ResponseController(200, "User Already Exists", user));
            } else {

                let newUser = new this.userModel({
                    email: newUser,
                    password: newUserpassword,
                    firstName: req.body.firstName || "",
                    lastName: req.body.lastName || ""
                });


                newUser.save(function (err, user, numberAffected) {

                    if (err) {
                        this.loggerInstance.error("Db Error");
                        return res.json(new ResponseController(err.statusCode, "Db Error", err));
                    }

                    if (numberAffected === 1) {
                        this.loggerInstance.info("User Register Done");
                        return res.json(new ResponseController(200, "User Register Done", {"userDetails":
                            user}));
                    } else {
                        this.loggerInstance.debug("User Not Created");
                        return res.json(new ResponseController(200, "User Not Created"));
                    }
                });
            }
        });
    }

    logout(req, res) {
        if (this.session.userDetails)
            delete this.session.userDetails;
        this.loggerInstance.info("Logout Success");
        return res.json(new ResponseController(200, "Logout Success"));
    }

    resetPassword(req, res) {

        if(!req.body.email) {
            this.loggerInstance.debug("Email Not Found");
            return res.json(new ResponseController(200, "Email Not Found"));
        }


        let email = req.body.email;

        this.userModel.findOne({ email: email }, function (err, user) {

            if (err) {
                this.loggerInstance.error("DB Error");
                return res.json(new ResponseController(err.statusCode, "DB Error", err));
            }

            if (user) {
                // Save the user's email and a password reset hash in session. We will use
                let passwordResetHash = this.uuid.v4();
                this.session.passwordResetHash = passwordResetHash;
                this.session.emailWhoRequestedPasswordReset = email;

                this.sendPasswordResetHash(email, passwordResetHash);

                this.loggerInstance.info("Reset password Mailer Sent");
                return res.json(new ResponseController(200, "Reset password Mailer Sent", user));

            } else {
                this.loggerInstance.info("Email Not Found");
                return res.json(new ResponseController(200, "Email Not Found"));
            }
        })
    }

    sendPasswordResetHash(email, passwordResetHash) {
        let smtpTransport = this.nodemailer.createTransport('SMTP', {
            service: 'SendGrid',
            auth: {
                user: '!!! YOUR SENDGRID USERNAME !!!',
                pass: '!!! YOUR SENDGRID PASSWORD !!!'
            }
        });

        if(!req.headers.host || !req.headers.port || !passwordResetHash || !email) {
            this.loggerInstance.debug("mail Request not valid");
        }else {
            let passwordResetUrl = `http://${req.headers.host}:${req.headers
                .port}/reset/${passwordResetHash}`;

            let mailOptions = {
                to: email,
                from: 'rahul.khanna@edfora.com',
                subject: 'CMSV2 Password Reset',
                text: `You are receiving this because you (or someone else) have requested the reset of the password for your account on CMSV2. Please click on the following link, or paste this into your browser to complete the process: ${passwordResetUrl}. If you did not request this, please ignore this email and your password will remain unchanged`
            };

            smtpTransport.sendMail(mailOptions);
        }
    }

    resetPasswordFinal(req, res) {
        if(!req.body.email && !req.body.newPassword && !req.body.passwordResetHash) {
            this.loggerInstance.debug("Reset Password Final Request not valid");
            return res.json(new ResponseController(200, "Reset Password Final Request not valid"));
        }


        if(!this.session) {
            this.loggerInstance.debug("Session Not Exists");
            return res.json(new ResponseController(200, "Session Not Exists"));
        }

        if (!this.session.passwordResetHash !== req.body.passwordResetHash) {
            this.loggerInstance.debug("Password Reset Hash Mismatch");
            return res.json(new ResponseController(200, "Password Reset Hash Mismatch"));
        }

        if (!this.session.emailWhoRequestedPasswordReset !== req.body.email) {
            this.loggerInstance.debug("Password Reset Email Mismatch");
            return res.json(new ResponseController(200, "Password Reset Email Mismatch"));
        }

        let passwordSalt = uuid.v4(),
            newPassword = req.body.newPassword,
            email = req.body.email;

        this.hashPassword(newPassword, passwordSalt, (err, passwordHash) => {

            this.userModel.update({ email: email }, { passwordHash: passwordHash, passwordSalt: passwordSalt }, function (err, numberAffected) {

                if (err) {
                    this.loggerInstance.error("DB Error");
                    return res.json(new ResponseController(err.statusCode, "DB Error", err));
                }

                if (numberAffected < 1) {
                    this.loggerInstance.debug("Could Not Reset Password");
                    return res.json(new ResponseController(200, "Could Not Reset Password"));
                } else {
                    this.loggerInstance.info("Reset Password Success");
                    return res.json(new ResponseController(200, "Reset Password Success"));
                }
            });
        });
    }

    setSession(session) {
        this.session = session;
    }

    getSession() {
        return this.session;
    }

    hashPassword(password, salt, callback) {
        // We use pbkdf2 to hash and iterate 10k times by default
        let iterations = 10000,
            keyLen = 64; // 64 bit.
        this.crypto.pbkdf2(password, salt, iterations, keyLen, callback);
    }
}
