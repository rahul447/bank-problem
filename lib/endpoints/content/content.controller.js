"use strict";

import questions from "../question/question.model";
import tests from "../test/tests.model";
import studyMaterials from "../studyMaterial/studyMaterial.model";
import formulas from "../formula/formula.model";
import videos from "../video/video.model";
import audios from "../audio/audio.model";
import helperFunctions from "../../util/helperFunctions"
import mongoose from "mongoose";

export class ContentController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
        this.testModelInstance = tests;
        this.studyMaterialModelInstance = studyMaterials;
        this.formulaModelInstance = formulas;
        this.videoModelInstance = videos;
        this.audioModelInstance = audios;
    }

    contentList(req, res){
        let contentTypes = [];
        let conceptIds = [];


        req.body.query.contentTypes.split(",").map(contentType => {
            contentTypes.push(contentType);
        });

        if(req.body.body.conceptIds.length) {
            req.body.body.conceptIds.split(",").map(conceptId => {
                conceptIds.push(mongoose.Types.ObjectId(conceptId));
            });
        }

        let promises = contentTypes.map(this.findContentData.bind(this, req.body.query, conceptIds));
        Promise.all(promises).then(this.consolidateDataAndSendResult.bind(this, req, res), err => {
            return res.json({
                'status': '500',
                'message': err
            });
        });
    }

    consolidateDataAndSendResult(req, res, results){
        let consolidatedResults = [];
        results.map(result => {
            consolidatedResults.push(...result.docs);
        });

        helperFunctions.sortArrayByUpdatedAt(consolidatedResults);
        let resultData = consolidatedResults.slice(0, Number(req.body.query.limit) || 20);
        return res.json({
            'status': '200',
            'message': 'Content list retrieved successfully',
            'data': resultData
        });
    }

    findContentData(reqQuery, conceptIds, contentType) {
        return new Promise((resolve, reject) => {
            let paginationParams = {
                page: Number(reqQuery.page),
                limit: Number(reqQuery.limit) || 20,
                sort: { updatedAt: -1 },
                lean: true
            };

            if (contentType === 'testpapers') {
                // let query = { "conceptId": { "$in": conceptIds } };
                //paginationParams.populate = "userId";
                this.testModelInstance.paginate({}, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'question') {
                let query = { "conceptId": { "$in": conceptIds } };
                paginationParams.populate = "userId";
                this.questionModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'studymaterial') {
                // let query = { "conceptId": { "$in": conceptIds } };
                paginationParams.populate = "userId";
                this.studyMaterialModelInstance.paginate({}, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'formulas') {
                paginationParams.populate = "userId";
                // let query = { "conceptId": { "$in": conceptIds } };
                this.formulaModelInstance.paginate({}, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'videos') {
                paginationParams.populate = "userId";
                // let query = { "conceptId": { "$in": conceptIds } };
                this.videoModelInstance.paginate({}, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'audios') {
                paginationParams.populate = "userId";
                // let query = { "conceptId": { "$in": conceptIds } };
                this.audioModelInstance.paginate({}, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            }
            else {
                reject("Invalid content type: " + contentType);
            }
        });
    }

    totalCountByContent(req, res) {

        let url = `${this.contentPath}/totalCountByContent`;

        dataApi.post(url, {contentTypes: req.query.contentTypes, conceptIds: req.body.conceptIds},
            (err, data) => {
                if (err || data.statusCode === "500") {
                    that.loggerInstance.info("Error creating questions");
                    return res.json(new ResponseController(500, "Error creating questions", data.responseObject));
                }
                else {
                    that.loggerInstance.info("Question saved");
                    return res.json(new ResponseController(200, "Question saved", data.responseObject));
                }
            });



        this.contentModelInstance.totalCountByContent()
            .then(() => {

            })
            .catch((err) => {
                return res.json(err);
            });

    }
}