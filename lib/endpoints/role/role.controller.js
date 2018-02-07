"use strict";
import {ResponseController} from "../../util/response.controller";

export class RoleController {

    constructor(loggerInstance, config, roleModel) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.roleModel = roleModel;
    }

    createRole(req, res) {
        let roleName = req.body.roleName,
            allowAll = req.body.allowAll;

        ((that) => {
            this.roleModel.findOne({ role: roleName }, function (err, oldRole) {

                if (err) {
                    that.loggerInstance.error("Role find DB Error");
                    return res.json(new ResponseController(err.statusCode, "Role find DB Error", err));
                }

                if (oldRole) {
                    that.loggerInstance.debug("Role Already Exists");
                    return res.json(new ResponseController(200, "Role Already Exists", oldRole));
                } else {

                    let newRole = new that.roleModel({
                        role: roleName,
                        allowAll: allowAll
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
}
