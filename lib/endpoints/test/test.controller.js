"use strict";
import tests from "./tests.model";
import { ResponseController } from "../../util/response.controller";
import { _ } from "lodash";
import {ContentTagController} from "../contentTag/contentTag.controller";
import questionModel from "../question/question.model"
import mongoose from "mongoose";


export class TestController {
    constructor(loggerInstance, config, elasticClient = {}) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.testModelInstance = tests;
        this.elasticClient = elasticClient;
        this.questionModelInstance = questionModel;
    }

    getTestById(testId, req, res) {
        const query = req.query.dbQuery;
        query.$and.push({
            _id: testId
        });
        this.testModelInstance.findOne(query)
        .populate('data.sections.subSection.questions.qId', 'questionType passageId content.questionContent')
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
            this.testModelInstance.find(req.query.dbQuery)
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

    updateTest(req, res) {
        delete req.body._id;
        let testId = req.params.id;
        if (!testId) {
            this.loggerInstance.debug("No testId specified");
            return res.json(new ResponseController(400, "No testId specified"));
        }

        let newTest = req.body;
        newTest.updatedAt = new Date();

        const query = req.body.dbQuery;
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
                test.populate('data.sections.subSection.questions.qId', 'questionType passageId content.questionContent')
                    .execPopulate()
                    .then(fullTest => {
                        fullTest = JSON.parse(JSON.stringify(fullTest));
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
                            that.testModelInstance.findOne({_id: doc._id}, function (err, doc) {
                                that.deleteTest(doc.draftId._id, aclMetaData)
                                .then(() => {
                                    doc.testCode = cloneObj.testCode;
                                    doc.testMode = cloneObj.testMode;
                                    doc.data = cloneObj.data;
                                    doc.status = cloneObj.status;
                                    doc.courseId = cloneObj.courseId;
                                    doc.tags = cloneObj.tags ? cloneObj.tags : null;
                                    doc.syllabus = cloneObj.syllabus;
                                    doc.settings = cloneObj.settings;
                                    doc.displayName = cloneObj.displayName;
                                    doc.name = cloneObj.name;
                                    doc.draftId = undefined;
                                    const {updatedBy} = aclMetaData;
                                    doc.aclMetaData.updatedBy = updatedBy;
                                    that.loggerInstance.info("Draft Test Deleted");
                                    doc.save(function (err) {
                                        if(err) {
                                            that.loggerInstance.error(`Test Save Failed ${err}`);
                                            reject(err);
                                        }
                                        resolve();
                                    });
                                });
                            });
                        } else {
                            doc.status = "PUBLISHED";
                            const {updatedBy} = aclMetaData;
                            doc.aclMetaData.updatedBy = updatedBy;
                            doc.save(function (err) {
                                if(err) {
                                    that.loggerInstance.error(`Test Save Failed ${err}`);
                                    reject(err);
                                }
                                resolve();
                            });
                        }
                    }
                });
            })(this);
        });
    }

    deleteTest(testId, aclMetaData) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.testModelInstance.findById(testId, function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting Test ${err}`);
                        reject(err);
                    } else {
                        doc.status = "DELETED";
                        const {updatedBy} = aclMetaData;
                        doc.aclMetaData.updatedBy = updatedBy;
                        doc.save(function (err) {
                            if(err) {
                                that.loggerInstance.error(`Test Soft Delete Failed ${err}`);
                                reject(err);
                            }
                            resolve();
                        });
                    }
                });
            })(this);
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
                    console.log("error : ", error);
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
                    console.log(" validStatus : ", validStatus);
                    resolve(validStatus);
                }
            });
        });
    }

    validateOnly(doc) {
        let status = {'name': true, 'displayName': true, 'testCode': true, 'testType': true, 'duration': true, 'language': true, 'Rules': true, 'DuplicateSection': true, 'DuplicatesubSectionName': true, 'QuestionNotEqual': true, 'DuplicateQuestion': true, 'QuestionCode': true};
        let sectionNameSet = new Set(), subSectionNameSet = new Set(), quesSet = new Set(),
            promises = [];

        for(let i in doc) {
            this.validate(i, doc, status, sectionNameSet, subSectionNameSet, quesSet, promises)
        }
        let validStatus = Object.keys(status).every((k) => status[k]);
        return {status,  validStatus};
    }

    validate(key, test, status, sectionNameSet, subSectionNameSet, quesSet, promises) {
        if(key === 'name' || key === 'displayName' || key === 'testCode') {
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
                    if(typeof quesCode  !==  "undefined")
                        status.QuestionCode = await new Promise(async (resolve) => resolve(await this.validateTestQuestions(quesCode, subSec.questions.map(q => mongoose.Types.ObjectId(q.qId)))));
                    if(subSectionNameSet.size > 0 && subSectionNameSet.has(subSec.name)) {
                        status.DuplicatesubSectionName = false;
                    } else
                        subSectionNameSet.add(subSec.name);

                    if(subSec.questions.length !== subSec.noOfQuestions) {
                        status.QuestionNotEqual = false;
                    }

                    subSec.questions.map(ques => {

                        if(quesSet.size > 0 && quesSet.has(ques.qId)) {
                            status.DuplicateQuestion = false;
                        } else
                            quesSet.add(ques.qId);

                        promises.push(new Promise((resolve) =>
                            questionInstance.publishQuestion(ques.qId).then()
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
}