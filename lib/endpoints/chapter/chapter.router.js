"use strict";

import express from "express";
import {getChapterControllerInstance} from "./chapter.controller";

let router = express.Router(),
    chapterBySubjectRoute = router.route("/chapterListBySubject"),
    getSubjectsChaptersFromElasticRoute = router.route("/getSubjectsChaptersFromElastic"),
    chapterInstance = getChapterControllerInstance();

chapterBySubjectRoute.get(chapterInstance.chapterListBySubject.bind(chapterInstance));
getSubjectsChaptersFromElasticRoute.get(chapterInstance.getSubjectsChaptersFromElastic.bind(chapterInstance));
export default router;