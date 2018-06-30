"use strict";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";
import {
    sendClientError,
    sendServerError,
    sendSuccess
} from '../../util/responseLogger';
export class RoleController {

    constructor(loggerInstance, config, roleModel) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.roleModel = roleModel;
    }

    createRole(req, res) {
        let {role, description, clientId, featureLevelPermissions, allowAll} = req.body;

        featureLevelPermissions = featureLevelPermissions && JSON.parse(featureLevelPermissions);

        ((that) => {
            this.roleModel.findOne({ role }, function (err, oldRole) {

                if (err) {
                    that.loggerInstance.error("Role find DB Error");
                    return res.json(new ResponseController(err.statusCode, "Role find DB Error", err));
                }

                if (oldRole) {
                    that.loggerInstance.debug("Role Already Exists");
                    return res.json(new ResponseController(200, "Role Already Exists", oldRole));
                } else {

                    let newRole = new that.roleModel({
                        role,
                        description,
                        clientId,
                        featureLevelPermissions,
                        allowAll
                    });

                    newRole.save(function (err, role, numberAffected) {

                        if (err) {
                            that.loggerInstance.error("Role save Db Error");
                            return res.json(new ResponseController(err.statusCode, "Role save Db Error",
                                err));
                        }

                        if (numberAffected === 1) {
                            that.loggerInstance.info("New Role Created");
                            return res.json(new ResponseController(200, "New Role Created", role));
                        } else {
                            that.loggerInstance.debug("Role Not Created");
                            return res.json(new ResponseController(200, "Role Not Created"));
                        }
                    });
                }
            });
        })(this);
    }

    findRoleByName(roleName) {

        return new Promise((resolve, reject) => {

            (that => {
                this.roleModel.findOne({ role: roleName }, function (err, roleDetails) {

                    if (err) {
                        that.loggerInstance.error("Role find DB Error");
                        reject(err);
                    }

                    if (roleDetails) {
                        that.loggerInstance.debug("Role Details Fetch Success");
                        resolve(roleDetails);
                    } else {
                        that.loggerInstance.debug(`Role Details not Found for role ${roleName}`);
                        resolve();
                    }
                });
            })(this);

        });
    }

    getRoleDetails(req, res) {
        this.roleModel.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, (err, roleDetails) => {
            if (err) {
                this.loggerInstance.error("Role find DB Error");
                return res.json(new ResponseController(err.statusCode, "Role Get Db Error", err));
            }

            this.loggerInstance.info("Role Get Success");
            return res.json(new ResponseController(200, "Role Get Success", roleDetails));
        })
    }

    async findOrCreateRole(req, res) {
        try {
            const {
                roleName
            } = req.body;
            if (!roleName) {
                return sendClientError({
                    res,
                    responseMessage: 'Role name is mandatory'
                });
            }
            let roleWithName = await this.roleModel.find({ role: roleName });
            let responseMessage = 'Role ID with given name found';
            if (!roleWithName) {
                let newRole = new this.roleModel({
                    role: roleName
                });
                roleWithName = await newRole.save();
                responseMessage = 'Role ID with given name was created, contact CMS Admin to modify settings';
            }
            const {
                _id, role, description, createdAt, updatedAt
            } = roleWithName;
            const responseObject = {
                _id, roleName: role, description, createdAt, updatedAt
            };
            return sendSuccess({
                res,
                responseObject,
                responseMessage
            });
        } catch (error) {
            return sendServerError({
                res,
                responseMessage: 'Server Error in Role find or Create'
            });
        }
    }

    async listRoles(req, res) {
        try {
            const roles = await this.roleModel.find({}, {
                _id: 1,
                roleName: 1,
                description: 1,
                createdAt: 1,
                updatedAt: 1
            });
            const responseObject = roles;
            return sendSuccess({
                res,
                responseObject,
                responseMessage: 'Listing roles successful'
            });
        } catch (error) {
            return sendServerError({
                res,
                responseMessage: 'Server Error in Role find or Create'
            });
        }
    }
}
