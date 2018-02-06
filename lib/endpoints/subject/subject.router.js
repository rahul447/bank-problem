"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {SubjectController} from "./subject.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    subjectByGradeRoute = router.route("/subjectListByGrade"),
    subjectInstance = new SubjectController(loggerInstance, config);

subjectByGradeRoute.get(subjectInstance.subjectListByGrade.bind(subjectInstance));

export default router;