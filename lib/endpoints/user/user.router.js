"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {UserController} from "./user.controller";
import User from "./user.model";
import crypto from "crypto";
import uuid from "node-uuid";
import nodemailer from "nodemailer";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    loginRoute = router.route("/login"),
    registerRoute = router.route("/register"),
    logoutRoute = router.route("/logout"),
    resetPasswordRoute = router.route("/resetPassword"),
    resetPasswordFinalRoute = router.route("/resetPasswordFinal"),
    userInstance = new UserController(loggerInstance, config, User, crypto, uuid, nodemailer);


loginRoute.post(userInstance.login.bind(loginRoute));
registerRoute.post(userInstance.register.bind(registerRoute));
logoutRoute.get(userInstance.logout.bind(logoutRoute));
resetPasswordRoute.put(userInstance.resetPassword.bind(resetPasswordRoute));
resetPasswordFinalRoute.put(userInstance.resetPasswordFinal.bind(resetPasswordFinalRoute));

export default router;