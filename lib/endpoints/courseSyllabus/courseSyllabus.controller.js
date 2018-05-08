"use strict";

import courseSyllabus from "./courseSyllabus.model";
import formula from "../formula/formula.model";
import video from "../video/video.model";
import studyMaterial from "../studyMaterial/studyMaterial.model";
import course from "../course/course.model";
import question from "../question/question.model";

import { ResponseController } from "../../util/response.controller";
import errorMessages from '../../util/errorMessages';
import mongoose from 'mongoose';
import {
    sendClientError,
    sendServerError,
    sendSuccess
} from '../../util/responseLogger'

export class courseSyllabusController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = courseSyllabus;
        this.formulaModelInstance = formula;
        this.videoModelInstance = video;
        this.questionModelInstance = question;
        this.studyMaterialModelInstance = studyMaterial;
        this.courseModelInstance = course;
        this.message = new errorMessages();
        this.message.courseSyllabus();
    }

    getSubjects(req, res) {
        let query = {
            query: { courseId: req.params.courseId, type: 'subject' },
            sort: { name: 1 }
        };
        this.getCourseSyllabus(query)
            .then(data => this.handleOtherResponses(this.message.successSubject, data, res))
            .catch(err => this.handleError(this.message.findSubjectError, err, this.message.notSubjectFound, res))
    }

    getChapters(req, res) {
        let query = {
            query: { courseId: req.params.courseId, type: 'chapter', ancestors: mongoose.Types.ObjectId(req.params.subjectId) },
            sort: { name: 1 }
        };
        this.getCourseSyllabus(query)
            .then(data => this.handleOtherResponses(this.message.successChapter, data, res))
            .catch(err => this.handleError(this.message.findChapterError, err, this.message.notChapterFound, res))
    }

    getConcepts(req, res) {
        let query = {
            query: { courseId: req.params.courseId, type: 'concept', ancestors: { $all: [mongoose.Types.ObjectId(req.params.subjectId), mongoose.Types.ObjectId(req.params.chapterId)] } },
            sort: { name: 1 }
        };
        this.getCourseSyllabus(query)
            .then(data => this.handleOtherResponses(this.message.successConcept, data, res))
            .catch(err => this.handleError(this.message.findConceptError, err, this.message.notConceptFound, res))
    }

    getAllPartially(req, res) {
        let responseObject = {};
        let querySubject = {
            query: { courseId: req.params.courseId, type: 'subject' },
            sort: { name: 1 }
        };
        var subjectId = null, chapterId = null;
        if (req.query['subjectId']) {
            subjectId = req.query['subjectId'];
        }
        if (req.query['subjectId'] && req.query['chapterId']) {
            subjectId = req.query['subjectId'];
            chapterId = req.query['chapterId'];
        }
        this.getCourseSyllabus(querySubject)
            .then(data => {
                responseObject.subject = data;
                subjectId = subjectId || data[0]._id;
                let queryChapter = {
                    query: { courseId: req.params.courseId, type: 'chapter', ancestors: mongoose.Types.ObjectId(subjectId) },
                    sort: { name: 1 }
                };
                return this.getCourseSyllabus(queryChapter)
            })
            .then(data => {
                responseObject.chapter = data;
                subjectId = subjectId || responseObject.subject[0]._id;
                chapterId = chapterId || data[0]._id;
                let queryConcept = {
                    query: { courseId: req.params.courseId, type: 'concept', ancestors: { $all: [mongoose.Types.ObjectId(chapterId), mongoose.Types.ObjectId(subjectId)] } },
                    sort: { name: 1 }
                };
                return this.getCourseSyllabus(queryConcept)
            })
            .then(data => {
                responseObject.concept = data;
                return this.handleOtherResponses(this.message.successPartial, responseObject, res);
            })
            .catch(err => this.handleError(this.message.findPartialError, err, this.message.notPartialFound, res))
    }

    getAll(req, res) {
        let query = {
            query: { courseId: req.params.courseId },
            sort: { name: 1 }
        };
        this.getCourseSyllabus(query)
            .then(data => this.handleOtherResponses(this.message.successAll, data, res))
            .catch(err => this.handleError(this.message.findAllError, err, this.message.notAllFound, res))
    }

    async getCourseAndSyllabus(req, res) {
        try {
            const query = {
                query: { courseId: req.params.courseId },
                sort: { name: 1 }
            };
            const responseData = {};
            responseData.courseSyllabus = await this.modelInstance.find(query.query).sort(query.sort);
            responseData.courseInfo = await this.courseModelInstance.findById(req.params.courseId)
                .select('name courseImage category subCategory courseType');
            this.handleOtherResponses(this.message.successAll, responseData, res);
        } catch (error) {
            return sendServerError({
                res,
                responseMessage: 'Error finding course syllabus'
            });
        }
    }

    getCourseSyllabus(query) {
        return new Promise((resolve, reject) => {
            this.modelInstance.find(query.query).sort(query.sort)
                .then(items => resolve(items))
                .catch(err => reject(err));
        })

    }

    getOneCourseSyllabus(query) {
        return new Promise((resolve, reject) => {
            this.modelInstance.findOne(query.query)
                .then(items => items ? resolve(items) : reject(404))
                .catch(err => { reject(err) });
        })
    }

    getOneFormula(query) {
        return new Promise((resolve, reject) => {
            this.formulaModelInstance.findOne({ _id: query })
                .then(items => items ? resolve(items) : reject(404))
                .catch(err => reject(err));
        })
    }

    getOneVideo(query) {
        return new Promise((resolve, reject) => {
            this.videoModelInstance.findOne({ _id: query })
                .then(items => items ? resolve(items) : reject(404))
                .catch(err => reject(err));
        })
    }

    getOneQuestion(query) {
        return new Promise((resolve, reject) => {
            this.questionModelInstance.findOne({ _id: query })
                .then(items => items ? resolve(items) : reject(404))
                .catch(err => reject(err));
        })
    }

    getOneStudyMaterial(query) {
        return new Promise((resolve, reject) => {
            this.studyMaterialModelInstance.findOne({ _id: query })
                .then(items => items ? resolve(items) : reject(404))
                .catch(err => reject(err));
        })
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

    deleteCourseSyllabusItem(req, res) {
        let id = req.params.courseId;
        this.modelInstance.findByIdAndRemove(id)
            .then(data => {
                if (!data) {
                    this.loggerInstance.debug("Not found");
                    return res.json(new ResponseController(404, "Not found"));
                }
                this.loggerInstance.info(this.message.successDeleteCourseSyllabus);
                return res.json(new ResponseController(200, this.message.successDeleteCourseSyllabus, data));
            }).catch(err => {
                this.loggerInstance.error(this.message.errorDeleteCourseSyllabus);
                return res.json(new ResponseController(500, this.message.errorDeleteCourseSyllabus, err));
            });
    }

    createCourseSyllabusItem(req, res) {
        let courseSyllabus = new this.modelInstance(req.body);
        courseSyllabus.save()
            .then(data => {
                this.loggerInstance.info(this.message.successCreateCourseSyllabus);
                res.json(new ResponseController(200, this.message.successCreateCourseSyllabus, data));
            }).catch(err => {
                this.loggerInstance.error(this.message.errorCreateCourseSyllabus);
                return err.name === 'ValidationError' ?
                    res.json(new ResponseController(400, "Validation Error", err)) :
                    res.json(new ResponseController(500, this.message.errorCreateCourseSyllabus));
            });
    }

    patchCourseSyllabusItem(req, res) {
        delete req.body._id;
        let id = req.params.courseId;
        let newItem = req.body;
        newItem.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newItem, {
                new: true
            }).then(data => {
                if (!data) {
                    this.loggerInstance.debug("Not found");
                    return res.json(new ResponseController(404, "Not found"));
                }
                this.loggerInstance.info(this.message.successPatchCourseSyllabus);
                return res.json(new ResponseController(200, this.message.successPatchCourseSyllabus, data));
            }).catch(err => {
                this.loggerInstance.error(this.message.errorPatchCourseSyllabus);
                return res.json(new ResponseController(500, this.message.errorPatchCourseSyllabus, err));
            });
    }

    getAllFormula(data) {
        for (let i = 0; i < data.length; i++) {
            data[i] = this.getOneFormula(data[i])
        }
        return Promise.all(data)
    }

    getAllVideo(data) {
        for (let i = 0; i < data.length; i++) {
            data[i] = this.getOneVideo(data[i])
        }
        return Promise.all(data)
    }

    getAllQuestion(masterIds, courseName) {
        let orArray = []
        for (let i = 0; i < masterIds.length; i++) {
            orArray.push({
                conceptId: mongoose.Types.ObjectId(masterIds[i])
            });
        }
        return new Promise((resolve, reject) => {
            if (orArray.length === 0) {
                resolve([]);
            }
            else {
                this.questionModelInstance.aggregate([
                    { $match: { "$or": orArray } },
                    { $unwind: "$tags" },
                    { $match: { "tags.relation.name": "previousYearPaper" } },
                    { $match: { "tags.values": courseName } }
                ])
                    .then(items => items ? resolve(items) : reject(404))
                    .catch(err => reject(err));
            }
        })
    }

    getAllStudyMaterial(data) {
        for (let i = 0; i < data.length; i++) {
            data[i] = this.getOneStudyMaterial(data[i])
        }
        return Promise.all(data)
    }

    getConceptDetail(req, res) {
        let responseObject = {};
        let masterIds = [];
        let query = {
            query: { _id: req.params.conceptId }
        };
        this.getOneCourseSyllabus(query)
            .then(data => {
                responseObject.concept = data;
                masterIds = data.masterIDs;
                let formulaContent = [],
                    videoContent = [],
                    studyMaterialContent = [],
                    questionContent = [],
                    content = data.associatedContent;
                if (content) {
                    for (let i = 0; i < content.length; i++) {
                        if (content[i].contentType === 'VIDEO') {
                            videoContent.push(content[i].contentId);
                        }
                        else if (content[i].contentType === 'FORMULA') {
                            formulaContent.push(content[i].contentId);
                        }
                        else if (content[i].contentType === 'STUDYMATERIAL') {
                            studyMaterialContent.push(content[i].contentId);
                        }
                    }
                }
                return Promise.all([
                    this.getAllFormula(formulaContent),
                    this.getAllVideo(videoContent),
                    this.getAllQuestion(masterIds, req.params.courseName),
                    this.getAllStudyMaterial(studyMaterialContent)
                ])
            })
            .then(data => {
                responseObject.formulae = data[0];
                responseObject.videos = data[1];
                responseObject.questions = data[2];
                responseObject.studyMaterials = data[3];
                return this.handleOtherResponses(this.message.successConceptDetail, responseObject, res);
            })
            .catch(err => this.handleError(this.message.getConceptDetailError, err, this.message.notConceptFound, res))
    }

    async getCourseSubjects(req, res) {
        if (!Array.isArray(req.body.courseIds)) {
            return res.json(new ResponseController(400, "courseIds should be array"));
        }
        try {
            const allData = (await Promise.all(req.body.courseIds.map(courseId => new Promise((resolve, reject) =>
                this.modelInstance.find({ courseId: courseId, type: 'subject'})
                .select('name courseId')
                .then(course => {
                    let courseObj = {};
                    courseObj.courseId = course[0].courseId;
                    courseObj.data = course.map(eachCourse => {
                        return { "name": eachCourse.name, "_id": eachCourse._id }
                    });
                    resolve(courseObj);
                })
                .catch(err => reject(err))
            )))).filter(data => data);

            return res.json(new ResponseController(200, "Successfully retrieved course subjects", allData));
        } catch (error) {
            this.loggerInstance.error(error);
            return res.json(new ResponseController(500, "Error retrieving course subjects"));
        }
    }

    async getSubjectDetails(req, res) {
        try {
            const subjects = await this.modelInstance.find({ _id: { $in: req.body.ids } })
                .select('name');
            return res.json(new ResponseController(200, "Subject names retrieved successfully", subjects));
        } catch (error) {
            this.loggerInstance.error(error);
            return res.json(new ResponseController(500, "Unable to get subject details"));
        }
    }
}