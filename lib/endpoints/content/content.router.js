"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {ContentController} from "./content.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    contentListRoute = router.route("/contentList"),
    contentInstance = new ContentController(loggerInstance, config);

contentListRoute.post(contentInstance.contentList.bind(contentInstance));

export default router;