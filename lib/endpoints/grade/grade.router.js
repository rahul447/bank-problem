"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {GradeController} from "./grade.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    gradeListRoute = router.route("/gradeList"),
    gradeInstance = new GradeController(loggerInstance, config);

gradeListRoute.get(gradeInstance.gradeList.bind(gradeInstance));

export default router;