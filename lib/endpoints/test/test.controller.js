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
import {readExcel} from "../../util/helperFunctions";
import CourseItemModel from "../courseItem/courseItem.model";
import CourseSyllabusModel from "../courseSyllabus/courseSyllabus.model";
import subjectModel from "../subject/subject.model";
import courseModel from "../course/course.model";

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
                                question.qId = question.qId._id;
                                question.draftId = question.qId.draftId;
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
        console.log(" in updateTest body: ", req.body);
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

        console.log(" in updateTest again: ", query);
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
                //console.log("curr.subSection.totalMarks ", JSON.stringify(curr));

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

    publishTest(testId, aclMetaData) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.testModelInstance.findOne({ _id: testId }).
                populate('draftId').
                exec(function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting Test ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            let cloneObj = _.omit(doc.draftId, ['_id', 'publishId']);
                            cloneObj.status = "PUBLISHED";
                            doc.subjects = cloneObj.subjects;
                            doc.testCode = cloneObj.testCode;
                            doc.testMode = cloneObj.testMode;
                            doc.data = cloneObj.data;
                            doc.status = cloneObj.status;
                            doc.courses = cloneObj.courses;
                            doc.tags = cloneObj.tags ? cloneObj.tags : null;
                            doc.syllabus = cloneObj.syllabus;
                            doc.settings = cloneObj.settings;
                            doc.displayName = cloneObj.displayName;
                            doc.name = cloneObj.name;

                            that.deleteTest(doc.draftId)
                            .then(async () => {
                                const {updatedBy} = aclMetaData;
                                doc.aclMetaData.updatedBy = updatedBy;
                                doc.draftId = undefined;
                                that.loggerInstance.info("Draft Test Deleted");
                                this.fromDraft = true;
                                doc.save(async (err) => {
                                    if(err) {
                                        that.loggerInstance.error(`Test Save Failed ${err}`);
                                        reject(err);
                                    }
                                    doc.courses && doc.courses.length && await that.courseControllerInstance.addTestsToCourses(doc);
                                    resolve();
                                });
                            });
                        } else {
                            doc.status = "PUBLISHED";
                            const {updatedBy} = aclMetaData;
                            doc.aclMetaData.updatedBy = updatedBy;
                            doc.save(async (err, fullTest) => {
                                if(err) {
                                    that.loggerInstance.error(`Test Save Failed ${err}`);
                                    reject(err);
                                }
                                try {
                                    fullTest.courses && fullTest.courses.length && await that.courseControllerInstance.addTestsToCourses(fullTest);
                                } catch (error) {
                                    that.loggerInstance.error(`error while adding test to course ${error}`);
                                }
                                resolve();
                            });
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
            //console.log("data : ", data);
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
                    //console.log("response : ", response.hits.hits);
                    response.hits.hits.forEach((hit) => {
                        test.syllabus = hit._source.syllabus;
                    });
                    resolve(test);
                }
            });
        });
    }

    validateTest(Id) {
        return new Promise((resolve, reject) => {
            this.testModelInstance.
            findOne({ _id: Id }).
            populate('draftId').
            exec((err, doc) => {
                if(err) {
                    this.loggerInstance.error(`DB error getting test ${err}`);
                    reject(err);
                } else {
                    this.loggerInstance.info(`Validating test`);
                    const validStatus = doc.draftId ? this.validateOnly(doc.draftId)
                        : this.validateOnly(doc);
                    resolve(validStatus);
                }
            });
        });
    }

    validateOnly(doc) {
        let status = {'name': true, 'displayName': true, 'testType': true, 'duration': true, 'language': true, 'Rules': true, 'DuplicateSection': true, 'DuplicatesubSectionName': true, 'QuestionNotEqual': true, 'DuplicateQuestion': true, 'QuestionCode': true, 'concepts': true, 'testMode': false};

        let sectionNameSet = new Set(), subSectionNameSet = new Set(), quesSet = new Set(),
            promises = [];

        const schemaFields = Array.from(Object.keys(doc.toJSON()));
        for(let i in doc) {
            schemaFields.includes(i) && this.validate(i, doc, status, sectionNameSet, subSectionNameSet, quesSet, promises)
        }
        let validStatus = Object.keys(status).every((k) => status[k] === true);
        return {status,  validStatus};
    }

    validate(key, test, status, sectionNameSet, subSectionNameSet, quesSet, promises) {
        key === 'testMode' && test[key] !== 4 ? status.testMode = false: '';

        if(key === 'subjects' && (!test["subjects"] || test["subjects"].length === 0)) {
            status.concepts = false;
        }
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

            if (test[key].language || test[key].language.length === 0) {
                status.language = false;
            }

            if (!test[key].totalMarks) {
                status.totalMarks = false;
            }
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
                    const quesCode = subSec.quesCodeAllowed;
                    if(typeof quesCode  !==  "undefined" && subSec.questions.length > 0)
                        status.QuestionCode = await new Promise(async (resolve) => resolve(await this.validateTestQuestions(quesCode, subSec.questions.map(q => mongoose.Types.ObjectId(q.qId)))));
                    if(subSectionNameSet.size > 0 && subSectionNameSet.has(subSec.name)) {
                        status.DuplicatesubSectionName = false;
                    } else
                        subSectionNameSet.add(subSec.name);

                    if(subSec.questions.length !== subSec.noOfQuestions) {
                        status.QuestionNotEqual = false;
                    }

                    if(subSec.totalMarks === null || subSec.partialMarks === null || subSec.positiveMarks
                        === null || subSec.negativeMarks === null)
                        status.markingSchema = false;

                    subSec.questions.map(ques => {

                        if(quesSet.size > 0 && quesSet.has(ques.qId)) {
                            status.DuplicateQuestion = false;
                        } else
                            quesSet.add(ques.qId);

                        promises.push(new Promise((resolve) =>

                            questionInstance.publishQuestion(ques.qId, test.aclMetaData)
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

    validateTestQuestions(quesCode, QuesArr) {
        return new Promise((resolve, reject) => {
            this.questionModelInstance.find({_id: { $in: QuesArr }}, { "content" : 1 }, (err, docs) => {
                let status = true;
                docs.map(doc => {
                    doc.content.map(con => {
                        quesCode === 0 && con.correctAnswer.data.length !== 1 ? (status = false, resolve(status)): '';
                        quesCode === 8 && con.correctAnswer.data.length <= 1 ? (status = false, resolve(status)): '';
                    })
                })
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
        const filePath = "/home/rahulkhanna/Desktop/edforaProjects/CMSV2/cms_dataservice_es6/course-creation.xlsx";
        const excelData = await readExcel(filePath);

        await this.scheduleTestHandler(excelData.getWorksheet('schedule'));
        await this.conceptTestHandler(excelData.getWorksheet('concept'));
        console.log("done");
        return res.json(new ResponseController(200, "All test associated with courses", {}));
    }

    scheduleTestHandler(workSheet) {

        let excelPattern = ["TestID","TestType","Course","ScheduleDate","DisplayTestName",
            "ScheduleId"];

        return new Promise(async (resolve, reject) => {
            let firstrow = workSheet.getRow(1);
            firstrow.values.shift();

            !firstrow.values.every((v,i)=> v === excelPattern[i - 1]) && reject("COLUMN_PATTERN_ERROR");
            const dataLength = workSheet.getColumn('A').values.length;
            for(let i = 2; i <= dataLength - 1; i++) {
                await new Promise(async (resolve, reject) => {
                    let row = workSheet.getRow(i).values;
                    row.shift();

                    let {testData, courseData} = this.getTestAndCourseData(row);
                    let courseItemId = courseData.courseItems.find(item => item.itemType ===
                        'scheduledTests').id;

                    let courseItemData = await this.CourseItemModel.find({"_id": courseItemId}).lean()
                        .exec();
                    let schArr = courseItemData[0].details.schedule;
                    let selectedSchedule = schArr.filter(sch => String(sch.scheduleID) === String(row[5]))
                        [0];
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
                        "displayName" : row[4]
                    };
                    selectedSchedule = Object.assign({}, selectedSchedule, alters);
                    schArr = schArr.map(sch => String(sch.scheduleID) ===
                    String(selectedSchedule.scheduleID) ? selectedSchedule : sch);

                    await this.CourseItemModel.update({_id:courseItemId}, { $set: {
                        "details.schedule":  schArr }}, {upsert: true}).exec();
                    resolve();
                });
            }
            resolve();
        });
    }

    conceptTestHandler(workSheet) {
        let excelPattern = ["TestID","ConceptCode","Course","DisplayTestName"];

        return new Promise(async (resolve, reject) => {
            let firstrow = workSheet.getRow(1);
            firstrow.values.shift();

            !firstrow.values.every((v,i)=> v === excelPattern[i - 1]) && reject("COLUMN_PATTERN_ERROR");

            const dataLength = workSheet.getColumn('A').values.length;
            for(let i = 2; i <= dataLength - 1; i++) {
                await new Promise(async (resolve, reject) => {
                    let row = workSheet.getRow(i).values;
                    row.shift();
                    let {testData, courseData} = this.getTestAndCourseData(row);
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
                    resolve();
                });
            }
            resolve();
        });
    }

    async getTestAndCourseData(row) {
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
        return {testData, courseData};
    }
}

export function getTestControllerInstance() {
    TestControllerInstance = TestControllerInstance || new TestController(loggerInstance, config, getCourseControllerInstance(), client);
    return TestControllerInstance;
}