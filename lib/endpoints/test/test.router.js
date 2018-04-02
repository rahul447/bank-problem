"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { TestController } from "./test.controller";

let router = express.Router(),
    { NODE_ENV } = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    testListRoute = router.route("/getTest/:id?"),
    addTestRoute = router.route("/addTest"),
    updateTestRoute = router.route("/updateTest/:id"),
    testInstance = new TestController(loggerInstance, config);

testListRoute.get(testInstance.testList.bind(testInstance));
addTestRoute.post(testInstance.addTest.bind(testInstance));
updateTestRoute.patch(testInstance.updateTest.bind(testInstance));
router.route('/syllabus/:id').get(testInstance.getTestSyllabus.bind(testInstance));
export default router;