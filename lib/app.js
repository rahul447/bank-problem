import express from "express";
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
import mwErrorHandler from "./middlewares/mwErrorHandler";
import domain from "express-domain-middleware";

var helmet = require('helmet');

import * as b2b from "./oldcontrollers/b2bservices.controller";
import * as Class from "./oldcontrollers/class.controller";
import * as course from "./oldcontrollers/course.controller";
import * as courseType from "./oldcontrollers/courseType.controller";
import * as Package from "./oldcontrollers/package.controller";
import * as Question from "./oldcontrollers/question.controller";
import * as Rules from "./oldcontrollers/rules.controller";
import * as Tags from "./oldcontrollers/tags.controller";
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
import categoryRouter from "./endpoints/category/category.router";
import subCategoryRouter from "./endpoints/subCategory/subCategory.router";
import courseTypeRouter from "./endpoints/courseType/courseType.router";
import ruleRouter from "./endpoints/rule/rule.router";
import languageRouter from "./endpoints/language/language.router";
import studyMaterialRouter from "./endpoints/studyMaterial/studyMaterial.router";
import formulaRouter from "./endpoints/formula/formula.router";
import videoRouter from "./endpoints/video/video.router";
import audioRouter from "./endpoints/audio/audio.router";
import courseRouter from "./endpoints/course/course.router";
import courseItemRouter from "./endpoints/courseItem/courseItem.router";
import courseSyllabusRouter from "./endpoints/courseSyllabus/courseSyllabus.router";
import packageRouter from "./endpoints/package/package.router";
import contentTagRouter from "./endpoints/contentTag/contentTag.router";
import courseTagRouter from "./endpoints/courseTag/courseTag.router";
import testTypeRouter from "./endpoints/testType/testType.router";
import clientRouter from "./endpoints/client/client.router";
import migrateRouter from "./endpoints/migrate/migrate.router";
import testSummaryRouter from "./endpoints/testSummary/testSummary.router";
import orgCenterRouter from "./endpoints/orgCenter/orgCenter.router";
import testBulkUploaderRouter from "./endpoints/TestBulkUploader/paperHelper/bulkUploader.router";

let app = express(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../config/" + nodeEnv)),
    urlPrefix = config.urlPrefix;

app.use(helmet());
app.use(bodyParser.urlencoded({limit: '1000kb', extended: true}));
app.use(bodyParser());
app.use(bodyParser.json({limit: '1000kb'}));
app.use(cookieParser());
app.use(mwErrorHandler);
app.use(domain);
app.use(logger('dev'));

app.use(urlPrefix + "/healthcheck", (req, res) => {
    res.status(200).send("OK");
});



app.post('/getPackagesFromListB2b', b2b.getPackagesFromListB2b);
app.post('/getPackagesforUserpackage', b2b.getPackagesforUserpackage);
app.get('/getAllActivePackageForB2b', b2b.getAllActivePackageForB2b);
app.get('/classList', Class.classList);
app.get('/classId', Class.classId);
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
app.get('/getCourseNames', course.getCourseNames);
app.get('/getCourses', courseType.getCourses);
app.post('/getConceptObj',courseType.getConcept);
app.get('/fetchCourseType',courseType.fetchCourseType);
app.get('/getPackage', Package.getPackage);
app.get('/getAllPackage', Package.getAllPackage);
app.get('/viewPackage', Package.viewPackage);
app.get('/viewSchedule', Package.viewSchedule);
app.get('/freePackageList',Package.freePackageList);
app.post('/getQuestion', Question.getQuestion);
app.get('/questionList', Question.questionList);
app.post('/saveQuestion',Question.saveQuestion);
app.post('/submitQuesMap',Question.submitQuesMap);
app.post('/getRules', Rules.getRules);
app.post('/saveRules',Rules.saveRules);
app.get('/getAllTagsName', Tags.getAllTagsName);
app.get('/test',Test.testpaper);
app.get('/upComingTest',Test.upComingTest);
app.post('/createTestObj',Test.createTestObj);
app.post('/saveTest',Test.saveTest);
app.post('/subjectList',Test.SubjectList);
app.post('/getQuestionSolution',Test.getquestionsolution);
app.get("/getAllTest", Test.getAllTestByPagination);
app.get("/getAllTestCount", Test.getAllTestCount);
app.get("/getQuesForTest", Test.getQuesForTest);
app.get("/getDistinctTestTypes", Test.getDistinctTestTypes);
app.get("/getSectionsForTest", Test.getSectionsForTest);
app.post('/updateTestDetails',Test.updateTestDetails);
app.post('/deleteSectionsPerTest',Test.deleteSectionsPerTest);
app.post('/getTestSummary',testSummary.getTestSummary);
app.post('/createTestSummary',testSummary.createTestSummary);
app.post('/forceTestSummary',testSummary.forceEntry);
app.get('/sampleTests', course.goalIdBasedSampleTests);
app.get('/packTests', course.packageTestsUponGoal);
app.get('/newPackTests', course.multiplePackageTestsUponGoal);


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
app.use(urlPrefix + "/category", categoryRouter);
app.use(urlPrefix + "/subCategory", subCategoryRouter);
app.use(urlPrefix + "/courseType", courseTypeRouter);
app.use(urlPrefix + "/language", languageRouter);
app.use(urlPrefix + "/studyMaterial", studyMaterialRouter);
app.use(urlPrefix + "/formula", formulaRouter);
app.use(urlPrefix + "/video", videoRouter);
app.use(urlPrefix + "/audio", audioRouter);
app.use(urlPrefix + "/course", courseRouter);
app.use(urlPrefix + "/courseSyllabus", courseSyllabusRouter);
app.use(urlPrefix + "/courseItem", courseItemRouter);
app.use(urlPrefix + "/package", packageRouter);
app.use(urlPrefix + "/contentTag", contentTagRouter);
app.use(urlPrefix + "/courseTag", courseTagRouter);
app.use(urlPrefix + "/testType", testTypeRouter);
app.use(urlPrefix + "/client", clientRouter);
app.use(urlPrefix + "/migrate", migrateRouter);
app.use(urlPrefix + "/testSummary", testSummaryRouter);
app.use(urlPrefix + "/grade", gradeRouter);
app.use(urlPrefix + "/orgCenter", orgCenterRouter);
app.use(urlPrefix + "/testBulkUploader", testBulkUploaderRouter);


app.set("port", config.http.port);

dbConnect(config);

/// catch 404 and forwarding to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    return res.status(404).json({ code: 404, message: "not found", data: {} });

});


app.listen(app.get('port'), function() {
    console.log(new Date(), "Server has started and is listening on port: " + app.get("port"));
    console.log("============Welcome to CMS DataService===============");
    console.log("Mode:", config.mode);
    checkAllEnv();
});

function checkAllEnv() {
    let devConfig = require(`../config/development`);
    let stagingConfig = require(`../config/staging`);
    let prodConfig = require(`../config/production`);

    console.log(" dev len : ", Object.keys(devConfig).length);
    console.log(" staging len : ", Object.keys(stagingConfig).length);
    console.log(" prod len : ", Object.keys(prodConfig).length);
}

module.exports = app;
