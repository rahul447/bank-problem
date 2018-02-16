"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {ChapterController} from "./chapter.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    chapterBySubjectRoute = router.route("/chapterListBySubject"),
    chapterInstance = new ChapterController(loggerInstance, config);

chapterBySubjectRoute.get(chapterInstance.chapterListBySubject.bind(chapterInstance));

export default router;