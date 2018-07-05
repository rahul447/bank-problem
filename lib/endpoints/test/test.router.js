"use strict";

import express from "express";
import { getTestControllerInstance } from "./test.controller";

let router = express.Router(),
    testListRoute = router.route("/getTest/:id?"),
    addTestRoute = router.route("/addTest"),
    updateTestRoute = router.route("/updateTest/:id"),
    syllabusTestWiseRoute = router.route("/syllabusTestWise"),
    testInstance = getTestControllerInstance();


testListRoute.get(testInstance.testList.bind(testInstance));
addTestRoute.post(testInstance.addTest.bind(testInstance));
updateTestRoute.patch(testInstance.updateTest.bind(testInstance));
router.route('/syllabus/:id').get(testInstance.getTestSyllabus.bind(testInstance));
syllabusTestWiseRoute.post(testInstance.syllabusTestWise.bind(testInstance));

export default router;