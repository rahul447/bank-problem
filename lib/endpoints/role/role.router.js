"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {RoleController} from "./role.controller";
import Role from "./role.model";


let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    createRoleRoute = router.route("/"),
    getRoleDetailsRoute = router.route("/getRoleDetails/:id"),
    roleInstance = new RoleController(loggerInstance, config, Role);

createRoleRoute.post(roleInstance.createRole.bind(roleInstance));
getRoleDetailsRoute.get(roleInstance.getRoleDetails.bind(roleInstance));
router.route('/findOrCreate').get(roleInstance.findOrCreateRole.bind(roleInstance));
router.route('/').get(roleInstance.listRoles.bind(roleInstance));

export default router;