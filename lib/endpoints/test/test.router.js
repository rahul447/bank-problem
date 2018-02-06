"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { TestController } from "./test.controller";

let router = express.Router(),
    { NODE_ENV } = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    testListRoute = router.route("/testList"),
    addTestRoute = router.route("/addTest"),
    updateTestRoute = router.route("/updateTest/:id"),
    testInstance = new TestController(loggerInstance, config);

testListRoute.get(testInstance.testList.bind(testInstance));
addTestRoute.post(testInstance.addTest.bind(testInstance));
updateTestRoute.put(testInstance.updateTest.bind(testInstance));
export default router;