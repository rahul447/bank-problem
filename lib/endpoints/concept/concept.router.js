"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {ConceptController} from "./concept.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    conceptByChapterRoute = router.route("/conceptListByChapter"),
    conceptInstance = new ConceptController(loggerInstance, config);

conceptByChapterRoute.get(conceptInstance.conceptListByChapter.bind(conceptInstance));

export default router;