"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {GradeController} from "./grade.controller";
import Grade from "./grade.model";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    gradeListRoute = router.route("/gradeList"),
    createGradeRoute = router.route("/createGrade"),
    getContentDashBoardFilterRoute = router.route("/getContentDashBoardFilter"),
    gradeInstance = new GradeController(loggerInstance, config, Grade);

gradeListRoute.get(gradeInstance.gradeList.bind(gradeInstance));
createGradeRoute.post(gradeInstance.createGrade.bind(gradeInstance));
getContentDashBoardFilterRoute.get(gradeInstance.getContentDashBoardFilter.bind(gradeInstance));

export default router;