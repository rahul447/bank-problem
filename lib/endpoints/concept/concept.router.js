"use strict";

import express from "express";
import {getConceptControllerInstance} from "./concept.controller";

let router = express.Router(),
    conceptByChapterRoute = router.route("/conceptListByChapter"),
    fetchConceptIdsByChapterRoute = router.route("/fetchConceptIdsByChapter"),
    getSubjectsChaptersConceptsFromElasticRoute = router.route("/getSubjectsChaptersConceptsFromElastic"),
    conceptInstance = getConceptControllerInstance();

conceptByChapterRoute.get(conceptInstance.conceptListByChapter.bind(conceptInstance));
fetchConceptIdsByChapterRoute.post(conceptInstance.fetchConceptIdsByChapter.bind(conceptInstance));
getSubjectsChaptersConceptsFromElasticRoute.get(conceptInstance.getSubjectsChaptersConceptsFromElastic.bind(conceptInstance));
export default router;