"use strict";

import courseSyllabus from "./courseSyllabus.model";
import { ResponseController } from "../../util/response.controller";
import errorMessages from '../../util/errorMessages';
import mongoose from 'mongoose';

export class courseSyllabusController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = courseSyllabus;
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
            sort: {}
        };
        this.getCourseSyllabus(query)
            .then(data => this.handleOtherResponses(this.message.successAll, data, res))
            .catch(err => this.handleError(this.message.findAllError, err, this.message.notAllFound, res))
    }

    getCourseSyllabus(query) {
        return new Promise((resolve, reject) => {
            this.modelInstance.find(query.query).sort(query.sort)
                .then(items => { resolve(items) })
                .catch(err => { reject(err) });
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
            .then(data => this.handleOtherResponses(this.message.successDeleteCourseSyllabus, data, res))
            .catch(err => this.handleError(this.message.errorDeleteCourseSyllabus, 500, err, res));
    }

    createCourseSyllabusItem(req, res) {
        let courseSyllabus = new this.modelInstance(req.body);
        courseSyllabus.save()
            .then(data => this.handleOtherResponses(this.message.successCreateCourseSyllabus, data, res))
            .catch(err => this.handleError(this.message.errorDeleteCourseSyllabus, 500, err, res));
    }

    patchCourseSyllabusItem(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newItem = req.body;
        newItem.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newItem, {
            new: true
        }).then(response => response ?
            this.handleOtherResponses(this.message.successPatchCourseSyllabus, response, res) :
            this.handleError(null, 404, this.message.courseSyllabusNotFound, res))
        .catch(err => this.handleError(this.message.errorPatchCourseSyllabus, 500, err, res));
    }

}