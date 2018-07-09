"use strict";

import express from "express";
import {getStudyMaterialControllerInstance} from "./studyMaterial.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    getStudyMaterialRoute = router.route("/getStudyMaterial/:id?"),
    createStudyMaterialRoute = router.route("/createStudyMaterial"),
    updateStudyMaterialRoute = router.route("/updateStudyMaterial/:id"),
    updateMaterialConceptRoute = router.route("/updateMaterialConcept/:id"),
    studyMaterialInstance = getStudyMaterialControllerInstance();

getStudyMaterialRoute.get(studyMaterialInstance.getStudyMaterial.bind(studyMaterialInstance));
createStudyMaterialRoute.post(studyMaterialInstance.createStudyMaterial.bind(studyMaterialInstance));
updateStudyMaterialRoute.patch(studyMaterialInstance.updateStudyMaterial.bind(studyMaterialInstance));
updateMaterialConceptRoute.post(studyMaterialInstance.updateMaterialConcept.bind(studyMaterialInstance));

export default router;