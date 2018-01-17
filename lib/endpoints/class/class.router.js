"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {ClassController} from "./class.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    classListRoute = router.route("/classList"),
    classInstance = new ClassController(loggerInstance, config);

classListRoute.get(classInstance.classList.bind(classInstance));

export default router;