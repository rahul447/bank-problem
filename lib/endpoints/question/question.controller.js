"use strict";
import questions from "./question.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";
import { _ } from "lodash";
import uuidv4 from "uuid/v4";

export class QuestionController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
    }

    questionSave(req, res) {
        req.body.conceptId = ["5a5c4e679fe7b020248e92ed"];

        let question = new this.questionModelInstance(req.body);
        if(req.body.hasOwnProperty("_id") && question.content){
            ((that)=>{
                that.questionModelInstance.findOneAndUpdate({_id:question._id},{'$push':{'content':question.content[0]}},{new: true})
                .then(function(newObj){
                    that.loggerInstance.info("Question updated successfully");
                    return res.json(new ResponseController(200, "Question updated successfully",newObj));
                })
                .catch(function(err){
                    that.loggerInstance.error("DB Error saving question");
                    return res.json(new ResponseController(500, "Error updating question",err));
                })
            })(this)
        }
        else if(question.content){
            ((that) => {
                question.save()
                .then(function(question) {
                    that.loggerInstance.info("Question saved successfully");
                    return res.json(new ResponseController(200, "Question saved successfully", question._id));
                })
                .catch(function(err) {
                    that.loggerInstance.error("DB Error saving question", err);
                    return res.json(new ResponseController(500, "Error saving question",err));
                })
            })(this)
        }
        else{
            return res.json(new ResponseController(500, "Question doesn't have content","Question doesn't have content"));
        }
    }

    createQuestionClone(oldObj, bodyObj) {
        return new Promise((resolve, reject) => {
            let cloneObj = _.pick(oldObj, ['_id']);
            let tailoredObj = Object.assign({}, oldObj.toObject(), bodyObj);
            tailoredObj = _.omit(tailoredObj, "_id");
            tailoredObj.publishId = cloneObj._id;
            tailoredObj.status = "DRAFT";

            let question = new this.questionModelInstance(tailoredObj);
            ((that) => {
                question.save()
                .then(function(question) {
                    that.loggerInstance.info(`Question Clone saved successfully ${question._id}`);
                    resolve(question);
                })
                .catch(function(err) {
                    that.loggerInstance.error(`Question Clone saved error ${err}`);
                    reject(err);
                })
            })(this);
        });
    }

    updateQuestionClone(oldObj, bodyObj) {
        return new Promise((resolve, reject) => {
            ((that) => {
                let cloneObj = _.pick(oldObj, ['_id']);
                let tailoredObj = Object.assign({}, oldObj.toObject(), bodyObj);
                tailoredObj = _.omit(tailoredObj, "_id");
                tailoredObj.publishId = cloneObj._id;
                tailoredObj.status = "DRAFT";

                that.questionModelInstance.findOneAndUpdate({_id: oldObj.draftId}, tailoredObj,
                    {new: true, upsert: true, setDefaultsOnInsert: true}, function(err) {
                        if(err) {
                            that.loggerInstance.error(`Question Clone Update error ${err}`);
                            reject(err);
                        }
                        that.loggerInstance.info(`Question Clone Update success`);
                        resolve();
                    });
            })(this);
        });
    }

    questionEdit(req, res) {
        let question = new this.questionModelInstance(req.body);
        ((that) => {
            that.questionModelInstance.findOne({ _id: question._id}).lean()
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                        that.createQuestionClone(newObj, req.body)
                        .then((cloneQues) => {
                            newObj.draftId = cloneQues._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Question Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                        that.updateQuestionClone(newObj, req.body)
                        .then(() => {
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Audio Clone Updation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        resolve(that.questionUpdations(newObj, question))
                    }
                });
            })
            .then(function(newObj){
                that.questionModelInstance.findOneAndUpdate({ _id: question._id }, newObj, { new: true })
                .then(function (newObj) {
                    that.loggerInstance.info("Question updated successfully");
                    return res.json(new ResponseController(200, "Question updated successfully", newObj));
                })
                .catch(function (err) {
                    that.loggerInstance.error(`DB Error saving question ${err}`);
                    return res.json(new ResponseController(500, "Error updating question"));
                })
            })
            .catch(function (err) {
                that.loggerInstance.error(`DB Error saving question ${err}`);
                return res.json(new ResponseController(500, "Error updating question"));
            })
        })(this)
    }

    questionUpdations(newObj, question) {
        let languageFlag = 0;
        let j;
        for (j = 0; j < newObj.content.length; j++) {
            if (question.content[0].locale === newObj.content[j].locale) {
                languageFlag = 1;
                break;
            }
        }
        if (languageFlag === 0) {
            newObj.content.push(question.content[0]);
        }
        else {
            newObj.content[j] = question.content[0];
        }
        return newObj;
    }

    getQuestion(req, res){
        if (req.query.draftId) {
            this.getQuestionById(req.query.draftId, res);
        } else if (req.params.id){
            this.getQuestionById(req.params.id, res);
        } else {
            let query = {};
            let limit = req.query.limit ? Number(req.query.limit) : 30;
            let skip = req.query.page ? limit * Number(req.query.page) : 0;
            this.questionModelInstance.find(query)
                .sort('-updatedAt')
                .skip(skip)
                .limit(limit)
                .then(questions => {
                    this.loggerInstance.info("Retrieved question list");
                    res.json(new ResponseController(200, "Question list retrieved successfully", questions));
                })
                .catch((err) => {
                    this.loggerInstance.debug("DB error listing questions");
                    res.json(new ResponseController(500, "Error listing questions", err));
                });
        }
    }

    getQuestionById(id, res) {
        this.questionModelInstance.findById(id)
            .then(question => {
                if (!question) {
                    this.loggerInstance.debug("Question not found");
                    return res.json(new ResponseController(404, "Not found question with given ID"));
                }
                this.loggerInstance.info("Retrieved question list");
                return res.json(new ResponseController(200, "question list retrieved successfully", question));
            })
            .catch(() => {
                this.loggerInstance.error("DB error getting question");
                return res.json(new ResponseController(500, "Error getting question"));
            });
    }

    distinctQuestionTypes(req, res) {
        this.questionModelInstance.distinct("questionType")
        .then(distinctTypes => {
            if (!distinctTypes) {
                this.loggerInstance.debug("Distinct Questions Types Not found");
                return res.json({
                    'status': 404,
                    'data': {}
                });
            }
            this.loggerInstance.info("Distinct Questions Types found");
            return res.json({
                'status': 200,
                'data': distinctTypes
            });
        })
        .catch((err) => {
            this.loggerInstance.error(`DB error getting question : ${err}`);
            return res.json({
                'status': 500,
                'data': err
            });
        });
    }

    getQuestionNamesById(questionIdsArr) {
        return new Promise((resolve, reject) => {

            this.questionModelInstance.aggregate([
                {
                    "$match": {
                        "_id": { $in: questionIdsArr }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: { $arrayElemAt: [ "$content", 0 ] },
                        passageId: 1,
                        questionType: 1,
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: { $substr: [ "$name.questionContent", 0, 25 ]},
                        passageId: 1,
                        questionType: 1,
                    }
                }
            ])
            .then(function (docs) {
                resolve(docs);
            }).catch(err => {
                reject(err);
            });
        });
    }

    updateQuestionTags(req, res) {
        ((that) => {
            that.questionModelInstance.findOne({ _id: mongoose.Types.ObjectId(req.params.id)})
                .then(function (newObj) {
                    return new Promise((resolve, reject) => {
                        if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                            that.createQuestionClone(newObj, req.body)
                            .then((cloneQuestion) => {
                                newObj.draftId = cloneQuestion._id;
                                resolve(newObj);
                            })
                            .catch(err => {
                                that.loggerInstance.error(`Question Clone Creation Error ${err}`);
                                reject(err);
                            });
                        } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                            that.updateQuestionClone(newObj, req.body)
                            .then(() => {
                                resolve(newObj);
                            })
                            .catch(err => {
                                that.loggerInstance.error(`Question Clone Updation Error ${err}`);
                                reject(err);
                            });
                        } else {
                            newObj.tags = req.body.tags;
                            resolve(newObj);
                        }
                    });
                })
                .then(function(newObj) {
                    let conditions = { _id: mongoose.Types.ObjectId(req.params.id) };
                    that.questionModelInstance.findOneAndUpdate(conditions,newObj,{new:true})
                    .then(function(questionObj){
                        that.loggerInstance.info(`Success Question Tag update`);
                        return res.json(new ResponseController(200, "Question updated",questionObj));
                    })
                    .catch(function(err){
                        that.loggerInstance.error(`DB Error`);
                        return res.json(new ResponseController(200, "Question updated",err));
                    });
                })
        })(this);
    }

    publishQuestion(questionId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.questionModelInstance.
                findOne({ _id: questionId }).
                populate('draftId').
                exec(function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting question ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            doc.content = doc.draftId.content;
                            that.deleteQuestion(doc.draftId._id)
                            .then(() => {
                                doc.draftId = undefined;
                                that.loggerInstance.info("Draft Question Deleted");
                                doc.save(function (err) {
                                    if(err) {
                                        that.loggerInstance.error(`Question Save Failed ${err}`);
                                        reject(err);
                                    }
                                    resolve();
                                });
                            });
                        } else {
                            doc.status = "PUBLISHED";
                            doc.save(function (err) {
                                if(err) {
                                    that.loggerInstance.error(`Question Save Failed ${err}`);
                                    reject(err);
                                }
                                resolve();
                            });
                        }
                    }
                });
            })(this);
        });
    }

    deleteQuestion(questionId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.questionModelInstance.findById(questionId, function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting question ${err}`);
                        reject(err);
                    } else {
                        doc.status = "DELETED";
                        doc.save(function (err) {
                            if(err) {
                                that.loggerInstance.error(`Question Soft Delete Failed ${err}`);
                                reject(err);
                            }
                            resolve();
                        });
                    }
                });
            })(this);
        });
    }
    questionLinkedCreate(req, res){
        let questionTypeArray = req.body.questionTypeArray;
        let passageContent = req.body.passageContent;
        let locale = req.body.locale;
        let totalQuestion = questionTypeArray.length;
        let questionArray = [];
        let promiseArray = [];
        let passageId = uuidv4();
        let responseObject = {
            passageId: passageId,
            passageContent:passageContent,
            questionArray:[]
        };
        questionTypeArray.map((qType, i)=>{
            let question = new this.questionModelInstance();
            question.passageInfo.totalQuestion = totalQuestion;
            question.passageInfo.thisQuestionNumber = i+1;
            question.questionType = qType;
            let contentObj = {
                passageQuestion:passageContent,
                locale: locale,
                questionContent: "",
                optionsContent: [],
                matrixOptionContent:{optionLeft:[],optionRight:[]},
                solutionContent: "",
                questionHints: "",
                correctAnswer: {
                    answerType: "",
                    data: []
                }
            };
            promiseArray.push(new Promise((resolve,reject)=>{
                question.content.push(contentObj);
                ((that)=>{
                    question.save()
                    .then(function(question) {
                        that.loggerInstance.info("Question saved successfully");
                        questionArray.push(question);
                        resolve();
                    })
                    .catch(function(err) {
                        that.loggerInstance.error("DB Error saving question", err);
                        reject(err);
                    })
                })(this)
            }));
        })
        Promise.all(promiseArray)
        .then(() => {
            responseObject.questionArray=questionArray;
            this.loggerInstance.info("Linked Questions Created");
            return res.json(new ResponseController(200, "Linked Questions Created", responseObject));
        })
        .catch((err)=>{
            this.loggerInstance.info("Linked Questions Creation Error");
            return res.json(new ResponseController(500, "Linked Questions Creation Error", err));
        });
        
    }

    questionGetById(req, res) {
        let passageId = req.params.passageId;
        console.log(passageId);
        let responseObject = {
            passageId: passageId,
            passageContent: '',
            questionArray: []
        };
        ((that) => {
            this.questionModelInstance.find({'passageId':passageId})
                .then(function (questionArray) {
                    if(questionArray.length !== 0){
                        responseObject.questionArray = questionArray;
                        responseObject.passageContent = questionArray[0].content[0].passageQuestion;
                        that.loggerInstance.info("Linked Questions");
                        return res.json(new ResponseController(200, "Linked Questions", responseObject));   
                    }
                    else{
                        that.loggerInstance.info("No Linked Question Found");
                        return res.json(new ResponseController(500, "No Linked Question Found", err));
                    }
                })
                .catch(function (err) {
                    that.loggerInstance.info("Error Getting Linked Questions");
                    return res.json(new ResponseController(500, "Error Getting Linked Questions", err));
                });
        })(this)
    }
}