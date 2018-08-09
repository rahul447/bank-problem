"use strict";

import express from "express";
import { getTestSummaryControllerInstance } from "./testSummary.controller";

let router = express.Router(),
    testSummaryInstance = getTestSummaryControllerInstance();

router.route('/getTestQuestions/:testId').get(testSummaryInstance.getTestQuestionsWithConcepts.bind(testSummaryInstance));
router.route('/getTestsWithSyllabus').post(testSummaryInstance.getTestsWithSyllabus.bind(testSummaryInstance));
router.route('/getTestConcepts/:courseId/:testId').get(testSummaryInstance.getTestConcepts.bind(testSummaryInstance));
router.route('/getAllTestConcepts').post(testSummaryInstance.getAllTestConcepts.bind(testSummaryInstance));
router.route('/getTestChapterName').post(testSummaryInstance.getTestChapterName.bind(testSummaryInstance));
export default router;