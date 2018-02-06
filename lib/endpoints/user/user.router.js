"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {UserController} from "./user.controller";
import {RoleController} from "../role/role.controller";
import User from "./user.model";
import Role from "../role/role.model";


let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    loginRoute = router.route("/login"),
    registerRoute = router.route("/register"),
    resetPasswordRoute = router.route("/resetPassword"),
    resetPasswordFinalRoute = router.route("/resetPasswordFinal"),
    roleInstance = new RoleController(loggerInstance, config, Role),
    userInstance = new UserController(loggerInstance, config, User, roleInstance);


loginRoute.post(userInstance.login.bind(userInstance));
registerRoute.post(userInstance.register.bind(userInstance));
resetPasswordRoute.put(userInstance.resetPassword.bind(userInstance));
resetPasswordFinalRoute.put(userInstance.resetPasswordFinal.bind(userInstance));

export default router;