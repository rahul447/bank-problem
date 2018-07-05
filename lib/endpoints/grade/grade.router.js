"use strict";

import express from "express";
import {getGradeControllerInstance} from "./grade.controller";

let router = express.Router(),
    gradeListRoute = router.route("/gradeList"),
    createGradeRoute = router.route("/createGrade"),
    getContentDashBoardFilterRoute = router.route("/getContentDashBoardFilter"),
    gradeInstance = getGradeControllerInstance();

gradeListRoute.get(gradeInstance.gradeList.bind(gradeInstance));
createGradeRoute.post(gradeInstance.createGrade.bind(gradeInstance));
getContentDashBoardFilterRoute.get(gradeInstance.getContentDashBoardFilter.bind(gradeInstance));

export default router;