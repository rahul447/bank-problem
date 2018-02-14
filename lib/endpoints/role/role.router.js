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
    roleInstance = new RoleController(loggerInstance, config, Role);

createRoleRoute.post(roleInstance.createRole.bind(roleInstance));

export default router;