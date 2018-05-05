"use strict";

import courseItem from "./courseItem.model";
import course from "../course/course.model";
import test from "../test/tests.model";
import testSummary from "../testSummary/testSummary.model";
import { ResponseController } from "../../util/response.controller";
import errorMessages from '../../util/errorMessages';
import mongoose from 'mongoose';
import {
    sendClientError,
    sendServerError,
    sendSuccess
} from '../../util/responseLogger'
import _ from 'lodash';

export class courseItemController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = courseItem;
        this.courseModelInstance = course;
        this.message = new errorMessages();
        this.testModelInstance = test;
        this.testSummaryModelInstance = testSummary;
        this.message.courseItem();
    }

    get(req, res) {
        if (req.params.id){
            return this.getById(req.params.id, res);
        }
        let query = {
            sort: {}
        };
        this.modelInstance.find(query)
            .then(data => this.handleOtherResponses(this.message.successGet, data, res))
            .catch(err => this.handleError(this.message.errorGet, err, null, res))
    }

    getById(id, res){
        this.modelInstance.findById(id)
            .then(data => data ? 
                this.handleOtherResponses(this.message.successGet, data, res) :
                this.handleError(null, 404, this.message.notFound, res))
            .catch(err => this.handleError(this.message.errorGet, err, null, res))
    }

    async create(req, res) {
        try {
            const {
                itemName, itemType, courseId
            } = req.body;
            const courseitem = new this.modelInstance({
                name: itemName,
                itemType
            });
            const responseObject = await courseitem.save();
            const masterCourse = await this.courseModelInstance.findById(courseId);
            masterCourse.courseItems.push({
                id: courseitem._id,
                itemName,
                itemType
            });
            await masterCourse.save();
            return sendSuccess({
                res,
                responseObject,
                responseMessage: 'Course item created successfully'
            });
        } catch (error) {
            return sendServerError({
                res,
                responseMessage: 'Error creating course test item'
            });
        }
    }

    async createTest (req, res) {
        try {
            const {
                courseItemId
            } = req.params;
            let {
                scheduleDate, scheduleEndDate, displayName, testType, status, codeName, duration, testId
            } = req.body;
            let paperDetail;
            if (testId) {
                const testDetails = await this.testModelInstance.findById(testId)
                    .populate('data.sections.subSection.questions.qId');
                if (!testDetails) {
                    return sendClientError({
                        res,
                        responseMessage: 'Invalid test ID'
                    });
                }
                paperDetail = {
                    id: testDetails._id,
                    syllabus: testDetails.syllabus,
                    type: testDetails.settings.testType,
                    name: testDetails.name
                }
            }
            const courseItemDetails = await this.modelInstance.findById(courseItemId);
            if (!courseItemDetails) {
                return sendClientError({
                    res,
                    responseMessage: 'Invalid course item ID'
                });
            }
            if (!testType) {
                return sendClientError({
                    res,
                    responseMessage: 'Test type is mandatory'
                });
            }
            if (!status) {
                return sendClientError({
                    res,
                    responseMessage: 'Status is mandatory'
                });
            }
            if (!codeName) {
                return sendClientError({
                    res,
                    responseMessage: 'Code name is mandatory'
                });
            }
            if (!duration) {
                return sendClientError({
                    res,
                    responseMessage: 'Duration is mandatory'
                });
            }
            if (isNaN(duration)) {
                return sendClientError({
                    res,
                    responseMessage: 'Duration should be numeric'
                });
            }
            if (!displayName) {
                return sendClientError({
                    res,
                    responseMessage: 'Display name is mandatory'
                });
            }
            duration = typeof(duration) !== 'string' ? duration.toString() : duration;
            const newTest = {
                testType,
                displayName,
                codeName,
                status,
                duration,
                scheduleDate,
                scheduleEndDate,
                paperDetail
            }
            const testsMap = {
                scheduledTests: {
                    tests: 'schedule',
                    id: 'scheduleID'
                },
                sampleTests: {
                    tests: 'sampletests',
                    id: 'sampleTestId'
                },
                testGroup: {
                    tests: 'tests',
                    id: 'testId'
                }
            }
            newTest[testsMap[courseItemDetails.itemType].id] = mongoose.Types.ObjectId().toString();
            courseItemDetails.details[testsMap[courseItemDetails.itemType].tests].push(newTest);
            await courseItemDetails.save();
            return sendSuccess({
                res,
                responseObject: newTest,
                responseMessage: 'Succesfully added test to test item'
            });
        } catch (error) {
            return sendServerError({
                res,
                responseMessage: 'Error adding a test to course'
            });
        }
    }

    async updateTest(req, res) {
        try {
            const {
                testHolderId, courseItemId
            } = req.params;
            let {
                scheduleDate, scheduleEndDate, displayName, testType, status, codeName, duration, testId
            } = req.body;
            const courseItemDetails = await this.modelInstance.findById(courseItemId);
            if (!courseItemDetails) {
                return sendClientError({
                    res,
                    responseMessage: 'Invalid course item ID'
                });
            }
            const testsMap = {
                scheduledTests: {
                    tests: 'schedule',
                    id: 'scheduleID'
                },
                sampleTests: {
                    tests: 'sampletests',
                    id: 'sampleTestId'
                },
                testGroup: {
                    tests: 'tests',
                    id: 'testId'
                }
            }
            const oldTest = courseItemDetails.details[testsMap[courseItemDetails.itemType].tests]
                .find(testHolder => testHolder[testsMap[courseItemDetails.itemType].id] === testHolderId);
            if (!oldTest) {
                return sendClientError({
                    res,
                    responseMessage: 'Invalid test holder ID'
                });
            }
            let paperDetail;
            if (!testId) {
                oldTest.paperDetail = undefined;
            } else if (oldTest.paperDetail.testId != testId) {
                const testDetails = await this.testModelInstance.findById(testId)
                    .populate('data.sections.subSection.questions.qId');
                if (!testDetails) {
                    return sendClientError({
                        res,
                        responseMessage: 'Invalid test ID'
                    });
                }
                oldTest.paperDetail = {
                    id: testDetails._id,
                    syllabus: testDetails.syllabus,
                    type: testDetails.settings.testType,
                    name: testDetails.name
                }
            }
            if (duration && isNaN(duration)) {
                return sendClientError({
                    res,
                    responseMessage: 'Duration should be numeric'
                });
            }
            duration = typeof (duration) !== 'string' ? duration.toString() : duration;
            const newTest = {
                testType,
                displayName,
                codeName,
                status,
                duration,
                scheduleDate,
                scheduleEndDate
            }
            _.merge(oldTest, newTest);
            await courseItemDetails.save();
            return sendSuccess({
                res,
                responseObject: oldTest,
                responseMessage: 'Succesfully updated test'
            });
        } catch (error) {
            return sendServerError({
                res,
                responseMessage: 'Error updating test'
            });
        }
    }

    async unlinkTest (req, res) {
        try {
            const {
                testHolderId, courseItemId
            } = req.params;
            const courseItemDetails = await this.modelInstance.findById(courseItemId);
            if (!courseItemDetails) {
                return sendClientError({
                    res,
                    responseMessage: 'Invalid course item ID'
                });
            }
            const testsMap = {
                scheduledTests: {
                    tests: 'schedule',
                    id: 'scheduleID'
                },
                sampleTests: {
                    tests: 'sampletests',
                    id: 'sampleTestId'
                },
                testGroup: {
                    tests: 'tests',
                    id: 'testId'
                }
            }
            const oldTest = courseItemDetails.details[testsMap[courseItemDetails.itemType].tests]
                .find(testHolder => testHolder[testsMap[courseItemDetails.itemType].id] === testHolderId);
            if (!oldTest) {
                return sendClientError({
                    res,
                    responseMessage: 'Invalid test holder ID'
                });
            }
            oldTest.paperDetail = undefined;
            await courseItemDetails.save();
            return sendSuccess({
                res,
                responseObject: oldTest,
                responseMessage: 'Succesfully unlinked test from test holder'
            });
        } catch (error) {
            return sendServerError({
                res,
                responseMessage: 'Error unlinking test'
            });
        }
    }
    
    patch(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newItem = req.body;
        newItem.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newItem, {
            new: true
        }).then(response => response ?
            this.handleOtherResponses(this.message.successUpdate, response, res) :
            this.handleError(null, 404, this.message.notFound, res))
            .catch(err => this.handleError(this.message.errorUpdate, 500, err, res));
    }

    put(req, res) {
        console.log("ITEM: ", req.body);
        let newItem = req.body;
        newItem._id = newItem._id ? newItem._id : new mongoose.Types.ObjectId();
        this.modelInstance.findOneAndUpdate({
            _id: newItem._id
        }, newItem, {
            new: true,
            upsert: true,
            // overwrite: true,
            setDefaultsOnInsert: true
        }).then(response => {
            // console.log(response);
            this.loggerInstance.info("PUT successful for courseItem");
            return res.json(response);
        }).catch(err => {
            this.loggerInstance.error("Error in PUT for courseItem");
            return res.json(new ResponseController(500, "Error in PUT for courseItem", err));
        });
    }
        
    handleError(errorMessage, err, otherError, res) {
        if (err === 404) {
            this.loggerInstance.debug(otherError);
            return res.json(new ResponseController(404, otherError));
        }
        this.loggerInstance.error(err);
        return res.json(new ResponseController(500, errorMessage, err));
    }

    handleOtherResponses(success, responseObject, res) {
        this.loggerInstance.info(success);
        return res.json(new ResponseController(200, success, responseObject));
    }
}