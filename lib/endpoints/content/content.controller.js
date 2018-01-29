"use strict";

import questions from "../question/question.model";
import tests from "../test/tests.model";

export class ContentController {

    constructor(loggerInstance, config) {
        console.log(" ------in ContentController--------- ");
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
        this.testModelInstance = tests;
    }

    contentList(req, res){
        console.log(" in contentList 2");
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
        let promises = contentTypes.map(contentType => {
            return new Promise((resolve, reject) => {
                // pagination and filters
                let paginationParams = {};
                paginationParams.page = req.query.page;
                paginationParams.limit = req.query.limit || 20;
                paginationParams.lean = true;

                let query = {
                    '$and': []
                }

                if (req.query.paginationDate){
                    let date = {};
                    date.$lt = new Date(req.query.paginationDate);
                    query['$and'].push({
                        updatedAt: date
                    });
                }

                if (query['$and'] && query['$and'].length < 1) {
                    delete query['$and'];
                }

                if (contentType === 'test'){
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
                    reject("Invalid content type: "+contentType);
                }
            });
        });
        Promise.all(promises).then(results => {
            // Sorting values and returning consolidated result
            let consolidatedResults = [];
            results.map(result => {
                consolidatedResults.push(...result.docs);
            });
            consolidatedResults.sort((a, b) => {
                if (!a.updatedAt) return 1;
                if (!b.updatedAt) return -1;
                return (b.updatedAt - a.updatedAt);
            });
            var resultData = consolidatedResults.slice(0, req.query.limit || 20);
            var lastRecordDate = resultData && resultData.length > 0 ? resultData[resultData.length-1].updatedAt : undefined;
            return res.json({
                'status': '200',
                'message': 'Content list retrieved successfully',
                'data': resultData,
                'paginationDate': lastRecordDate
            });
        }, err => {
            return res.json({
                'status': '500',
                'message': err
            });
        });
    }
}