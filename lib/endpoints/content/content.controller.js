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
import {ContentTagController} from "../contentTag/contentTag.controller";

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
        let conceptIds = [], questionTypes = [], status = [], tagValues = [];
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

        if(req.body.body.values){
            tagValues = req.body.body.values;
        }

        let promises = contentTypes.map(this.findContentData.bind(this, req.body.query, conceptIds, questionTypes, status, tagValues));
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

    findContentData(reqQuery, conceptIds, questionTypes, status,tagValues, contentType ) {
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
                let query = {};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.testModelInstance.paginate(query, paginationParams).then(content => {
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

                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                paginationParams.populate = "userId";
                this.questionModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'studymaterial') {
                // let query = { "conceptId": { "$in": conceptIds } };
                let query = {};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                paginationParams.populate = "userId";
                this.studyMaterialModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'formulas') {
                paginationParams.populate = "userId";
                // let query = { "conceptId": { "$in": conceptIds } };
                let query = {};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.formulaModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'videos') {
                paginationParams.populate = "userId";
                // let query = { "conceptId": { "$in": conceptIds } };
                let query = {};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.videoModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'audios') {
                paginationParams.populate = "userId";
                // let query = { "conceptId": { "$in": conceptIds } };
                let query = {};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.audioModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'files') {
                paginationParams.populate = "userId";
                // let query = { "conceptId": { "$in": conceptIds } };
                let query = {};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.fileModelInstance.paginate(query, paginationParams).then(content => {
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

    findContentDataCount(reqQuery, conceptIds, questionTypes, status,tagValues, contentType) {
        return new Promise((resolve, reject) => {
            if (contentType === 'testpapers') {
                let query={};
                // let query = { "conceptId": { "$in": conceptIds } };
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.testModelInstance.count(query).then(content => {
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
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.questionModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'studymaterial') {
                // let query = { "conceptId": { "$in": conceptIds } };
                let query={};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.studyMaterialModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'formulas') {
                // let query = { "conceptId": { "$in": conceptIds } };
                let query={};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.formulaModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'videos') {
                // let query = { "conceptId": { "$in": conceptIds } };
                let query={};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.videoModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'audios') {
                // let query = { "conceptId": { "$in": conceptIds } };
                let query={};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.audioModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'files') {
                // let query = { "conceptId": { "$in": conceptIds } };
                let query={};
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.fileModelInstance.count(query).then(content => {
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
        let conceptIds = [], questionTypes = [], status = [], tagValues=[];

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

        if(req.body.body.values){
            tagValues = req.body.body.values;
        }

        let promises = contentTypes.map(this.findContentDataCount.bind(this, req.body.query, conceptIds, questionTypes, status, tagValues));
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
        let query = [{ '$unwind': '$tags' },{ '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }];
        if(key === "question"){
            ((that) => {
                that.questionModelInstance.aggregate(query)
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
                that.studyMaterialModelInstance.aggregate(query)
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
                that.testModelInstance.aggregate(query)
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
                that.formulaModelInstance.aggregate(query)
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
                that.fileModelInstance.aggregate(query)
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
                that.videoModelInstance.aggregate(query)
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
                that.audioModelInstance.aggregate(query)
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

    getTagValues(req,res){
        let key = req.params.key;
        let idArray = req.body.idArray.map((id)=>{return mongoose.Types.ObjectId(id)});
        //check query should we group on the basis of type as well as relation id
        let query = [{ '$unwind': '$tags' },
        {'$unwind':'$tags.values'},
        {'$match':{'tags.relation.id':{'$in':idArray}}},
        {'$group': { _id: {'type':'$tags.type','id':'$tags.relation.id'},
        'name' :{'$first':'$tags.relation.name'},
        'values': {  '$addToSet': "$tags.values" } }}];
        if(key === "question"){
            ((that) => {
                that.questionModelInstance.aggregate(query)
                    .then(function (questionTagList) {
                        questionTagList.map((element)=>{ 
                            element.type=element._id.type;
                            element._id.name=element.name;
                            element.relation=element._id;
                            delete element._id;
                            delete element.relation.type;
                            delete element.name;
                            });
                        ContentTagController.mapValues(questionTagList).then(() => {
                           return res.json(new ResponseController(200, "Tag List",questionTagList)); 
                        });
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "studymaterial"){
            ((that) => {
                that.studyMaterialModelInstance.aggregate(query)
                    .then(function (studyMaterialTagList) {
                        studyMaterialTagList.map((element)=>{ 
                            element.type=element._id.type;
                            element._id.name=element.name;
                            element.relation=element._id;
                            delete element._id;
                            delete element.relation.type;
                            delete element.name;
                            });
                        ContentTagController.mapValues(studyMaterialTagList).then(() => {
                           return res.json(new ResponseController(200, "Tag List",studyMaterialTagList)); 
                        });
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "testpapers"){
            ((that) => {
                that.testModelInstance.aggregate(query)
                    .then(function (testTagList) {
                        testTagList.map((element)=>{ 
                            element.type=element._id.type;
                            element._id.name=element.name;
                            element.relation=element._id;
                            delete element._id;
                            delete element.relation.type;
                            delete element.name;
                            });
                        ContentTagController.mapValues(testTagList).then(() => {
                           return res.json(new ResponseController(200, "Tag List",testTagList)); 
                        });
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "formulas"){
            ((that) => {
                that.formulaModelInstance.aggregate(query)
                    .then(function (formulaTagList) {
                        formulaTagList.map((element)=>{ 
                            element.type=element._id.type;
                            element._id.name=element.name;
                            element.relation=element._id;
                            delete element._id;
                            delete element.relation.type;
                            delete element.name;
                            });
                        ContentTagController.mapValues(formulaTagList).then(() => {
                           return res.json(new ResponseController(200, "Tag List",formulaTagList)); 
                        });
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "files"){
            ((that) => {
                that.fileModelInstance.aggregate(query)
                    .then(function (fileTagList) {
                        fileTagList.map((element)=>{ 
                            element.type=element._id.type;
                            element._id.name=element.name;
                            element.relation=element._id;
                            delete element._id;
                            delete element.relation.type;
                            delete element.name;
                            });
                        ContentTagController.mapValues(fileTagList).then(() => {
                           return res.json(new ResponseController(200, "Tag List",fileTagList)); 
                        });
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else if(key === "videos"){
            ((that) => {
                that.videoModelInstance.aggregate(query)
                    .then(function (videoTagList) {
                        videoTagList.map((element)=>{ 
                            element.type=element._id.type;
                            element._id.name=element.name;
                            element.relation=element._id;
                            delete element._id;
                            delete element.relation.type;
                            delete element.name;
                            });
                        ContentTagController.mapValues(videoTagList).then(() => {
                           return res.json(new ResponseController(200, "Tag List",videoTagList)); 
                        });
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        } 
        else if(key === "audios"){
            ((that) => {
                that.audioModelInstance.aggregate(query)
                    .then(function (audioTagList) {
                        audioTagList.map((element)=>{ 
                            element.type=element._id.type;
                            element._id.name=element.name;
                            element.relation=element._id;
                            delete element._id;
                            delete element.relation.type;
                            delete element.name;
                            });
                        ContentTagController.mapValues(audioTagList).then(() => {
                           return res.json(new ResponseController(200, "Tag List",audioTagList)); 
                        });
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error retrieving tag list", err));
                    })
            })(this)
        }
        else{
            return res.json(new ResponseController(500, "Error retrieving tag list", 'Invalid key'));
        }
    }

    deleteObject(req, res) {
        let key = req.query.key;
        let query = { _id: {'$in':req.body.idArray} };
        if (key === "question") {
            ((that) => {
                that.questionModelInstance.findOneAndRemove(query)
                    .then(function () {
                        return res.json(new ResponseController(200, "Object deleted"));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error deleting object", err));
                    })
            })(this)
        }
        else if (key === "studymaterial") {
            ((that) => {
                that.studyMaterialModelInstance.findOneAndRemove(query)
                    .then(function () {
                        return res.json(new ResponseController(200, "Object deleted"));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error deleting object", err));
                    })
            })(this)
        }
        else if (key === "testpapers") {
            ((that) => {
                that.testModelInstance.findOneAndRemove(query)
                    .then(function () {
                        return res.json(new ResponseController(200, "Object deleted"));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error deleting object", err));
                    })
            })(this)
        }
        else if (key === "formulas") {
            ((that) => {
                that.formulaModelInstance.findOneAndRemove(query)
                    .then(function () {
                        return res.json(new ResponseController(200, "Object deleted"));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error deleting object", err));
                    })
            })(this)
        }
        else if (key === "files") {
            ((that) => {
                that.fileModelInstance.findOneAndRemove(query)
                    .then(function () {
                        return res.json(new ResponseController(200, "Object deleted"));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error deleting object", err));
                    })
            })(this)
        }
        else if (key === "videos") {
            ((that) => {
                that.videoModelInstance.findOneAndRemove(query)
                    .then(function () {
                        return res.json(new ResponseController(200, "Object deleted"));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error deleting object", err));
                    })
            })(this)
        }
        else if (key === "audios") {
            ((that) => {
                that.audioModelInstance.findOneAndRemove(query)
                    .then(function () {
                        return res.json(new ResponseController(200, "Object deleted"));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, "Error deleting object", err));
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