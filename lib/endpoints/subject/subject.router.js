"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {SubjectController} from "./subject.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    subjectByGradeRoute = router.route("/subjectListByGrade"),
    subjectAddRoute = router.route("/subjectAdd"),
    subjectEditRoute = router.route("/subjectEdit"),
    subjectDeleteRoute = router.route("/subjectDelete"),
    getSubjectsFromElasticRoute = router.route("/getSubjectsFromElastic"),
    subjectInstance = new SubjectController(loggerInstance, config);

getSubjectsFromElasticRoute.get(subjectInstance.getSubjectsFromElastic.bind(subjectInstance));
subjectByGradeRoute.get(subjectInstance.subjectListByGrade.bind(subjectInstance));
subjectAddRoute.post(subjectInstance.subjectAdd.bind(subjectInstance));
subjectEditRoute.put(subjectInstance.subjectEdit.bind(subjectInstance));
subjectDeleteRoute.delete(subjectInstance.subjectDelete.bind(subjectInstance));

router.route('/:id?').get(subjectInstance.get.bind(subjectInstance));
export default router;