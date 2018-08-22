"use strict";

import questions from "../question/question.model";

import tests from "../test/tests.model";
import studyMaterials from "../studyMaterial/studyMaterial.model";
import formulas from "../formula/formula.model";
import videos from "../video/video.model";
import audios from "../audio/audio.model";
import helperFunctions from "../../util/helperFunctions"
import mongoose from "mongoose";
import { ResponseController } from "../../util/response.controller";
import {ContentTagController} from "../contentTag/contentTag.controller";
import loggerInstance from "../../util/apiLogger";
import {getTestControllerInstance} from "../test/test.controller";
import {getAudioControllerInstance} from "../audio/audio.controller";
import {getVideoControllerInstance} from "../video/video.controller";
import {getQuestionControllerInstance} from "../question/question.controller";
import {getStudyMaterialControllerInstance} from "../studyMaterial/studyMaterial.controller";
import {getFormulaControllerInstance} from "../formula/formula.controller";

let ContentControllerInstance,
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

let questionInstance = getQuestionControllerInstance(),
    studyMaterialInstance = getStudyMaterialControllerInstance(),
    testInstance = getTestControllerInstance(),
    formulaInstance = getFormulaControllerInstance(),
    audioInstance = getAudioControllerInstance(),
    videoInstance = getVideoControllerInstance();

class ContentController {

    constructor(loggerInstance, config, questionInstance, studyMaterialInstance, testInstance, formulaInstance, audioInstance, videoInstance) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
        this.testModelInstance = tests;
        this.studyMaterialModelInstance = studyMaterials;
        this.formulaModelInstance = formulas;
        this.videoModelInstance = videos;
        this.audioModelInstance = audios;
        this.questionInstance = questionInstance;
        this.studyMaterialInstance = studyMaterialInstance;
        this.testInstance = testInstance;
        this.formulaInstance = formulaInstance;
        this.audioInstance = audioInstance;
        this.videoInstance = videoInstance;
    }

    contentList(req, res){
        let contentTypes = [];
        let conceptIds = [], questionTypes = [], status = [], tagValues = [], updatedAt = req.body.body.updatedAt || -1, searchedInput;
        req.body.query.contentTypes.split(",").map(contentType => {
            contentTypes.push(contentType);
        });

        if (req.body.body.searchedInput) {
            searchedInput = req.body.body.searchedInput;
        }

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
                status.push(sta.toUpperCase());
            });
        }

        if(req.body.body.values){
            tagValues = req.body.body.values;
        }

        let promises = contentTypes.map(this.findContentData.bind(this, req.body.query, conceptIds, questionTypes, status, tagValues, updatedAt, searchedInput, req.body.body.dbQuery));
        Promise.all(promises).then(this.consolidateDataAndSendResult.bind(this, req, res), err => {
            return res.json({
                'status': '500',
                'message': err
            });
        });
    }

    consolidateDataAndSendResult(req, res, results){
        let consolidatedResults = [];
        results[0].map(result => {
            consolidatedResults.push(result);
        });

        helperFunctions.sortArrayByUpdatedAt(consolidatedResults);
        let resultData = consolidatedResults.slice(0, Number(req.body.query.limit) || 20);
        return res.json({
            'status': '200',
            'message': 'Content list retrieved successfully',
            'data': resultData
        });
    }

    findContentData(reqQuery, conceptIds, questionTypes, status, tagValues, updatedAt, searchedInput, dbQuery, contentType) {
        return new Promise((resolve, reject) => {
            let paginationParams = {
                page: Number(reqQuery.page),
                limit: Number(reqQuery.limit) || 20,
                sort: { updatedAt: updatedAt },
                lean: true,
                populate: ['draftId']
            };

            let draftIdFlag = 0;
            console.log("status : ", status);
            if(status.length>0 && status.includes("DUAL")){
                draftIdFlag = 1;
                status = status.filter((stat)=> stat !== "DUAL");
            }
            if (contentType === 'testpapers') {

                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {

                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('T-') ?
                        `${searchedInput}-DRAFT` : searchedInput;

                    let textQueryObj = { "name": {'$regex': searchedInput.trim(), $options: 'i'} };
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                //query["publishId"] = { "$exists": false };
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {'$in':tagValues} });
                }

                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);
                this.testModelInstance.find(dbQuery)
                    .sort(paginationParams.sort)
                    .skip((paginationParams.page - 1) * paginationParams.limit)
                    .limit(paginationParams.limit)
                    .populate('draftId')
                    .populate('publishId')
                    .populate('userId')
                    .lean()
                    .exec( (err, docs) => {
                        if(err)
                            reject(err);
                        else {

                            docs = docs.map((cnt) => {
                                cnt.displayName=cnt.displayName ? cnt.displayName : cnt.name
                                return cnt;
                            });
                            resolve(docs);
                        }
                    });
            } else if (contentType === 'question') {
                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {

                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('Q-') ?
                        `${searchedInput}-DRAFT` : searchedInput;

                    let textQueryObj = { "content.questionContent": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                // query["publishId"] = { "$exists": false };
                if(conceptIds.length > 0 ) {
                    query.$and.push({ "conceptId": {"$in": conceptIds} });
                }

                if(questionTypes.length > 0 ) {
                    query.$and.push({ "questionType": {"$in": questionTypes} });
                }

                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {'$in':tagValues} });
                }

                paginationParams.populate.push("userId");
                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);

                this.questionModelInstance.find(dbQuery)
                .sort(paginationParams.sort)
                .skip((paginationParams.page -1) * paginationParams.limit)
                .limit(paginationParams.limit)
                .populate('draftId')
                .populate('publishId')
                .populate('userId')
                .lean()
                .exec( (err, docs) => {
                    err ? reject(err) : resolve(docs);
                });
            } else if (contentType === 'studymaterial') {
                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('S-') ?
                        `${searchedInput}-DRAFT` : searchedInput;

                    console.log("searchedInput : ", searchedInput);
                    console.log("draftIdFlag : ", draftIdFlag);

                    let textQueryObj = { "content.title": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                // query["publishId"] = { "$exists": false };
                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": { "$in": conceptIds } });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": { "$in": tagValues } });
                }


                paginationParams.populate.push("userId");
                
                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);
                this.studyMaterialModelInstance.find(dbQuery)
                .sort(paginationParams.sort)
                .skip((paginationParams.page - 1) * paginationParams.limit)
                .limit(paginationParams.limit)
                .populate('draftId')
                .populate('publishId')
                .populate('userId')
                .lean()
                .exec( (err, docs) => {
                    err ? reject(err) : resolve(docs);
                });
            } else if (contentType === 'formulas') {
                paginationParams.populate.push("userId");
                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('F-') ?
                        `${searchedInput}-DRAFT` : searchedInput;

                    let textQueryObj = { "content.title": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": { "$in": conceptIds }});
                }
                // query["publishId"] = { "$exists": false };
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": { "$in": tagValues }});
                }

                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);
                this.formulaModelInstance.find(dbQuery)
                    .sort(paginationParams.sort)
                    .skip((paginationParams.page - 1) * paginationParams.limit)
                    .limit(paginationParams.limit)
                    .populate('draftId')
                    .populate('publishId')
                    .populate('userId')
                    .lean()
                    .exec( (err, docs) => {
                        err ? reject(err) : resolve(docs);
                    });

            } else if (contentType === 'videos') {
                paginationParams.populate.push("userId");
                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('V-') ?
                        `${searchedInput}-DRAFT` : searchedInput;
                    let textQueryObj = { "content.title": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                // query["publishId"] = { "$exists": false };
                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": { "$in": conceptIds }});
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {'$in':tagValues}});
                }

                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);
                this.videoModelInstance.find(dbQuery)
                    .sort(paginationParams.sort)
                    .skip((paginationParams.page -1 ) * paginationParams.limit)
                    .limit(paginationParams.limit)
                    .populate('draftId')
                    .populate('publishId')
                    .populate('userId')
                    .lean()
                    .exec( (err, docs) => {
                        err ? reject(err) : resolve(docs);
                    });

            } else if (contentType === 'audios') {
                paginationParams.populate.push("userId");
                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('A-') ?
                        `${searchedInput}-DRAFT` : searchedInput;
                    let textQueryObj = { "content.title": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                // query["publishId"] = { "$exists": false };
                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": { "$in": conceptIds }});
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {'$in':tagValues}});
                }

                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);
                this.audioModelInstance.find(dbQuery)
                    .sort(paginationParams.sort)
                    .skip((paginationParams.page - 1) * paginationParams.limit)
                    .limit(paginationParams.limit)
                    .populate('draftId')
                    .populate('publishId')
                    .populate('userId')
                    .lean()
                    .exec( (err, docs) => {
                        err ? reject(err) : resolve(docs);
                    });

            } else if (contentType === 'linked') {

                let skip = Number(reqQuery.page) * 20;
                let limit = Number(reqQuery.limit) || 20;
                let query = [{
                    '$group': {
                        _id: '$passageId',
                        'passageQuestion': { '$first': '$content.passageQuestion' },
                        'totalQuestion': { '$first': '$passageInfo.totalQuestion' },
                        'updatedAt': { '$first': '$updatedAt' },
                        'questionType': { '$first': 'Linked' },
                        'userId': { '$first': '$userId' }
                    }
                },
                { '$skip': skip },
                { '$limit': limit },
                ];


                this.questionModelInstance.aggregate(query).then(content => {
                    content.map((content)=>{
                        content.passageId = content._id;
                        delete content._id;
                        return content;
                    });
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

    findContentDataCount(reqQuery, conceptIds, questionTypes, status,tagValues, dbQuery, searchedInput, contentType) {
        return new Promise((resolve, reject) => {
            let draftIdFlag = 0;
            console.log("status : ", status);

            if(status.length>0 && status.includes("DUAL")){
                draftIdFlag = 1;
                status = status.filter((stat)=> stat !== "DUAL")
            }
            if (contentType === 'testpapers') {

                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {

                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('T-') ?
                        `${searchedInput}-DRAFT` : searchedInput;

                    let textQueryObj = { "name": {'$regex': searchedInput.trim(), $options: 'i'} };
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }


                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }

                dbQuery.$and.push(...query.$and);
                console.log("dbQuery", JSON.stringify(dbQuery));
                this.testModelInstance.count(dbQuery).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'question') {
                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('Q-') ?
                        `${searchedInput}-DRAFT` : searchedInput;

                    let textQueryObj = { "content.questionContent": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                if (conceptIds.length > 0) {
                    query.$and.push({ "conceptId": {"$in":conceptIds} });
                }

                if (questionTypes.length > 0) {
                    query.$and.push({ "questionType": {"$in":questionTypes} });
                }

                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }


                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);

                this.questionModelInstance.count(dbQuery).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'studymaterial') {
                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('S-') ?
                        `${searchedInput}-DRAFT` : searchedInput;

                    console.log("searchedInput : ", searchedInput);
                    console.log("draftIdFlag : ", draftIdFlag);

                    let textQueryObj = { "content.title": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": {"$in":conceptIds} });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }


                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);
                this.studyMaterialModelInstance.count(dbQuery).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'formulas') {

                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('F-') ?
                        `${searchedInput}-DRAFT` : searchedInput;

                    let textQueryObj = { "content.title": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": {"$in":conceptIds} });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }

                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);

                this.formulaModelInstance.count(dbQuery).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'videos') {

                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('V-') ?
                        `${searchedInput}-DRAFT` : searchedInput;
                    let textQueryObj = { "content.title": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": {"$in":conceptIds} });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }

                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);
                this.videoModelInstance.count(dbQuery).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'audios') {
                let query = this.statusFilterWork(status, draftIdFlag);

                if(searchedInput) {
                    searchedInput = draftIdFlag === 1 && searchedInput.trim().startsWith('A-') ?
                        `${searchedInput}-DRAFT` : searchedInput;
                    let textQueryObj = { "content.title": { "$regex": searchedInput.trim(),
                            $options: 'i' }};
                    searchedInput && this.searchInputQueryBuilder(textQueryObj, searchedInput, query);
                }

                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": {"$in":conceptIds} });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }

                if (!dbQuery['$and']) {
                    dbQuery['$and'] = [];
                }
                dbQuery.$and.push(...query.$and);

                this.audioModelInstance.count(dbQuery).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'linked') {
                this.questionModelInstance.distinct('passageId').then(content => {
                    resolve(content.length);
                }, err => {
                    reject(err);
                });
            } else {
                reject("Invalid content type: " + contentType);
            }
        });
    }

    searchInputQueryBuilder(textQueryObj, searchedInput, query) {
        const searchedArr = searchedInput.split(",");

        query.$and.push({ "status": {"$ne": "DELETED"} });
        query.$and.push({ $or: [ { "contentId": { "$in": searchedArr }}, textQueryObj ] });
        console.log("query :", JSON.stringify(query));
    }

    statusFilterWork(status, draftIdFlag) {
        let query = null;
        if (status.length === 0 && draftIdFlag === 0) {
            query = {
                $and: [
                    {
                        /*$or: [
                            {$and: [{status: "DRAFT"}, {publishId: {$exists: false}}]},
                            {$and: [{status: "PUBLISHED"}]}
                        ]*/
                        $or: [
                            {$and: [{status: "DRAFT"}]},
                            {$and: [{status: "PUBLISHED", draftId: { "$exists": false}}]}
                        ]
                    }]
            }
        } else if (status.length === 0 && draftIdFlag === 1) {
            query = {
                $and: [
                    {"publishId": {'$exists':true} },
                    { "status": "DRAFT"}
                ]
            };
        } else if (status.length > 0 && draftIdFlag === 0) {
            if (status.includes("DELETED")) {
                query = {$and: [{status: {"$in": status}}]};
            } else {
                query = {$and: [{status: {"$in": status}}, {"publishId": {'$exists': false}}]};
            }
        } else if (status.length > 0 && draftIdFlag === 1) {
            if (status.includes("DELETED")) {
                query = {$and: [{status: {"$in": status}}]};
            } else {
                query = {$and: [{status: {"$in": status}}, {"publishId": {'$exists': true}}]};
            }
        } else
            query = {$and: []};
        return query;
    }

    totalCountByContent(req, res) {
        let contentTypes = [];
        let conceptIds = [], questionTypes = [], status = [], tagValues=[], searchedInput;

        req.body.query.contentTypes.split(",").map(contentType => {
            contentTypes.push(contentType);
        });
        
        if (req.body.body.conceptIds) {
            req.body.body.conceptIds.split(",").map(conceptId => {
                conceptIds.push(mongoose.Types.ObjectId(conceptId));
            });
        }

        if (req.body.body.searchedInput) {
            searchedInput = req.body.body.searchedInput;
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
        let promises = contentTypes.map(this.findContentDataCount.bind(this, req.body.query, conceptIds, questionTypes, status, tagValues, req.body.body.dbQuery, searchedInput));
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
        //let query = [{ '$unwind': '$tags' },{ '$group': { _id: null, 'uniqueValues': { '$addToSet': "$tags.relation" } } }];
        let query = [{ '$unwind': '$tags' },{ '$group': { _id: '$tags.relation.id' ,'name':{'$first':'$tags.relation.name'}}},{'$project':{'id':'$_id','name':'$name',_id:0}}];
        if(key === "question"){
            ((that) => {
                that.questionModelInstance.aggregate(query)
                    .then(function (questionTagList) {
                        return res.json(new ResponseController(200, "Tag List",questionTagList ));
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
                        return res.json(new ResponseController(200, "Tag List",studyMaterialTagList ));
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
                        return res.json(new ResponseController(200, "Tag List",testTagList ));
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
                        return res.json(new ResponseController(200, "Tag List",formulaTagList ));
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
                        return res.json(new ResponseController(200, "Tag List",videoTagList ));
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
                        return res.json(new ResponseController(200, "Tag List",audioTagList ));
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
        let update = {'$set':{'status':'DELETED', 'aclMetaData.updatedBy': req.body.aclMetaData.updatedBy}};
        let options = {multi:true, runValidators: true};
        let successResponse = req.body.idArray.length>1 ? `s deleted`:` deleted`;
        let errorResponse = `Error deleting ${req.query.key}`;
        if (key === "question") {
            ((that) => {
                that.questionModelInstance.update(query,update,options)
                    .then(function () {
                        return res.json(new ResponseController(200, "Question"+successResponse));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, errorResponse, err));
                    })
            })(this)
        }
        else if (key === "studymaterial") {
            ((that) => {
                that.studyMaterialModelInstance.update(query,update,options)
                    .then(function () {
                        return res.json(new ResponseController(200, "Study Material"+successResponse));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, errorResponse, err));
                    })
            })(this)
        }
        else if (key === "testpapers") {
            ((that) => {
                that.testModelInstance.update(query,update,options)
                    .then(function () {
                        return res.json(new ResponseController(200, "Test Paper"+successResponse));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, errorResponse, err));
                    })
            })(this)
        }
        else if (key === "formulas") {
            ((that) => {
                that.formulaModelInstance.update(query,update,options)
                    .then(function () {
                        return res.json(new ResponseController(200, "Formula"+successResponse));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, errorResponse, err));
                    })
            })(this)
        }
        else if (key === "videos") {
            ((that) => {
                that.videoModelInstance.update(query,update,options)
                    .then(function () {
                        return res.json(new ResponseController(200, "Video"+successResponse));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, errorResponse, err));
                    })
            })(this)
        }
        else if (key === "audios") {
            ((that) => {
                that.audioModelInstance.update(query,update,options)
                    .then(function () {
                        return res.json(new ResponseController(200, "Audio"+successResponse));
                    })
                    .catch(function (err) {
                        return res.json(new ResponseController(500, errorResponse, err));
                    })
            })(this)
        }
        else{
            return res.json(new ResponseController(500, `Invalid key -> ${key}`, 'Invalid key'));
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

    async publishContent(req, res) {

        let publish = req.query.publish === "true" ? true : false;
        let contentId = req.params.id;
        let contentType = req.query.contentType;
        let {aclMetaData} = req.body;
        switch (contentType) {
            case 'question':
                try {
                    await this.questionInstance.publishQuestion(contentId, aclMetaData, publish);
                    this.loggerInstance.info(`publishQuestion Done`);
                    return res.json(new ResponseController(200, "publishQuestion Done ", {}));
                } catch(err) {
                    this.loggerInstance.error(`publishQuestion Error ${err}`);
                    return res.json(new ResponseController(500, "publishQuestion Error ", err.message));
                }
                break;
            case 'studymaterial':
                this.studyMaterialInstance.publishMaterial(contentId, aclMetaData, publish)
                .then((data) => {
                    this.loggerInstance.info(`publish Study Material Done`);
                    return res.json(new ResponseController(200, "publish Study Material Done ", data));
                })
                .catch((err) => {
                    this.loggerInstance.error(`publish Study Material Error ${err}`);
                    return res.json(new ResponseController(500, "publish Study Material Error ",
                        err.message));
                });
                break;
            case 'testpapers':
                this.testInstance.publishTest(contentId, aclMetaData, publish)
                .then((data) => {
                    this.loggerInstance.info(`publish Test Done`);
                    return res.json(new ResponseController(200, "publish Test Done ", data));
                })
                .catch((err) => {
                    this.loggerInstance.error(`publish Test Error ${err}`);
                    return res.json(new ResponseController(500, "publish Test Error ", err.message));
                });
                break;
            case 'formulas':
                this.formulaInstance.publishFormula(contentId, aclMetaData, publish)
                .then((data) => {
                    this.loggerInstance.info(`publish Formula Done`);
                    return res.json(new ResponseController(200, "publish Formula Done ", data));
                })
                .catch((err) => {
                    this.loggerInstance.error(`publish Formula Error ${err}`);
                    return res.json(new ResponseController(500, "publish Formula Error ", err.message));
                });
                break;
            case 'videos':
                this.videoInstance.publishVideo(contentId, aclMetaData, publish)
                .then((data) => {
                    this.loggerInstance.info(`publish Video Done`);
                    return res.json(new ResponseController(200, "publish Video Done ", data));
                })
                .catch((err) => {
                    this.loggerInstance.error(`publish Video Error ${err}`);
                    return res.json(new ResponseController(500, "publish Video Error ", err.message));
                });
                break;
            case 'audios':
                this.audioInstance.publishAudio(contentId, aclMetaData, publish)
                .then((data) => {
                    this.loggerInstance.info(`publish Audio Done`);
                    return res.json(new ResponseController(200, "publish Audio Done ", data));
                })
                .catch((err) => {
                    this.loggerInstance.error(`publish Audio Error ${err}`);
                    return res.json(new ResponseController(500, "publish Audio Error ", err.message));
                });
                break;
            default:            // for audios
        }
    }

}

export function getContentControllerInstance() {
    ContentControllerInstance = ContentControllerInstance || new ContentController(loggerInstance, config, questionInstance, studyMaterialInstance, testInstance, formulaInstance, audioInstance, videoInstance);
    return ContentControllerInstance;
}