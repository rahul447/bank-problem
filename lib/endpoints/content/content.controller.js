"use strict";

import questions from "../question/question.model";
import tests from "../test/tests.model";
import helperFunctions from "../../util/helperFunctions"
import mongoose from "mongoose";

export class ContentController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
        this.testModelInstance = tests;
    }

    contentList(req, res){
        let contentTypes = [];
        let conceptIds = [];

        req.body.query.contentTypes.split(",").map(contentType => {
            contentTypes.push(contentType);
        });
        req.body.body.conceptIds.split(",").map(conceptId => {
            conceptIds.push(mongoose.Types.ObjectId(conceptId));
        });

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

            if (contentType === 'test') {
                let query = {};
                this.testModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'question') {
                let query = { "conceptId": { "$in": conceptIds } };
                this.questionModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else {
                reject("Invalid content type: " + contentType);
            }
        });
    }
}