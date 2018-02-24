"use strict";
import tests from "./tests.model";
import { ResponseController } from "../../util/response.controller";
import { _ } from "lodash";
export class TestController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.testModelInstance = tests;
    }
    getTestById(testId, res) {
        this.testModelInstance.findById(testId)
        .populate('data.sections.subSection.questions.qId', 'content.questionContent')
        .lean()
        .then(test => {
            if (!test) {
                this.loggerInstance.debug("Test not found with given ID");
                return res.json(new ResponseController(404, "Test not found with given ID"));
            }
            test.data.sections.map(section => {
                section.subSection.map(subSection => {
                    subSection.questions.map(question => {
                        let name = question.qId.content[0].questionContent;
                        question.qId = question.qId._id;
                        question.name = name;
                    });
                });
            });
            this.loggerInstance.info("Retrieved test");
            return res.json(new ResponseController(200, "Test retrieved successfully", test));
        })
            .catch(() => {
                this.loggerInstance.error("DB Error retrieving test");
                return res.json(new ResponseController(500, "Error retrieving test"));
            })
    }
    testList(req, res) {
        if (req.params.id) {
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
            .then(test => {
                if (!test) {
                    this.loggerInstance.debug("Test not found");
                    return res.json(new ResponseController(404, "Not found test with given ID"));
                }
                let updatedTest = _.mergeWith(test, newTest, (src, dst) => {
                    if (_.isArray(src)) {
                        return dst;
                    }
                });
                (new this.testModelInstance(updatedTest)).save()
                    .then(test => {
                        test.populate('data.sections.subSection.questions.qId', 'content.questionContent')
                            .execPopulate()
                            .then(fullTest => {
                                fullTest = JSON.parse(JSON.stringify(fullTest));
                                fullTest.data.sections.map(section => {
                                    section.subSection.map(subSection => {
                                        subSection.questions.map(question => {
                                            let name = question.qId.content[0].questionContent;
                                            question.qId = question.qId._id;
                                            question.name = name;
                                        });
                                    });
                                });
                                this.loggerInstance.info("Test updated successfully");
                                return res.json(new ResponseController(200, "Test updated successfully", fullTest));
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
}