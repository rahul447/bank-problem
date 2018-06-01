"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {ContentController} from "./content.controller";
import {QuestionController} from "../question/question.controller";
import {StudyMaterialController} from "../studyMaterial/studyMaterial.controller";
import {TestController} from "../test/test.controller";
import {FormulaController} from "../formula/formula.controller";
import {AudioController} from "../audio/audio.controller";
import {VideoController} from "../video/video.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    contentListRoute = router.route("/contentList"),
    totalCountByContentRoute = router.route("/totalCountByContent"),
    tagListRoute = router.route("/tagList/:key"),
    tagValueListRoute = router.route("/tagValueList/:key"),
    deleteRoute = router.route("/delete"),
    publishContentRoute = router.route("/publishContent/:id"),
    validateContentRoute = router.route("/validateContent/:id"),
    questionInstance = new QuestionController(loggerInstance, config),
    studyMaterialInstance = new StudyMaterialController(loggerInstance, config),
    testInstance = new TestController(loggerInstance, config),
    formulaInstance = new FormulaController(loggerInstance, config),
    audioInstance = new AudioController(loggerInstance, config),
    videoInstance = new VideoController(loggerInstance, config),
    contentInstance = new ContentController(loggerInstance, config, questionInstance, studyMaterialInstance, testInstance, formulaInstance, audioInstance, videoInstance);

contentListRoute.post(contentInstance.contentList.bind(contentInstance));
tagListRoute.get(contentInstance.getTagList.bind(contentInstance));
tagValueListRoute.post(contentInstance.getTagValues.bind(contentInstance));
deleteRoute.delete(contentInstance.deleteObject.bind(contentInstance));
totalCountByContentRoute.post(contentInstance.totalCountByContent.bind(contentInstance));
publishContentRoute.put(contentInstance.publishContent.bind(contentInstance));
validateContentRoute.put(contentInstance.validateContent.bind(contentInstance));

export default router;