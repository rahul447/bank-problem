import express from "express";
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
import checkEnvironmentVariables from "./util/checkEnvironmentVariables";
import mwAllowCrossDomain from "./middlewares/mwAllowCrossDomain";
import mwErrorHandler from "./middlewares/mwErrorHandler";
import domain from "express-domain-middleware";

import * as Class from "./oldcontrollers/class.controller";
import * as course from "./oldcontrollers/course.controller";
import * as courseType from "./oldcontrollers/courseType.controller";
import * as Package from "./oldcontrollers/package.controller";
import * as Question from "./oldcontrollers/question.controller";
import * as Rules from "./oldcontrollers/rules.controller";
import * as Test from "./oldcontrollers/test.controller";
import * as testSummary from "./oldcontrollers/testSummary.controller";
import {dbConnect} from "./db";

import classRouter from "./endpoints/class/class.router";
import questionRouter from "./endpoints/question/question.router";
import contentRouter from "./endpoints/content/content.router";
import testRouter from "./endpoints/test/test.router";
import userRouter from "./endpoints/user/user.router";
import roleRouter from "./endpoints/role/role.router";
import conceptRouter from "./endpoints/concept/concept.router";
import chapterRouter from "./endpoints/chapter/chapter.router";
import subjectRouter from "./endpoints/subject/subject.router";
import gradeRouter from "./endpoints/grade/grade.router";
import ruleRouter from "./endpoints/rule/rule.router";
import languageRouter from "./endpoints/language/language.router";
import studyMaterialRouter from "./endpoints/studyMaterial/studyMaterial.router";

let app = express(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "development",
    config = Object.freeze(require("../config/" + nodeEnv)),
    urlPrefix = config.urlPrefix,
    environmentVariables = require("../config/environmentVariables");

if (config.environmentVariableChecker.isEnabled) {
    checkEnvironmentVariables(environmentVariables);
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(mwAllowCrossDomain);
app.use(mwErrorHandler);
app.use(domain);

app.use(urlPrefix + "/healthcheck", (req, res) => {
    res.status(200).send("OK");
});

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

app.use(urlPrefix + "/class", classRouter);
app.use(urlPrefix + "/question", questionRouter);
app.use(urlPrefix + "/content", contentRouter);
app.use(urlPrefix + "/test", testRouter);
app.use(urlPrefix + "/user", userRouter);
app.use(urlPrefix + "/role", roleRouter);
app.use(urlPrefix + "/concept", conceptRouter);
app.use(urlPrefix + "/chapter", chapterRouter);
app.use(urlPrefix + "/subject", subjectRouter);
app.use(urlPrefix + "/grade", gradeRouter);
app.use(urlPrefix + "/rule", ruleRouter);
app.use(urlPrefix + "/language", languageRouter);
app.use(urlPrefix + "/studyMaterial", studyMaterialRouter);

app.set("port", config.http.port);

dbConnect(config);

app.listen(app.get('port'), function() {
    console.log(new Date(), "Server has started and is listening on port: " + app.get("port"));
    console.log("============Welcome to CMS DataService===============");
    console.log("Mode:", config.mode);
});

module.exports = app;
