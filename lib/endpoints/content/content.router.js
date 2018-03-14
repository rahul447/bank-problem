"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {ContentController} from "./content.controller";
import {QuestionController} from "../question/question.controller";

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
    questionInstance = new QuestionController(loggerInstance, config),
    contentInstance = new ContentController(loggerInstance, config, questionInstance);

contentListRoute.post(contentInstance.contentList.bind(contentInstance));
tagListRoute.get(contentInstance.getTagList.bind(contentInstance));
tagValueListRoute.post(contentInstance.getTagValues.bind(contentInstance));
deleteRoute.delete(contentInstance.deleteObject.bind(contentInstance));
totalCountByContentRoute.post(contentInstance.totalCountByContent.bind(contentInstance));
publishContentRoute.put(contentInstance.publishContent.bind(contentInstance));

export default router;