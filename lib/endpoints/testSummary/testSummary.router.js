"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { TestSummaryController } from "./testSummary.controller";

let router = express.Router(),
    { NODE_ENV } = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    testSummaryInstance = new TestSummaryController(loggerInstance, config);

router.route('/getTestQuestions/:testId').get(testSummaryInstance.getTestQuestionsWithConcepts.bind(testSummaryInstance));
export default router;