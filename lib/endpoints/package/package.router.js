"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {PackageController} from "./package.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    createPackageRoute = router.route("/createPackage"),
    listPackageRoute = router.route("/listPackage"),
    deletePackageRoute = router.route("/deletePackage/:id"),
    getPackageListCountRoute = router.route("/getPackageListCount"),
    packageInstance = new PackageController(loggerInstance, config);

createPackageRoute.post(packageInstance.createPackage.bind(packageInstance));
listPackageRoute.get(packageInstance.listPackage.bind(packageInstance));
getPackageListCountRoute.get(packageInstance.getPackageListCount.bind(packageInstance));
deletePackageRoute.delete(packageInstance.deletePackage.bind(packageInstance));

export default router;