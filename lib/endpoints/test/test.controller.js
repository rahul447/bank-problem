"use strict";
import tests from "./tests.model";
import { ResponseController } from "../../util/response.controller";
import { _ } from "lodash";
import {ContentTagController} from "../contentTag/contentTag.controller";
import questionModel from "../question/question.model"
import mongoose from "mongoose";
import client from '../../../config/elastic-connection';
import loggerInstance from "../../util/apiLogger";
import {getCourseControllerInstance} from "../course/course.controller";
import CourseItemModel from "../courseItem/courseItem.model";
import CourseSyllabusModel from "../courseSyllabus/courseSyllabus.model";
import subjectModel from "../subject/subject.model";
import courseModel from "../course/course.model";
import multer from "multer";
import  path from "path";
import {readExcel} from "../../util/helperFunctions";
import request from "request";
import {getPackageControllerInstance} from "../package/package.controller";
import elasticsearch from "elasticsearch";
import {getQuestionControllerInstance} from "../question/question.controller";
let questionInstance = getQuestionControllerInstance()

let TestControllerInstance,
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

class TestController {
    constructor(loggerInstance, config, courseControllerInstance, elasticClient = {}) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.testModelInstance = tests;
        this.elasticClient = elasticClient;
        this.questionModelInstance = questionModel;
        this.courseControllerInstance = courseControllerInstance;
        this.subjectModel = subjectModel;
        this.CourseSyllabusModel = CourseSyllabusModel;
        this.CourseItemModel = CourseItemModel;
        this.courseModel = courseModel;
        this.packageControllerInstance = getPackageControllerInstance();
        this.elasticClient = new elasticsearch.Client({
            host: `${this.config.elasticConnection.hostname}:${this.config.elasticConnection.port}`,
            log: 'trace'
        });

    }

    getTestById(testId, req, res) {
        const query = req.body.dbQuery;
        query.$and.push({
            _id: testId
        });
        this.testModelInstance.findOne(query)
        .populate('data.sections.subSection.questions.qId')
        .lean()
        .then(test => {
            if (!test) {
                this.loggerInstance.debug("Test with given ID not accessible");
                return res.json(new ResponseController(403, "Test ID Forbidden"));
            }
            if(Array.isArray(test.tags)){
                ContentTagController.mapValues(test.tags).then(() => {
                    test.data.sections.map(section => {
                        section.subSection.map(subSection => {
                            subSection.questions.map(question => {
                                question.questionType = question.qId.questionType;
                                if(question.qId.passageId)
                                    question.passageId = question.qId.passageId;
    
                                let name = question.qId.content[0].questionContent;
                                question.contentId = question.qId.contentId;
                                question.qId.draftId ? question.draftId = question.qId.draftId : '';
                                question.qId = question.qId._id;
                                question.name = name;
                            });
                        });
                    });
                    
                    this.loggerInstance.info("Retrieved test");
                    return res.json(new ResponseController(200, "Test retrieved successfully", test));
                });   
            }
            else{
                this.loggerInstance.info("Retrieved test");
                return res.json(new ResponseController(200, "Test retrieved successfully", test));
            }
        })
        .catch((err) => {
            this.loggerInstance.error(`DB Error retrieving test ${err}`);
            return res.json(new ResponseController(500, "Error retrieving test", err));
        })
    }


    testList(req, res) {
        if (req.query.draftId) {
            this.getTestById(req.query.draftId, req, res);
        } else if (req.params.id) {
            this.getTestById(req.params.id, req, res);
        } else {
            this.testModelInstance.find(req.body.dbQuery)
                .then(tests => {

                    this.loggerInstance.info("Retrieved test list");
                    return res.json(new ResponseController(200, "Test list retrieved successfully", tests));
                })
                .catch((error) => {
                    this.loggerInstance.error("DB Error retrieving test list", error);
                    return res.json(new ResponseController(500, "Error retrieving test list"));
                });
        }
    }
    addTest(req, res) {
        let test = new this.testModelInstance(req.body);

        test.save()
            .then(response => {
                this.loggerInstance.info("Created test succesfully");
                return res.json(new ResponseController(200, "Test added", response));
            })
            .catch(err => {
                this.loggerInstance.error("DB error creating new test");
                return err.name === 'ValidationError' ?
                    res.json(new ResponseController(400, "Validation Error", err)) :
                    res.json(new ResponseController(500, "Error creating test"));
            });
    }

    createTestClone(oldObj, bodyObj) {
        return new Promise((resolve, reject) => {
            if (oldObj.constructor.name === 'model') {
                oldObj = oldObj.toObject()
            }
            let cloneObj = _.pick(oldObj, ['_id']);
            let tailoredObj = Object.assign({}, oldObj, bodyObj);
            tailoredObj = _.omit(tailoredObj, "_id");
            tailoredObj.publishId = cloneObj._id;
            tailoredObj.status = "DRAFT";
            if(tailoredObj.data && tailoredObj.data.sections && tailoredObj.data.sections.length > 0)
                tailoredObj.data.noOfSections = tailoredObj.data.sections.length;

            let test = new this.testModelInstance(tailoredObj);
            ((that) => {
                test.save()
                .then(function(test) {
                    that.loggerInstance.info(`Test Clone saved successfully ${test._id}`);
                    resolve(test);
                })
                .catch(function(err) {
                    that.loggerInstance.error(`Test Clone saved error ${err}`);
                    reject(err);
                })
            })(this);
        });
    }

    updateTestClone(oldObj, bodyObj) {
        return new Promise((resolve, reject) => {
            ((that) => {
                if (oldObj.constructor.name === 'model') {
                    oldObj = oldObj.toObject()
                }
                let cloneObj = _.pick(oldObj, ['_id']);
                let tailoredObj = Object.assign({}, oldObj.draftId, bodyObj);
                tailoredObj = _.omit(tailoredObj, ["_id", "draftId"]);
                tailoredObj.publishId = cloneObj._id;
                tailoredObj.status = "DRAFT";
                if(tailoredObj.data && tailoredObj.data.sections
                    && tailoredObj.data.sections.length > 0)
                    tailoredObj.data.noOfSections = tailoredObj.data.sections.length;

                that.testModelInstance.findOneAndUpdate({_id: oldObj.draftId}, tailoredObj,
                    {new: true, upsert: true, setDefaultsOnInsert: true}, function(err) {
                    if(err) {
                        that.loggerInstance.error(`Test Clone Update error ${err}`);
                        reject(err);
                    }
                    that.loggerInstance.info(`Test Clone Update Success`);
                    resolve();
                });
            })(this);
        });
    }

    async updateTest(req, res) {

        delete req.body._id;
        let testId = req.params.id;
        if (!testId) {
            this.loggerInstance.debug("No testId specified");
            return res.json(new ResponseController(400, "No testId specified"));
        }

        const query = req.body.dbQuery;

        let newTest = req.body;
        this.computeMarks(newTest);
        newTest.updatedAt = new Date();

        query.$and.push({
            _id: testId
        });
        this.testModelInstance.findOne(query)
        .populate('draftId')
        .lean()
        .then( (newObj) => {
            if (!newObj) {
                this.loggerInstance.debug("Test with given ID not accessible");
                return res.json(new ResponseController(403, "Test ID Forbidden"));
            }
            return new Promise((resolve, reject) => {
                if(newObj.status === "PUBLISHED" && !newObj.draftId) {

                    this.createTestClone(newObj, newTest)
                    .then((cloneTest) => {
                        newObj.draftId = cloneTest._id;
                        resolve(newObj);
                    })
                    .catch(err => {
                        this.loggerInstance.error(`Test Clone Creation Error ${err}`);
                        reject(err);
                    });
                } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                    this.updateTestClone(newObj, newTest)
                    .then(() => {
                        resolve(newObj);
                    })
                    .catch(err => {
                        this.loggerInstance.error(`Test Clone Updation Error ${err}`);
                        reject(err);
                    });
                } else {

                    const totalMarks = this.buildFinalMarks(newTest);
                    totalMarks > 0 && newObj.settings ? newObj.settings.totalMarks = totalMarks : '';

                    let updatedTest = _.mergeWith(newObj, newTest, (src, dst) => {
                        if (_.isArray(src)) {
                            return dst;
                        }
                    });
                    resolve(updatedTest);
                }
            });
        })
        .then(updatedTest => {
             let testModel = new this.testModelInstance(updatedTest);
            testModel.isNew = false;
            testModel.save()
            .then(test => {
                test.populate('data.sections.subSection.questions.qId',
                    'questionType passageId content.questionContent')
                .populate('draftId')
                .execPopulate()
                .then(async fullTest => {
                    fullTest = JSON.parse(JSON.stringify(fullTest));
                    try {
                        fullTest.courses && fullTest.courses.length && await this.courseControllerInstance.addTestsToCourses(fullTest);
                    } catch (err) {
                        this.loggerInstance.error(`error while adding test to course ${err}`);
                        return res.json(new ResponseController(500, "error while adding test to course", err));
                    }
                    ContentTagController.mapValues(fullTest.tags).then(() => {
                        fullTest.data.sections.map(section => {
                            section.subSection.map(subSection => {
                                subSection.questions.map(question => {
                                    question.questionType = question.qId.questionType;
                                    let name = question.qId.content[0].questionContent;
                                    if(question.qId.passageId)
                                        question.passageId = question.qId.passageId;
                                    question.qId = question.qId._id;
                                    question.name = name;
                                });
                            });
                        });
                        this.loggerInstance.info(`Test updated successfully`);
                        return res.json(new ResponseController(200, "Test updated successfully", fullTest));
                    });
                }, err => {
                    this.loggerInstance.error("Error populating test questions");
                    return res.json(new ResponseController(500, "Error populating test questions", err));
                });
            }).catch(err => {
                this.loggerInstance.error(`DB error updating test ${err}`);
                return res.json(new ResponseController(500, "Unable to update test", err));
            });
        }).catch(err => {
            this.loggerInstance.error(`DB error updating test ${err}`);
            return res.json(new ResponseController(500, "Unable to update test", err));
        });
    }

    buildFinalMarks(newTest) {
        return newTest.data && newTest.data.sections ? newTest.data.sections.reduce((acc, curr) => {
                acc += curr.subSection ? curr.subSection
                    && curr.subSection.reduce((acc, curr) => {
                        acc += curr.totalMarks;
                        return acc;
                    }, 0) : 0;

                return acc;
            }, 0) : 0;
    }

    getTestNamesById(testIdsArr) {
        return new Promise((resolve, reject) => {
            this.testModelInstance.
            find({
                _id: { $in: testIdsArr }
            }).
            select({ name: 1 }).
            exec((err, docs) => {
                if (err) {
                    reject(err);
                }
                resolve(docs);
            });
        });
    }

    publishTest(testId, aclMetaData, publish) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.testModelInstance.findOne({ _id: testId }).
                populate('draftId').
                lean().
                exec(async function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting Test ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            let invalid = await that.validateDoc(doc.draftId, publish);
                            if(invalid.length !== 0) {
                                reject(new Error(JSON.stringify({invalid, contentId: doc.contentId})));
                            } else if(publish) {
                                that.deleteTest(doc.draftId._id)
                                .then(async () => {
                                    that.removeBeforePublish(doc.draftId, ["publishId", "draftId",
                                        "status", "contentId", "oldContentId", "docCounter", "__v",
                                        "_id"]);
                                    let draftDoc = Object.assign({}, doc.draftId);
                                    that.loggerInstance.info("Draft Test Deleted");
                                    doc = Object.assign({}, doc, draftDoc);
                                    doc.draftId = undefined;
                                    doc.fromDraft = true;
                                    const {updatedBy} = aclMetaData;
                                    doc.aclMetaData.updatedBy = updatedBy;

                                    that.testModelInstance.findOneAndUpdate({_id: doc._id}, doc,
                                        {upsert: true}, async (err) => {
                                            if(err) {
                                                that.loggerInstance.error(`Test Save Failed ${err}`);
                                                reject(err);
                                            }
                                            doc.courses && doc.courses.length && await that
                                                .courseControllerInstance.addTestsToCourses(doc);
                                            resolve();
                                        });
                                });
                            } else
                                resolve();

                        } else {
                            let invalid = await that.validateDoc(doc, publish);
                            if(invalid.length !== 0) {
                                reject(new Error(JSON.stringify({invalid, contentId: doc.contentId})));
                            } else if(publish) {
                                doc.status = "PUBLISHED";
                                const {updatedBy} = aclMetaData;
                                doc.aclMetaData.updatedBy = updatedBy;

                                that.testModelInstance.findOneAndUpdate({_id: doc._id}, doc,
                                    {upsert: true}, async (err) => {
                                        if(err) {
                                            that.loggerInstance.error(`Test Save Failed ${err}`);
                                            reject(err);
                                        }
                                        try {
                                            doc.courses && doc.courses.length && await that
                                                .courseControllerInstance.addTestsToCourses(doc);
                                        } catch (error) {
                                            that.loggerInstance.error(`error while adding test to course
                                             ${error}`);
                                        }
                                        resolve();
                                    });
                            } else
                                resolve();
                        }
                    }
                });
            })(this);
        });
    }

    deleteTest(testId) {
        return new Promise((resolve, reject) => {
            try{
                this.testModelInstance.find({ _id: testId }).remove()
                    .exec();
                resolve();
            } catch(err) {
                this.loggerInstance.error(`DB error removing test ${err}`);
                reject(err);
            }
        });
    }

    async getTestSyllabus (req, res) {
        try {
            let syllabus = await this.testModelInstance.findById(req.params.id).select('syllabus.text');
            return syllabus ? res.json(new ResponseController(200, "Test Syllabus Retrieved Successfully", syllabus))
                : res.json(new ResponseController(404, "Not found test syllabus", syllabus));
        } catch (error) {
            this.loggerInstance.error(error);
        }
    }

    async syllabusTestWise(req, res) {
        let testData  = req.body;
        let data = [], promises = [];


        testData.map(async test => {
            promises.push(new Promise(async (resolve) => {
                if(test._id && test.courseId) {

                    let mustArr = [];
                    mustArr.push({ match: { "id": test.test.id } });
                    mustArr.push({ match: { "goalId": test.courseId } });

                    let searchObj = {
                        index: 'cms-staging-concept-tests-v2',
                        type: 'Tests',
                        size: 9000,
                        body: {
                            query: {
                                bool: {
                                    must: mustArr
                                }
                            },
                        }
                    };
                    data.push(await this.syllabusSearch(searchObj, test));
                    resolve();
                }else
                    resolve();
            }));
        });

        Promise.all(promises).then(() => {
            return res.status(200).json({
                'data': data,
                'code': 200,
                'message': 'Success'
            });
        });
    }

    syllabusSearch(searchObj, test) {
        return new Promise((resolve, reject) => {

            this.elasticClient.search(searchObj, (error, response, status) => {
                if (error) {
                    reject(err);
                } else {
                    response.hits.hits.forEach((hit) => {
                        test.syllabus = hit._source.syllabus;
                    });
                    resolve(test);
                }
            });
        });
    }

    computeMarks(testObj) {
        testObj.data && testObj.data.sections && testObj.data.sections.map(sec => {
            sec.subSection && sec.subSection.map(sub => {
                if(parseInt(sub.noOfQuestions) && parseInt(sub.positiveMarks)) {
                    sub.totalMarks = parseInt(sub.positiveMarks) * parseInt(sub.noOfQuestions);
                }
            });
        });
    }

    async addToCourseViaExcel(req, res) {
        await this.scheduleTestHandler(req.body.excelArr[0]);
        await this.conceptTestHandler(req.body.excelArr[1]);
        return res.json(new ResponseController(200, "All test associated with courses", {}));

        return upload(req, res, async (err) => {
            if(err) {
                return res.json(new ResponseController(500, "Unable to save file", err));
            } else {
                return res.json(new ResponseController(200, "Save File Success", {}));
            }
        });
    }

    scheduleTestHandler(workSheet) {

        let excelPattern = ["TestID","TestType","Course","ScheduleDate","DisplayTestName",
            "ScheduleId"];

        return new Promise(async (resolve, reject) => {
            let firstrow = workSheet.firstRow;
            firstrow.shift();
            if(!firstrow.every((v,i)=> v === excelPattern[i])) return reject("COLUMN_PATTERN_ERROR");

            let promises = [];
            workSheet.rows.map(async (row) => {
                promises.push(new Promise(async (resolve, reject) => {
                    row.shift();
                    let {testData, courseData} = await this.getTestAndCourseData(row);
                    let courseItemId = courseData.courseItems.find(item => item.itemType ===
                        'scheduledTests').id;
                    let courseItemData = await this.CourseItemModel.find({"_id": courseItemId}).lean()
                        .exec();
                    let schArr = courseItemData[0].details.schedule;

                    let selectedSchedule = schArr.filter(sch => String(sch.scheduleID) === String
                    (row[5]))[0];

                    let alters = {
                        "paperDetail" : {
                            "syllabus" : { "text" : testData.syllabus.text },
                            "id" : testData._id,
                            "name" : testData.name,
                            "type" : testData.settings.testType,
                        },
                        "duration" : testData.settings.duration,
                        "status" : "Live",
                        "codeName" : testData.name,
                        "displayName" : row[4],
                        "scheduleDate": new Date(row[3]).toISOString()
                    };
                    selectedSchedule = Object.assign({}, selectedSchedule, alters);

                    schArr = schArr.map(sch => String(sch.scheduleID) ===
                    String(selectedSchedule.scheduleID) ? selectedSchedule : sch);

                    await this.CourseItemModel.update({_id:courseItemId}, { $set: {
                            "details.schedule":  schArr }}, {upsert: true}).exec();
                    let testSummaryResponse = await this.runTestSummary(testData._id, courseData._id);

                    console.log("testSummaryResponse : ", testSummaryResponse);
                    let packageIds = await this.packageControllerInstance.getPackageByCourseItem
                    (courseItemId);

                    let packageSet = packageIds.reduce((acc, curr) => {
                        acc.add(curr._id);
                        return acc;
                    }, new Set());

                    let elasticUpdations = {testId: testData._id, mainTestType: testData.settings.testType,
                        syllabus: testData.syllabus.text, codeName: alters.codeName, displayName:
                        alters.displayName, duration: alters.duration, status: alters.status,
                        scheduleDate: alters.scheduleDate };

                    await this.updateScheduleTestInElasticSearch(Array.from(packageSet), courseData._id,
                        testData._id, selectedSchedule.scheduleID, elasticUpdations);

                    console.log("done for row");
                    resolve();
                }));
            });

            Promise.all(promises).then(() => {
                console.log("done for all rows");
                resolve();
            });
        });
    }

    conceptTestHandler(workSheet) {
        let excelPattern = ["TestID","ConceptCode","Course","DisplayTestName"];

        return new Promise(async (resolve, reject) => {
            let firstrow = workSheet.firstRow;
            firstrow.shift();

            if(!firstrow.every((v,i)=> v === excelPattern[i])) return reject("COLUMN_PATTERN_ERROR");
            let promises = [];
            workSheet.rows.map(async row => {
                promises.push(new Promise(async (resolve, reject) => {
                    row.shift();

                    let {testData, courseData} = await this.getTestAndCourseData(row);
                    let courseItemId = courseData.courseItems.find(item => item.itemType === 'testGroup')
                        .id;
                    let CourseSyllabus = await this.CourseSyllabusModel.find({
                        "courseId" : courseData._id,
                        "typeCode" : row[1]
                    }).exec();
                    let subjectSearchSet = CourseSyllabus[0].ancestors.reduce((acc, curr) => {
                        acc.add(curr); return acc; }, new Set());
                    let validsubjects = await this.CourseSyllabusModel.find({"_id": { "$in":
                                Array.from(subjectSearchSet)}, "type": "subject"}, {"name": 1}).exec();

                    let validChapters = await this.CourseSyllabusModel.find({"_id": { "$in":
                                Array.from(subjectSearchSet)}, "type": "chapter"}, {"name": 1}).exec();

                    let courseItemData = await this.CourseItemModel.find({"_id": courseItemId}).exec();
                    let testGroupArr = courseItemData[0].details.tests;
                    let courseConcepts = CourseSyllabus.reduce((acc, curr) => {
                        acc.push({ "name": curr.name, "id": curr._id});
                        return acc;
                    }, []);
                    let testGroupObj = {
                        "testId" : testData._id,
                        "displayName" : row[3],
                        "codeName" : testData.name,
                        "status" : "Live",
                        "duration" : testData.settings.duration,
                        "subjects" : validsubjects,
                        "courseConcepts" : courseConcepts,
                        "paperDetail" : {
                            "name" : testData.displayName,
                            "id" : testData._id
                        }
                    };
                    testGroupArr.push(testGroupObj);
                    await courseItemData[0].save();
                    let testSummaryResponse = await this.runTestSummary(testData._id, courseData._id);
                    console.log("testSummaryResponse : ", testSummaryResponse);
                    let packageIds = await this.packageControllerInstance.getPackageByCourseItem
                    (courseItemId);

                    let packageSet = packageIds.reduce((acc, curr) => {
                        acc.add(curr._id);
                        return acc;
                    }, new Set());

                    let elasticUpdations = {codeName: testData.name, oldTestId: testData._id,
                        "duration" : testData.settings.duration, "displayName" : row[3], "subjects" :
                        validsubjects, "concepts" : courseConcepts, "chapters" : validChapters,
                        "conceptCode" : row[1]};

                    await this.addConceptTestInElasticSearch(Array.from(packageSet), courseData._id,
                        testData._id, elasticUpdations);
                    console.log("done for row");
                    resolve();
                }));
            });

            Promise.all(promises).then(() => {
                console.log("done for all rows");
                resolve();
            });
        });
    }

    async getTestAndCourseData(row) {
        return new Promise(async (resolve) => {
            let testQuery = await this.testModelInstance.find({"contentId": row[0]}, {
                "name": 1,
                "displayName": 1, "syllabus": 1, "settings": 1
            }).exec();

            let courseQuery = await this.courseModel.find({"name": row[2]}, {
                "name": 1,
                "courseItems": 1
            }).exec();

            let testCourseData = await Promise.all([testQuery, courseQuery]);
            let testData = testCourseData[0][0], courseData = testCourseData[1][0];
            resolve({testData, courseData})
        });
    }

    runTestSummary(testId, courseId) {
        const url = `${this.config.http.protocol}://${this.config.http.domain}:${this.config.http
            .port}/createTestSummary`;

        return new Promise((resolve, reject) => {
            request.post({
                headers: {'content-type' : 'application/x-www-form-urlencoded'},
                url:     url,
                body:    `testId=${testId}&courseId=${courseId}`
            }, (error, response, body) => {
                error ? reject(error) : resolve(response.body);
            });
        });
    }

    async updateScheduleTestInElasticSearch(packageIds, courseId, testId, scheduleId, updations) {

        let schTest = await this.findTestElasticSearch({packageIds, courseId, scheduleId});

        let promises = [];
        for (const [k, v] of schTest) {
            let upDatedDoc = Object.assign({}, v, updations)
            promises.push(await this.elasticClient.update({
                index: 'all_tests', type: 'tests',
                id: k,
                body: {
                    doc: upDatedDoc
                }
            }))
        }

        return await Promise.all(promises);
    }

    async addConceptTestInElasticSearch(packageIds, courseId, testId, updations) {

        const {codeName, oldTestId, displayName, duration, subjects, concepts, chapters, conceptCode} =
            updations;

        let bulkData = [];
        packageIds.map(packageId => {
            bulkData.push({ index: { _index: 'all_tests', _type: 'tests',  } },
                {
                    testId, "name" : codeName, packageId, "goalId" : courseId, "testType" : "conceptTest",
                    codeName, oldTestId, displayName, duration, "availability" : "Live", subjects,
                    concepts, chapters, conceptCode
                });
        });

        return new Promise((resolve, reject) => {
            this.elasticClient.bulk({
                maxRetries: 5,
                index: 'all_tests',
                body: bulkData
            }, (err) => {
                err ? reject(err) : resolve()
            })
        });
    }

    validateDoc(test, publish = true) {
        return new Promise((resolve, reject) => {
                let status = {'name': true, 'displayName': true, 'testType': true, 'duration': true, 'language': true, 'Rules': true, 'DuplicateSection': true, 'QuestionNotEqual': true, 'DuplicateQuestion': true, 'questionsPublishIssue': true, 'testMode': true, 'totalMarks': true, /*'markingSchema': true*/};

                let sectionNameSet = new Set(), quesSet = new Set(), promises = [];

                const schemaFields = Array.from(Object.keys(test)
                    .reduce((acc, curr) => {
                        acc.add(curr.split(".")[0]);
                        return acc;
                    }, new Set()));


                    for (let key in test) {
                        (schemaFields.includes(key)) && validate(key);
                    }
                    Promise.all(promises).then(() => {
                        let invalid = [];
                        for (const k in status) {
                            if (!status[k]) {
                                invalid.push(k);
                            }
                        }
                        resolve(invalid);
                    });


                function validate(key) {
                    key === 'testMode' && test[key] !== 4 ? status.testMode = false: '';

                    if(key === 'name' || key === 'displayName') {
                        if (!test[key] || test[key].length === 0) {
                            status[key] = false;
                        }
                    }
                    if(key === 'settings') {
                        if (!test[key].testType || test[key].testType.length === 0) {
                            status.testType = false;
                        }

                        if (!test[key].duration || test[key].duration.length === 0) {
                            status.duration = false;
                        }

                        if (!test[key].language || test[key].language.length === 0) {
                            status.language = false;
                        }

                        /*if (!test[key].totalMarks) {
                            status.totalMarks = false;
                        }*/
                    }
                    if (key === 'data') {

                        if (!test[key].sections || test[key].sections.length === 0) {
                            status.Rules = false;
                        }

                        test[key].sections.map(sec => {
                            if(sectionNameSet.size > 0 && sectionNameSet.has(sec.name)) {
                                status.DuplicateSection = false;
                            } else
                                sectionNameSet.add(sec.name);

                            sec.subSection.map(async subSec => {
                                if(subSec.questions.length !== subSec.noOfQuestions) {
                                    status.QuestionNotEqual = false;
                                }

                                /*if(subSec.totalMarks === null || subSec.partialMarks === null || subSec.positiveMarks
                                    === null || subSec.negativeMarks === null)
                                    status.markingSchema = false;*/

                                subSec.questions.map(ques => {

                                    if(quesSet.size > 0 && quesSet.has(ques.qId)) {
                                        status.DuplicateQuestion = false;
                                    } else
                                        quesSet.add(ques.qId);

                                    promises.push(new Promise((resolve) =>
                                        questionInstance.publishQuestion(ques.qId, test.aclMetaData,
                                            publish)
                                        .then((msg) => {
                                            resolve();
                                        }).catch(err => {
                                            err ? status.questionsPublishIssue = false: '';
                                            resolve();
                                        })
                                    ));
                                });
                            });
                        });
                    }
                }
        });
    }

    removeBeforePublish(doc, propToBeDeleted) {
        propToBeDeleted.map(prop => {
            Reflect.deleteProperty(doc, prop);
        });
    }

    async findTestElasticSearch({packageIds, courseId, scheduleId}) {
        const result = await this.elasticClient.search({
            index: 'all_tests', type: 'tests',
            body: {
                "query": {
                    "bool": {
                        "must": [
                            { "match": { "testType": "mainTest" }},
                            { "match": { "packageId": packageIds.join(" ") }},
                            { "match": { "goalId": courseId }},
                            { "match": { "scheduleId": scheduleId }}
                        ]
                    }
                }
            }
        });

        let sourceData = result.hits.hits.reduce((acc, curr) => {
            acc.set(curr._id, curr._source);
            return acc;
        }, new Map());

        return sourceData;

    }
}

export function getTestControllerInstance() {
    TestControllerInstance = TestControllerInstance || new TestController(loggerInstance, config, getCourseControllerInstance(), client);
    return TestControllerInstance;
}