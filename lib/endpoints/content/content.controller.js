"use strict";

import questions from "../question/question.model";
import tests from "../test/tests.model";
import studyMaterials from "../studyMaterial/studyMaterial.model";
import formulas from "../formula/formula.model";
import videos from "../video/video.model";
import audios from "../audio/audio.model";
import files from "../file/file.model";
import helperFunctions from "../../util/helperFunctions"
import mongoose from "mongoose";
import { ResponseController } from "../../util/response.controller";

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
        this.fileModelInstance = files;
    }

    contentList(req, res){
        let contentTypes = [];
        let conceptIds = [], questionTypes = [], status = [];
        req.body.query.contentTypes.split(",").map(contentType => {
            contentTypes.push(contentType);
        });
        if(req.body.body.conceptIds) {
            req.body.body.conceptIds.split(",").map(conceptId => {
                conceptIds.push(mongoose.Types.ObjectId(conceptId));
            });
        }

        if(req.body.body.questionTypes) {
            req.body.body.questionTypes.split(",").map(questionType => {
                questionTypes.push(questionType);
            });
        }

        if(req.body.body.status) {
            req.body.body.status.split(",").map(sta => {
                status.push(sta);
            });
        }

        let promises = contentTypes.map(this.findContentData.bind(this, req.body.query, conceptIds, questionTypes, status));
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

    findContentData(reqQuery, conceptIds, questionTypes, status, contentType ) {

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
                let query = { };

                if(conceptIds.length > 0 ) {
                    query.conceptId = {"$in": conceptIds};
                }

                if(questionTypes.length > 0 ) {
                    query.questionType = {"$in": questionTypes};
                }

                if(status.length > 0 ) {
                    query.status = {"$in": status};
                }
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
            } else if (contentType === 'files') {
                paginationParams.populate = "userId";
                // let query = { "conceptId": { "$in": conceptIds } };
                this.fileModelInstance.paginate({}, paginationParams).then(content => {
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

    findContentDataCount(reqQuery, conceptIds, questionTypes, status, contentType) {
        return new Promise((resolve, reject) => {
            if (contentType === 'testpapers') {
                // let query = { "conceptId": { "$in": conceptIds } };
                this.testModelInstance.count({}).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'question') {
                let query = {  };
                if (conceptIds.length > 0) {
                    query.conceptId = { "$in": conceptIds };
                }

                if (questionTypes.length > 0) {
                    query.questionType = { "$in": questionTypes };
                }

                if (status.length > 0) {
                    query.status = { "$in": status };
                }
                this.questionModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'studymaterial') {
                // let query = { "conceptId": { "$in": conceptIds } };
                this.studyMaterialModelInstance.count({}).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'formulas') {
                // let query = { "conceptId": { "$in": conceptIds } };
                this.formulaModelInstance.count({}).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'videos') {
                // let query = { "conceptId": { "$in": conceptIds } };
                this.videoModelInstance.count({}).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'audios') {
                // let query = { "conceptId": { "$in": conceptIds } };
                this.audioModelInstance.count({}).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'files') {
                // let query = { "conceptId": { "$in": conceptIds } };
                this.fileModelInstance.count({}).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else {
                reject("Invalid content type: " + contentType);
            }
        });
    }

    totalCountByContent(req, res) {
        let contentTypes = [];
        let conceptIds = [], questionTypes = [], status = [];

        req.body.query.contentTypes.split(",").map(contentType => {
            contentTypes.push(contentType);
        });
        
        if (req.body.body.conceptIds.length) {
            req.body.body.conceptIds.split(",").map(conceptId => {
                conceptIds.push(mongoose.Types.ObjectId(conceptId));
            });
        }

        if (req.body.body.questionTypes) {
            req.body.body.questionTypes.split(",").map(questionType => {
                questionTypes.push(questionType);
            });
        }

        if (req.body.body.status) {
            req.body.body.status.split(",").map(sta => {
                status.push(sta);
            });
        }

        let promises = contentTypes.map(this.findContentDataCount.bind(this, req.body.query, conceptIds, questionTypes, status));
        Promise.all(promises).then(data => {
                let total = data.reduce((total, num) => {
                    return total+num;
                });
                return res.json(new ResponseController(200, "Content count returned successfully", {count: total}));
            }, err => {
                return res.json(new ResponseController(200, "Error retrieving content count", err));
        });
    }

    getTagList(req, res){
        let key = req.params.key;
        if(key === "question"){
            ((that) => {
                that.questionModelInstance.aggregate([{ '$unwind': '$tags' },
                { '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }])
                    .then(function (questionTagList) {
                        return res.json(new ResponseController(200, "Tag List",questionTagList[0].uniqueValues ));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "studymaterial"){
            ((that) => {
                that.studyMaterialModelInstance.aggregate([{ '$unwind': '$tags' },
                { '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }])
                    .then(function (studyMaterialTagList) {
                        return res.json(new ResponseController(200, "Tag List",studyMaterialTagList[0].uniqueValues ));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "testpapers"){
            ((that) => {
                that.testModelInstance.aggregate([{ '$unwind': '$tags' },
                { '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }])
                    .then(function (testTagList) {
                        return res.json(new ResponseController(200, "Tag List",testTagList[0].uniqueValues ));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "formulas"){
            ((that) => {
                that.formulaModelInstance.aggregate([{ '$unwind': '$tags' },
                { '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }])
                    .then(function (formulaTagList) {
                        return res.json(new ResponseController(200, "Tag List",formulaTagList[0].uniqueValues ));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "files"){
            ((that) => {
                that.fileModelInstance.aggregate([{ '$unwind': '$tags' },
                { '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }])
                    .then(function (fileTagList) {
                        return res.json(new ResponseController(200, "Tag List",fileTagList[0].uniqueValues ));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "videos"){
            ((that) => {
                that.videoModelInstance.aggregate([{ '$unwind': '$tags' },
                { '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }])
                    .then(function (videoTagList) {
                        return res.json(new ResponseController(200, "Tag List",videoTagList[0].uniqueValues ));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        } 
        else if(key === "audios"){
            ((that) => {
                that.audioModelInstance.aggregate([{ '$unwind': '$tags' },
                { '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }])
                    .then(function (audioTagList) {
                        return res.json(new ResponseController(200, "Tag List",audioTagList[0].uniqueValues ));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else{
            return res.json(new ResponseController(500, "Error retrieving tag list", 'Invalid key'));
        }
        // //questionPromise, studyMaterialPromise,  formulaPromise, testPromise, filePromise, 
        // Promise.all([audioPromise, videoPromise])
        //     .then((values) => {
        //         let finalTagList = [];
        //         values.map((value) => { finalTagList.push(value) });
        //         return res.json(new ResponseController(200, "Tag List", finalTagList));
        //     })
        //     .catch(reason => {
        //         return res.json(new ResponseController(500, "Error retrieving tag list", reason));
        //     });
    }
}