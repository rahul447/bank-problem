"use strict";

import express from "express";
import {getVideoControllerInstance} from "./video.controller";

let router = express.Router(),
    saveVideoDetailsRoute = router.route("/saveVideoDetails"),
    editVideoRoute = router.route("/editVideo"),
    getVideoRoute = router.route("/getVideo/:id"),
    updateVideoTagsRoute = router.route("/updateVideoTags/:id"),
    updateVideoConceptRoute = router.route("/updateVideoConcept/:id"),
    videoInstance = getVideoControllerInstance();

getVideoRoute.get(videoInstance.getVideo.bind(videoInstance));
editVideoRoute.post(videoInstance.editVideo.bind(videoInstance));
saveVideoDetailsRoute.post(videoInstance.saveVideoDetails.bind(videoInstance));
updateVideoTagsRoute.post(videoInstance.updateVideoTags.bind(videoInstance));
updateVideoConceptRoute.post(videoInstance.updateVideoConcept.bind(videoInstance));

export default router;