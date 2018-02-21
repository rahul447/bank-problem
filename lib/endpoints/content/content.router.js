"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {ContentController} from "./content.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    contentListRoute = router.route("/contentList"),
    totalCountByContentRoute = router.route("/totalCountByContent"),
    contentInstance = new ContentController(loggerInstance, config);

contentListRoute.post(contentInstance.contentList.bind(contentInstance));
totalCountByContentRoute.post(contentInstance.totalCountByContent.bind(contentInstance));

export default router;