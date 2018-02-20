"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {AudioController} from "./audio.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    saveAudioDetailsRoute = router.route("/saveAudioDetails"),
    audioInstance = new AudioController(loggerInstance, config);

saveAudioDetailsRoute.post(audioInstance.saveAudioDetails.bind(audioInstance));

export default router;