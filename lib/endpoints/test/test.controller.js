"use strict";
import tests from "./tests.model";
import { ResponseController } from "../../util/response.controller";
import { _ } from "lodash";
import {ContentTagController} from "../contentTag/contentTag.controller";

export class TestController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.testModelInstance = tests;
    }

    getTestById(testId, res) {
        this.testModelInstance.findById(testId)
        .populate('data.sections.subSection.questions.qId', 'questionType passageId content.questionContent')
        .lean()
        .then(test => {

            if (!test) {
                this.loggerInstance.debug("Test not found with given ID");
                return res.json(new ResponseController(404, "Test not found with given ID"));
            }
            else if(Array.isArray(test.tags)){
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
            this.getTestById(req.query.draftId, res);
        } else if (req.params.id) {
            this.getTestById(req.params.id, res);
        } else {
            this.testModelInstance.find()
                .then(tests => {
                    this.loggerInstance.info("Retrieved test list");
                    return res.json(new ResponseController(200, "Test list retrieved successfully", tests));
                })
                .catch(() => {
                    this.loggerInstance.error("DB Error retrieving test list");
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
            let cloneObj = _.pick(oldObj, ['_id']);
            let newClonedObj = _.omitBy(bodyObj, function(value, key) {
                return key.startsWith("_id");
            });
            newClonedObj.publishId = cloneObj._id;
            newClonedObj.status = "DRAFT";
            let test = new this.testModelInstance(newClonedObj);
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
                let cloneObj = _.pick(oldObj, ['_id']);
                let newClonedObj = _.omitBy(bodyObj, function(value, key) {
                    return key.startsWith("_id");
                });
                newClonedObj.publishId = cloneObj._id;
                newClonedObj.status = "DRAFT";

                that.testModelInstance.findOneAndUpdate({_id: oldObj.draftId}, newClonedObj,
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

        this.testModelInstance.findById(testId)
        .then( (newObj) => {
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
            (new this.testModelInstance(updatedTest)).save()
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
                this.loggerInstance.error("DB error updating test");
                return res.json(new ResponseController(500, "Unable to update test", err));
            });
        }).catch(err => {
            this.loggerInstance.error("DB error updating test");
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

    publishTest(testId) {
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
                                doc.testCode = cloneObj.testCode;
                                doc.testMode = cloneObj.testMode;
                                doc.data = cloneObj.data;
                                doc.status = cloneObj.status;
                                doc.courseId = cloneObj.courseId;
                                doc.tags = cloneObj.tags;
                                doc.syllabus = cloneObj.syllabus;
                                doc.settings = cloneObj.settings;
                                doc.displayName = cloneObj.displayName;
                                doc.name = cloneObj.name;
                                doc.draftId = undefined;
                                doc.save(function (err) {
                                    if(err) {
                                        that.loggerInstance.error(`Test Publish Error ${err}`);
                                        reject(err);
                                    }
                                    resolve();
                                });
                            });
                        } else {
                            doc.status = "PUBLISHED";
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

    deleteTest(testId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.testModelInstance.findById(testId, function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting Test ${err}`);
                        reject(err);
                    } else {
                        doc.status = "DELETED";
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
}