"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {StudyMaterialController} from "./studyMaterial.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    getStudyMaterialRoute = router.route("/getStudyMaterial/:id?"),
    createStudyMaterialRoute = router.route("/createStudyMaterial"),
    updateStudyMaterialRoute = router.route("/updateStudyMaterial/:id"),
    studyMaterialInstance = new StudyMaterialController(loggerInstance, config);

getStudyMaterialRoute.get(studyMaterialInstance.getStudyMaterial.bind(studyMaterialInstance));
createStudyMaterialRoute.post(studyMaterialInstance.createStudyMaterial.bind(studyMaterialInstance));
updateStudyMaterialRoute.patch(studyMaterialInstance.updateStudyMaterial.bind(studyMaterialInstance));

export default router;