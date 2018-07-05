"use strict";

import express from "express";
import {getUserControllerInstance} from "./user.controller";


let router = express.Router(),
    loginRoute = router.route("/login"),
    registerRoute = router.route("/register"),
    resetPasswordRoute = router.route("/resetPassword"),
    resetPasswordFinalRoute = router.route("/resetPasswordFinal"),
    fetchUsersRoute = router.route("/fetchUsers"),
    pushTokenToDbRoute = router.route("/pushTokenToDb"),
    logoutRoute = router.route("/logout"),

    userInstance = getUserControllerInstance();

loginRoute.post(userInstance.login.bind(userInstance));
registerRoute.post(userInstance.register.bind(userInstance));
resetPasswordRoute.put(userInstance.resetPassword.bind(userInstance));
resetPasswordFinalRoute.put(userInstance.resetPasswordFinal.bind(userInstance));
fetchUsersRoute.get(userInstance.fetchUsers.bind(userInstance));
pushTokenToDbRoute.put(userInstance.pushTokenToDb.bind(userInstance));
logoutRoute.put(userInstance.logout.bind(userInstance));


export default router;