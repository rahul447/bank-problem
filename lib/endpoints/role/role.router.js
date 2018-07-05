"use strict";

import express from "express";
import {getRoleControllerInstance} from "./role.controller";

let router = express.Router(),
    createRoleRoute = router.route("/"),
    getRoleDetailsRoute = router.route("/getRoleDetails/:id"),
    roleInstance = getRoleControllerInstance();

createRoleRoute.post(roleInstance.createRole.bind(roleInstance));
getRoleDetailsRoute.get(roleInstance.getRoleDetails.bind(roleInstance));
router.route('/findOrCreate').get(roleInstance.findOrCreateRole.bind(roleInstance));
router.route('/').get(roleInstance.listRoles.bind(roleInstance));

export default router;