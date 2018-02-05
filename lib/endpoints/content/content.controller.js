"use strict";

import questions from "../question/question.model";
import tests from "../test/tests.model";
import helperFunctions from "../../util/helperFunctions"

export class ContentController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
        this.testModelInstance = tests;
    }

    contentList(req, res){
        let allContentTypes = ['test', 'question'];
        let contentTypes = [];
        if (typeof req.query.contentTypes === 'string') {
            contentTypes = [req.query.contentTypes];
        } else if (req.query.contentTypes){
            req.query.contentTypes.map(contentType => {
                contentTypes.push(contentType);
            });
        } else {
            allContentTypes.map(contentType => {
                contentTypes.push(contentType);
            });
        }
        let promises = contentTypes.map(this.findContentData.bind(this, req.query));
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
        let resultData = consolidatedResults.slice(0, Number(req.query.limit) || 20);
        let lastRecordDate = resultData && resultData.length > 0 ? resultData[resultData.length - 1].updatedAt : undefined;
        return res.json({
            'status': '200',
            'message': 'Content list retrieved successfully',
            'data': resultData,
            'paginationDate': lastRecordDate
        });
    }

    findContentData(reqQuery, contentType) {
        return new Promise((resolve, reject) => {
            let paginationParams = {
                page: Number(reqQuery.page),
                limit: Number(reqQuery.limit) || 20,
                sort: { updatedAt: -1 },
                lean: true
            };
            let query = { '$and': [] }

            if (reqQuery.paginationDate) {
                let date = {};
                date.$lt = new Date(reqQuery.paginationDate);
                query['$and'].push({
                    updatedAt: date
                });
            }
            if (query['$and'] && query['$and'].length < 1) {
                delete query['$and'];
            }
            if (contentType === 'test') {
                this.testModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'question') {
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