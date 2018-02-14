"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {VideoController} from "./video.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    saveVideoDetailsRoute = router.route("/saveVideoDetails"),
    videoInstance = new VideoController(loggerInstance, config);

saveVideoDetailsRoute.post(videoInstance.saveVideoDetails.bind(videoInstance));

export default router;