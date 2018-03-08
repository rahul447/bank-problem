"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {VideoController} from "./video.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    saveVideoDetailsRoute = router.route("/saveVideoDetails"),
    getVideoRoute = router.route("/getVideo/:id"),
    videoInstance = new VideoController(loggerInstance, config);

getVideoRoute.get(videoInstance.getVideo.bind(videoInstance));
saveVideoDetailsRoute.post(videoInstance.saveVideoDetails.bind(videoInstance));

export default router;