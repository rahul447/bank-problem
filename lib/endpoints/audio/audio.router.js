"use strict";

import express from "express";
import {getAudioControllerInstance} from "./audio.controller";

let router = express.Router(),
    saveAudioDetailsRoute = router.route("/saveAudioDetails"),
    getAudioRoute = router.route("/getAudio/:id"),
    editAudioRoute = router.route("/editAudio"),
    updateAudioTagsRoute = router.route("/updateAudioTags/:id"),
    updateAudioConceptRoute = router.route("/updateAudioConcept/:id"),

    audioInstance = getAudioControllerInstance();

getAudioRoute.get(audioInstance.getAudio.bind(audioInstance));
editAudioRoute.post(audioInstance.editAudio.bind(audioInstance));
saveAudioDetailsRoute.post(audioInstance.saveAudioDetails.bind(audioInstance));
updateAudioTagsRoute.post(audioInstance.updateAudioTags.bind(audioInstance));
updateAudioConceptRoute.post(audioInstance.updateAudioConcept.bind(audioInstance));
export default router;