"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {ConceptController} from "./concept.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    conceptByChapterRoute = router.route("/conceptListByChapter"),
    fetchConceptIdsByChapterRoute = router.route("/fetchConceptIdsByChapter"),
    getSubjectsChaptersConceptsFromElasticRoute = router.route("/getSubjectsChaptersConceptsFromElastic"),
    conceptInstance = new ConceptController(loggerInstance, config);

conceptByChapterRoute.get(conceptInstance.conceptListByChapter.bind(conceptInstance));
fetchConceptIdsByChapterRoute.post(conceptInstance.fetchConceptIdsByChapter.bind(conceptInstance));
getSubjectsChaptersConceptsFromElasticRoute.get(conceptInstance.getSubjectsChaptersConceptsFromElastic.bind(conceptInstance));
export default router;