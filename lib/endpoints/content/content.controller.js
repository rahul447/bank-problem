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

export class ContentController {

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
        let conceptIds = [], questionTypes = [], status = [], tagValues = [], updatedAt = req.body.body.updatedAt || -1;
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
                status.push(sta.toUpperCase());
            });
        }

        if(req.body.body.values){
            tagValues = req.body.body.values;
        }

        let promises = contentTypes.map(this.findContentData.bind(this, req.body.query, conceptIds, questionTypes, status, tagValues,updatedAt));
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

    findContentData(reqQuery, conceptIds, questionTypes, status,tagValues,updatedAt, contentType ) {
        return new Promise((resolve, reject) => {
            let paginationParams = {
                page: Number(reqQuery.page),
                limit: Number(reqQuery.limit) || 20,
                sort: { updatedAt: updatedAt },
                lean: true,
                populate: ['draftId']
            };

            let draftIdFlag = 0;
            if(status.length>0 && status.includes("DUAL")){
                draftIdFlag = 1;
                status = status.filter((stat)=>{
                    if(stat !== "DUAL"){
                        return stat;
                    }
                })
            }
            if (contentType === 'testpapers') {

                let query = status.length === 0 && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true} });
                } else{
                    query.$and.push({ "draftId": {'$exists':false} });
                }
                //query["publishId"] = { "$exists": false };
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {'$in':tagValues} });
                }

                console.log("query in testpapers");
                console.log(JSON.stringify(query));
                console.log("paginationParams : ", paginationParams);
                this.testModelInstance.find(query)
                    .sort(paginationParams.sort)
                    .skip((paginationParams.page - 1) * paginationParams.limit)
                    .limit(paginationParams.limit)
                    .populate('draftId')
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
                let query = status.length === 0  && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true} });
                }
                else{
                    query.$and.push({ "draftId": {'$exists':false} });
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
                console.log("query in question");
                console.log(JSON.stringify(query));
                console.log("paginationParams : ", paginationParams);

                this.questionModelInstance.find(query)
                .sort(paginationParams.sort)
                .skip((paginationParams.page -1) * paginationParams.limit)
                .limit(paginationParams.limit)
                .populate('draftId')
                .populate('userId')
                .lean()
                .exec( (err, docs) => {
                    err ? reject(err) : resolve(docs);
                });
            } else if (contentType === 'studymaterial') {
                let query = status.length === 0  && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true} });
                }else{
                    query.$and.push({ "draftId": {'$exists':false} });
                }
                // query["publishId"] = { "$exists": false };
                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": { "$in": conceptIds } });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": { "$in": tagValues } });
                }
                paginationParams.populate.push("userId");
                console.log("query in studymaterial");
                console.log(JSON.stringify(query));
                console.log("paginationParams : ", paginationParams);

                this.studyMaterialModelInstance.find(query)
                .sort(paginationParams.sort)
                .skip((paginationParams.page - 1) * paginationParams.limit)
                .limit(paginationParams.limit)
                .populate('draftId')
                .populate('userId')
                .lean()
                .exec( (err, docs) => {
                    err ? reject(err) : resolve(docs);
                });
            } else if (contentType === 'formulas') {
                paginationParams.populate.push("userId");
                let query = status.length === 0  && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true} });
                }
                else{
                    query.$and.push({ "draftId": {'$exists':false} });
                }
                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": { "$in": conceptIds }});
                }
                // query["publishId"] = { "$exists": false };
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": { "$in": tagValues }});
                }
                console.log("query in formulas");
                console.log(JSON.stringify(query));
                console.log("paginationParams : ", paginationParams);
                this.formulaModelInstance.find(query)
                    .sort(paginationParams.sort)
                    .skip((paginationParams.page - 1) * paginationParams.limit)
                    .limit(paginationParams.limit)
                    .populate('draftId')
                    .populate('userId')
                    .lean()
                    .exec( (err, docs) => {
                        err ? reject(err) : resolve(docs);
                    });

            } else if (contentType === 'videos') {
                paginationParams.populate.push("userId");
                let query = status.length === 0  && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true}});
                } else{
                    query.$and.push({ "draftId": {'$exists':false}});
                }
                // query["publishId"] = { "$exists": false };
                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": { "$in": conceptIds }});
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {'$in':tagValues}});
                }
                console.log("query in videos");
                console.log(JSON.stringify(query));
                console.log("paginationParams : ", paginationParams);

                this.videoModelInstance.find(query)
                    .sort(paginationParams.sort)
                    .skip((paginationParams.page -1 ) * paginationParams.limit)
                    .limit(paginationParams.limit)
                    .populate('draftId')
                    .populate('userId')
                    .lean()
                    .exec( (err, docs) => {
                        err ? reject(err) : resolve(docs);
                    });

            } else if (contentType === 'audios') {
                paginationParams.populate.push("userId");
                let query = status.length === 0  && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true}});
                } else{
                    query.$and.push({ "draftId": {'$exists':false}});
                }
                // query["publishId"] = { "$exists": false };
                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": { "$in": conceptIds }});
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {'$in':tagValues}});
                }
                console.log("query in audios");
                console.log(JSON.stringify(query));
                console.log("paginationParams : ", paginationParams);
                this.audioModelInstance.find(query)
                    .sort(paginationParams.sort)
                    .skip((paginationParams.page - 1) * paginationParams.limit)
                    .limit(paginationParams.limit)
                    .populate('draftId')
                    .populate('userId')
                    .lean()
                    .exec( (err, docs) => {
                        err ? reject(err) : resolve(docs);
                    });

            } else if (contentType === 'files') {
                paginationParams.populate.push("userId");
                let query = {};
                if(status.length>0){
                    query["status"]={'$in':status};
                }
                else{
                    query["status"]={"$nin":["DELETED"]};
                }
                if(draftIdFlag===1){
                    query["draftId"]={'$exists':true};
                }
                else{
                    query["draftId"]={'$exists':false};
                }
                // query["publishId"] = { "$exists": false };
                if(tagValues.length>0){
                    query["tags.values"] = {'$in':tagValues};
                }
                this.fileModelInstance.paginate(query, paginationParams).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'linked') {
                /*let skip = Number(reqQuery.page) * 20;
                let limit = Number(reqQuery.limit) || 20;
                let query = [];
                if(status.length>0){
                    query.push({ "$match": { "status": {'$in':status} }});
                }

                if(draftIdFlag===1){
                    query.push({ "$match": { "draftId": {'$exists':true} }});
                }
                else{
                    query.push({ "$match": { "draftId": {'$exists':false} }});
                }

                if(conceptIds.length > 0 ) {
                    query.push({ "$match": { "conceptId": {"$in": conceptIds} }});
                }

                if(questionTypes.length > 0 ) {
                    query.push({ "$match": { "questionType": {"$in": questionTypes} }});
                }

                if(tagValues.length>0){
                    query.push({ "$match": { "tags.values": {'$in':tagValues} }});
                }

                query.push({
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
                /!*{
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userId',
                        'foreignField': '_id',
                        'as': 'userDetails'
                    }
                },
                { '$unwind': '$userDetails' }*!/);
                // query["status"]={"$nin":["DELETED"]};
                // query["publishId"] = { "$exists": false };
                // if(tagValues.length>0){
                //     query["tags.values"] = {'$in':tagValues};
                // }*/


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
                /*{
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userId',
                        'foreignField': '_id',
                        'as': 'userDetails'
                    }
                },
                { '$unwind': '$userDetails' }*/];

                console.log(JSON.stringify(query));

                this.questionModelInstance.aggregate(query).then(content => {
                    content.map((content)=>{
                        content.passageId = content._id;
                        delete content._id;
                        return content;
                    });
                    let result ={docs:content};
                    resolve(result);
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
            let draftIdFlag = 0;
            if(status.length>0 && status.includes("DUAL")){
                draftIdFlag = 1;
                status = status.filter((stat)=>{
                    if(stat !== "DUAL"){
                        return stat;
                    }
                })
            }
            if (contentType === 'testpapers') {
                let query = status.length === 0 && draftIdFlag === 0 ? { $and: [
                    { $or: [
                            { status: "DRAFT" },
                            { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                        ] } ]
                     }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true}});
                } else{
                    query.$and.push({ "draftId": {'$exists':false}});
                }

                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }
                console.log("query in count testpapers");
                console.log(JSON.stringify(query));
                this.testModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'question') {
                let query = status.length === 0 && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true}});
                } else{
                    query.$and.push({ "draftId": {'$exists':false}});
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

                console.log("query in count question");
                console.log(JSON.stringify(query));
                this.questionModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'studymaterial') {
                let query = status.length === 0 && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": {"$in":conceptIds} });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true}});
                } else{
                    query.$and.push({ "draftId": {'$exists':false}});
                }
                console.log("query in count studymaterial");
                console.log(JSON.stringify(query));
                this.studyMaterialModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'formulas') {

                let query = status.length === 0 && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true}});
                } else{
                    query.$and.push({ "draftId": {'$exists':false}});
                }

                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": {"$in":conceptIds} });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }
                console.log("query in count formulas");
                console.log(JSON.stringify(query));
                this.formulaModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'videos') {
                let query = status.length === 0 && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});

                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": {"$in":conceptIds} });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true}});
                } else{
                    query.$and.push({ "draftId": {'$exists':false}});
                }
                console.log("query in count videos");
                console.log(JSON.stringify(query));
                this.videoModelInstance.count(query).then(content => {
                    resolve(content);
                }, err => {
                    reject(err);
                });
            } else if (contentType === 'audios') {
                let query = status.length === 0 && draftIdFlag === 0 ? { $and: [
                        { $or: [
                                { status: "DRAFT" },
                                { $and: [ { status: "PUBLISHED" }, { draftId: { $exists: false } } ] }
                            ] } ]
                }: (status.length > 0 ? { $and: [{ status: {"$in":status }}] } : {$and: []});
                if (conceptIds.length > 0) {
                    query.$and.push({ "subjects.chapters.concepts.conceptId": {"$in":conceptIds} });
                }
                if(tagValues.length>0){
                    query.$and.push({ "tags.values": {"$in":tagValues} });
                }

                if(draftIdFlag===1){
                    query.$and.push({ "draftId": {'$exists':true}});
                } else{
                    query.$and.push({ "draftId": {'$exists':false}});
                }
                console.log("query in count audios");
                console.log(JSON.stringify(query));
                this.audioModelInstance.count(query).then(content => {
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

    totalCountByContent(req, res) {
        let contentTypes = [];
        let conceptIds = [], questionTypes = [], status = [], tagValues=[];

        req.body.query.contentTypes.split(",").map(contentType => {
            contentTypes.push(contentType);
        });
        
        if (req.body.body.conceptIds) {
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
        let update = {'$set':{'status':'DELETED'}};
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
        let contentId = req.params.id;
        let contentType = req.query.contentType;

        switch (contentType) {
            case 'question':
                try {
                    await this.questionInstance.publishQuestion(contentId);
                    this.loggerInstance.info(`publishQuestion Done`);
                    return res.json(new ResponseController(200, "publishQuestion Done ", {}));
                } catch(err) {
                    this.loggerInstance.error(`publishQuestion Error ${err}`);
                    return res.json(new ResponseController(500, "publishQuestion Error ", err.message));
                }
                break;
            case 'studymaterial':
                this.studyMaterialInstance.publishMaterial(contentId)
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
                this.testInstance.publishTest(contentId)
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
                this.formulaInstance.publishFormula(contentId)
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
                this.videoInstance.publishVideo(contentId)
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
                this.audioInstance.publishAudio(contentId)
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