"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {AudioController} from "./audio.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    saveAudioDetailsRoute = router.route("/saveAudioDetails"),
    getAudioRoute = router.route("/getAudio/:id"),
    editAudioRoute = router.route("/editAudio"),
    audioInstance = new AudioController(loggerInstance, config);

getAudioRoute.get(audioInstance.getAudio.bind(audioInstance));
editAudioRoute.post(audioInstance.editAudio.bind(audioInstance));
saveAudioDetailsRoute.post(audioInstance.saveAudioDetails.bind(audioInstance));

export default router;