"use strict";
import {ResponseController} from "../../util/response.controller";

export class UserController {

    constructor(loggerInstance, config, userModel, roleInstance) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.userModel = userModel;
        this.roleInstance = roleInstance;
    }

    login(req, res) {

        let email = req.body.email;

        ((that) => {
            that.userModel.findOne({ email: email }, function (err, user) {
                if (err) {
                    that.loggerInstance.error("User Login DB Error");
                    return res.json(new ResponseController(err.statusCode, "User Login DB Error", err));
                }

                if (user) {
                    return (user.authenticate(req.body.password) ?
                        res.json(new ResponseController(200, "Login User Details", user.toJSON())) :
                        res.json(new ResponseController(400, "Invalid password")));
                } else {
                    that.loggerInstance.debug("User Not Found");
                    return res.json(new ResponseController(200, "User Not Found"));
                }
            });
        })(this);
    }

    register(req, res) {

        let newEmail = req.body.email,
            newUserpassword = req.body.password,
            role = req.body.role;


        this.roleInstance.findRoleByName(role).then(roleDetails => {
           if(roleDetails) {
               ((that) => {
                   that.userModel.findOne({ email: newEmail }, function (err, user) {

                       if (err) {
                           that.loggerInstance.error("DB Error");
                           return res.json(new ResponseController(err.statusCode, "DB Error", err));
                       }

                       if (user) {
                           that.loggerInstance.debug("User Already Exists");
                           return res.json(new ResponseController(200, "User Already Exists", user));
                       } else {
                           let newUser = new that.userModel({
                               email: newEmail,
                               password: newUserpassword,
                               roleId: roleDetails._id,
                               passwordHash: JSON.stringify(req.body.passwordHash),
                               passwordSalt: req.body.passwordSalt
                           });


                           newUser.save(function (err, user, numberAffected) {

                               if (err) {
                                   that.loggerInstance.error("Db Error");
                                   return res.json(new ResponseController(err.statusCode, "Db Error", err));
                               }

                               if (numberAffected === 1) {
                                   that.loggerInstance.info("User Register Done");
                                   return res.json(new ResponseController(200, "User Register Done", user));
                               } else {
                                   that.loggerInstance.debug("User Not Created");
                                   return res.json(new ResponseController(200, "User Not Created"));
                               }
                           });
                       }
                   });
               })(this);


           } else {
               this.loggerInstance.error(`Role Details not found for role ${role}`);
               return res.json(new ResponseController(err.statusCode, "DB Error", err));
           }
        });


    }

    resetPassword(req, res) {

        let email = req.body.email;

        ((that) => {
            that.userModel.findOne({ email: email }, function (err, user) {

                if (err) {
                    that.loggerInstance.error("DB Error");
                    return res.json(new ResponseController(err.statusCode, "DB Error", err));
                }

                if (user) {
                    return res.json(new ResponseController(200, "Mailer User Details", user));
                } else {
                    that.loggerInstance.debug("Mailer User Details Not Found");
                    return res.json(new ResponseController(200, "Mailer User Details Not Found"));
                }
            })
        })(this);
    }

    resetPasswordFinal(req, res) {

        let email = req.body.email,
            passwordHash = req.body.passwordHash,
            passwordSalt = req.body.passwordSalt;

        ((that) => {
            that.userModel.update({ email: email }, { passwordHash: passwordHash, passwordSalt: passwordSalt }, function (err, numberAffected) {

                if (err) {
                    that.loggerInstance.error("DB Error");
                    return res.json(new ResponseController(err.statusCode, "DB Error", err));
                }

                if (numberAffected < 1) {
                    that.loggerInstance.debug("Could Not Reset Password");
                    return res.json(new ResponseController(200, "Could Not Reset Password"));
                } else {
                    that.loggerInstance.info("Reset Password Success");
                    return res.json(new ResponseController(200, "Reset Password Success"));
                }
            });
        })(this);
    }
}
