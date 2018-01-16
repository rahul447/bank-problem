"use strict";

import express from "express";

let router = express.Router();
let app = express();

import * as Class from "../endpoints/class/class.controller";
import * as course from "../endpoints/course/course.controller";
import * as courseType from "../endpoints/courseType/courseType.controller";
import * as Package from "../endpoints/package/package.controller";
import * as Question from "../endpoints/question/question.controller";
import * as Rules from "../endpoints/rules/rules.controller";
import * as Test from "../endpoints/test/test.controller";
import * as testSummary from "../endpoints/testSummary/testSummary.controller";

app.get('/classList', Class.classList);
app.get('/classGoals', course.classGoals);
app.get('/allGoals', course.allGoals);
app.get('/totalDays', course.totalDays);
app.get('/totalTests', course.totalTests);
app.get('/between', course.testsBetweenStartDateEndDate);
app.get('/courseTests', course.elasticConceptTestRetrieve);
app.get('/courseTestsOld', course.elasticCourseretrieve);
app.get('/courseTestsPartFull', course.courseTestsPartFull);
app.get('/courseSubjects', course.courseSubjects);
app.post('/saveCourse',course.saveCourse);
app.get('/getTrialTest', course.getTrialTest);
app.get('/packagewaletests', course.packageTestsUponGoal);
app.post('/indexCourseSyllabus', course.indexCourseSyllabus);
app.get('/retrieveCourseSyllabus', course.retrieveCourseSyllabus);
app.get('/totalcount', course.totalCount);
app.get('/createindex', course.createIndex);
app.get('/getCourses', courseType.getCourses);
app.get('/getPackage', Package.getPackage);
app.get('/getAllPackage', Package.getAllPackage);
app.get('/viewPackage', Package.viewPackage);
app.get('/viewSchedule', Package.viewSchedule);
app.post('/getQuestion', Question.getQuestion);
app.get('/questionList', Question.questionList);
app.post('/saveQuestion',Question.saveQuestion);
app.post('/getRules', Rules.getRules);
app.post('/saveRules',Rules.saveRules);
app.get('/test',Test.testpaper);
app.get('/upComingTest',Test.upComingTest);
app.post('/createTestObj',Test.createTestObj);
app.post('/saveTest',Test.saveTest);
app.post('/subjectList',Test.SubjectList);
app.post('/getQuestionSolution',Test.getquestionsolution);
app.post('/getTestSummary',testSummary.getTestSummary);
app.post('/createTestSummary',testSummary.createTestSummary);
app.post('/demo',testSummary.demoentry);

export {router, app};
