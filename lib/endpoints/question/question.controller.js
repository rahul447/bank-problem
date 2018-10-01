"use strict";
import questions from "./question.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";
import { _ } from "lodash";
import uuidv4 from "uuid/v4";
import loggerInstance from "../../util/apiLogger";

let QuestionControllerInstance,
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

class QuestionController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
    }

    questionSave(req, res) {

        req.body.content ? req.body.content = req.body.content.map((c) => {
            c.correctAnswer && c.correctAnswer.data && c.correctAnswer.data.map(a => {
                a.value && typeof a.value === 'string' ? a.value = a.value.replace(/<p>/g, '')
                    .replace(/<\/p>/g, '').replace(/  +/g, ''): '';
                return a;
            });
            return c;
        }) : '';
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
                    return res.json(new ResponseController(200, "Question saved successfully", question));
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
            if (oldObj.constructor.name === 'model') {
                oldObj = oldObj.toObject()
            }
            let cloneObj = _.pick(oldObj, ['_id']);
            let tailoredObj = Object.assign({}, oldObj, bodyObj);
            tailoredObj = _.omit(tailoredObj, "_id");
            tailoredObj.publishId = cloneObj._id;
            tailoredObj.status = "DRAFT";

            tailoredObj.content && tailoredObj.content.map((c) => {
                c.correctAnswer && c.correctAnswer.data && c.correctAnswer.data.map(a => {
                    a.value && typeof a.value === 'string' ? a.value = a.value.replace(/<p>/g, '')
                        .replace(/<\/p>/g, '').replace(/  +/g, ''): '';
                    return a;
                });
                return c;
            });

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
                if (oldObj.constructor.name === 'model') {
                    oldObj = oldObj.toObject()
                }
                let cloneObj = _.pick(oldObj, ['_id']);
                let tailoredObj = Object.assign({}, oldObj.draftId, bodyObj);
                tailoredObj = _.omit(tailoredObj, ["_id", "draftId"]);
                tailoredObj.publishId = cloneObj._id;
                tailoredObj.status = "DRAFT";

                tailoredObj.content && tailoredObj.content.map((c) => {
                    c.correctAnswer && c.correctAnswer.data && c.correctAnswer.data.map(a => {
                        a.value = a.value.replace(/<p>/g, '').replace(/<\/p>/g, '').replace(/  +/g, '');
                        return a;
                    });
                    return c;
                });

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
        req.body.content ? req.body.content = req.body.content.map((c) => {
            c.correctAnswer && c.correctAnswer.data && c.correctAnswer.data.map(a => {
                a.value && typeof a.value === 'string' ? a.value = a.value.replace(/<p>/g, '')
                    .replace(/<\/p>/g, '').replace(/  +/g, ''): '';
                return a;
            });
            return c;
        }) : '';

        let question = new this.questionModelInstance(req.body);
        ((that) => {
            const query = req.body.dbQuery;
            if (!query.$and) {
                query.$and = [];
            }
            query.$and.push({
                _id: question._id
            });
            that.questionModelInstance.findOne(query)
            .populate('draftId')
            .lean()
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
                            that.loggerInstance.error(`Question Clone Updation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        resolve(req.body);
                        //resolve(that.questionUpdations(newObj, question))
                    }
                });
            })
            .then(function(newObj){
                that.questionModelInstance.findOneAndUpdate({ _id: question._id }, newObj, { new: true,
                    populate: 'draftId' })
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
        newObj.questionCode = question.questionCode;
        newObj.questionType = question.questionType;
        newObj.tags = question.tags;
        newObj.difficultyLevel = question.difficultyLevel;
        newObj.subjects = question.subjects;
        newObj.difficultyType = question.difficultyType;

        newObj.questionCode = question.questionCode;
        newObj.questionType = question.questionType;
        newObj.tags = question.tags;
        newObj.difficultyLevel = question.difficultyLevel;
        newObj.subjects = question.subjects;
        newObj.difficultyType = question.difficultyType;


        return newObj;
    }

    getQuestion(req, res){
        if (req.query.draftId) {
            this.getQuestionById(req.query.draftId, req, res);
        } else if (req.params.id){
            this.getQuestionById(req.params.id, req, res);
        } else {
            let query = {};
            let limit = req.query.limit ? Number(req.query.limit) : 30;
            let skip = req.query.page ? limit * Number(req.query.page) : 0;
            const dbQuery = req.body.dbQuery;
            dbQuery.$and.push(query);
            this.questionModelInstance.find(dbQuery)
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

    getQuestionById(id, req, res) {
        this.questionModelInstance.findById(id)
            .populate('subjects.subjectId', 'name')
            .populate('subjects.chapters.chapterId', 'name')
            .populate('subjects.chapters.concepts.conceptId', 'name')
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
        let id = req.query.draftId ? req.query.draftId : req.params.id;
        ((that) => {
            that.questionModelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
                .populate('draftId')
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
                            newObj.tags = [...new Set(newObj.tags ? newObj.tags.concat(req.body.tags) :
                                req.body.tags)];
                            resolve(newObj);
                        }
                    });
                })
                .then(function(newObj) {
                    let conditions = { _id: mongoose.Types.ObjectId(id) };
                    that.questionModelInstance.findOneAndUpdate(conditions,newObj,{new:true,
                        populate: 'draftId'})
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

    publishQuestion(questionId, aclMetaData, publish = true) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.questionModelInstance.
                findOne({ _id: questionId }).
                populate('draftId').
                lean().
                exec(async function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting question ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            let invalid = await that.validateDoc(doc.draftId);
                            if(invalid.length !== 0) {
                                reject(new Error(JSON.stringify({invalid, contentId: doc.contentId})));
                            } else if(publish) {
                               that.deleteQuestion(doc.draftId._id)
                                .then(() => {
                                    that.removeBeforePublish(doc.draftId, ["publishId", "draftId",
                                        "status", "contentId", "oldContentId", "docCounter", "__v",
                                        "_id"]);
                                    let draftDoc = Object.assign({}, doc.draftId);
                                    that.loggerInstance.info("Draft Question Deleted");
                                    doc = Object.assign({}, doc, draftDoc);
                                    doc.draftId = undefined;
                                    doc.fromDraft = true;
                                    const {updatedBy} = aclMetaData;
                                    doc.aclMetaData.updatedBy = updatedBy;

                                    that.questionModelInstance.findOneAndUpdate({_id: doc._id}, doc,
                                        {upsert: true, new: true},
                                        function (err) {
                                            if(err) {
                                                that.loggerInstance.error(`Question Save Failed ${err}`);
                                                reject(err);
                                            }
                                            resolve();
                                        });
                                });
                            } else
                                resolve();
                        } else {
                            let invalid = await that.validateDoc(doc);
                            if(invalid.length !== 0) {
                                reject(new Error(JSON.stringify({invalid, contentId: doc.contentId})));
                            } else if(publish) {
                                doc.status = "PUBLISHED";
                                const {updatedBy} = aclMetaData;
                                doc.aclMetaData.updatedBy = updatedBy;
                                that.questionModelInstance.findOneAndUpdate({_id: doc._id}, doc,
                                    {upsert: true},
                                    function (err) {
                                        if(err) {
                                            that.loggerInstance.error(`Question Save Failed ${err}`);
                                            reject(err);
                                        }
                                        resolve();
                                    });

                            } else
                                resolve();
                        }
                    }
                });
            })(this);
        });
    }

    removeBeforePublish(doc, propToBeDeleted) {
        propToBeDeleted.map(prop => {
            Reflect.deleteProperty(doc, prop);
        });
    }

    deleteQuestion(questionId) {
        return new Promise((resolve, reject) => {
            try{
                this.questionModelInstance.find({ _id: questionId }).remove()
                    .exec();
                resolve();
            } catch(err) {
                this.loggerInstance.error(`DB error removing question ${err}`);
                reject(err);
            }
        });
    }
    
    async questionLinkedCreate(req, res){
        let questionCodeArray = ['SMCQ','Matrix','True-False','Blanks','Descriptive','Passage','Numerical','Integer','MMCQ'];
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
        let maxContentId = await new this.questionModelInstance().getMaxContentId();

        questionTypeArray.map((qType, i)=>{
            let question = new this.questionModelInstance();

            if(question.publishId) {
                question.contentId = `${question.contentId}-DRAFT`;
            } else {
                question.contentId = !maxContentId ? 'Q-1': `Q-${maxContentId + 1}`;
                question.docCounter = !maxContentId ? 1 : maxContentId + 1;
            }

            question.passageInfo.totalQuestion = totalQuestion;
            question.passageInfo.thisQuestionNumber = i+1;
            question.passageId = passageId;
            question.questionType = qType;
            question.questionCode = questionCodeArray.indexOf(qType);
            question.aclMetaData = req.body.aclMetaData;
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
            if(qType == 'True-False'){
                contentObj.optionsContent= [ 
                    {
                        "serialNo" : 1,
                        "value" : "True",
                        "id" : "1"
                    }, 
                    {
                        "serialNo" : 2,
                        "value" : "False",
                        "id" : "2"
                    }
                ];
            }
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

    passageQuestionById(passageId){
        let responseObject = {
            content:[],
            passageId: passageId,
            questionArray: []
        };
        return new Promise((resolve,reject)=>{
            ((that) => {
                this.questionModelInstance.find({'passageId':passageId}).lean()
                    .then(function (questionArray) {
                        if(questionArray.length !== 0){
                            responseObject.questionArray = questionArray;
                            /**
                             * create contentArray
                             */
                             let question = questionArray[0];
                            question.content.map((contnt)=>{
                                let contentObj = {locale:'',passageContent: ''};
                                contentObj.locale = contnt.locale;
                                contentObj.passageContent = contnt.passageQuestion;
                                responseObject.content.push(contentObj);
                            });
                            that.loggerInstance.info("Linked Questions");
                            resolve(responseObject);
                            
                        }
                        else{
                            that.loggerInstance.info("No Linked Question Found");
                            reject("No Linked Question Found");
                            
                        }
                    })
                    .catch(function (err) {
                        that.loggerInstance.info("Error Getting Linked Questions");
                        reject(err);
                        
                    });
            })(this)
        })
    }
    
    questionGetById(req, res) {
        this.passageQuestionById(req.params.passageId)
            .then((responseObject) => {
                return res.json(new ResponseController(200, "Linked Questions", responseObject));
            }).catch((reason) => {
                return res.json(new ResponseController(500, "No Linked Question Found", reason));
            })
    }
    
    questionLinkedEdit(req, res){
        let locale = req.body.locale;
        let passageId = req.body.passageId;
        let deleteArray = req.body.deleteArray;
        let passageContent = req.body.passageContent;
        let questionTypeArray = req.body.questionTypeArray;
        let previousContent = [];
        /**
         * Deleting the questions
         */
        let deletePromise = new Promise((resolve, reject) => {
            if (deleteArray.length > 0) {
                let query = { _id: { '$in': deleteArray } };
                let update = { '$set': { 'status': 'DELETED' } };
                let options = { multi: true, runValidators: true , populate: "draftId"};
                ((that) => {
                    that.questionModelInstance.update(query, update, options)
                        .then(function () {
                            that.loggerInstance.info("Question deleted successfully");
                            resolve();
                        })
                        .catch(function (err) {
                            that.loggerInstance.error("DB Error deleting question", err);
                            reject(err);
                        })
                })(this)
            }
            else {
                resolve();
            }
        });
        
        deletePromise.then(()=>{
            this.passageQuestionById(passageId)
            .then((responseObject)=>{
                let previousQuestionArray = responseObject.questionArray;
                let notDeletedPreviousQuestions = previousQuestionArray.filter(prQuestion=>prQuestion.status!=='DELETED');
                let numberQuestion = notDeletedPreviousQuestions.length + questionTypeArray.length;
                let questionArray = [];
                let promiseArray = [];
                let resObject = {
                    content:responseObject.content,
                    passageId: passageId,
                    questionArray:[]
                };
                /**
                 * check for new locale and updating content array for previous questions
                 */
                previousQuestionArray.map((previousQuestion)=>{
                    let languageFlag = 0;
                    let j;    
                    for (j = 0; j < previousQuestion.content.length; j++) {
                        if (previousQuestion.content[j].locale === locale) {
                            languageFlag = 1;
                            break;
                        }
    
                    }
                    /**
                     * New locale found
                     */
                    if (languageFlag === 0) {
                        let contentObj = {
                            passageQuestion: passageContent,
                            locale: locale,
                            questionContent: "",
                            optionsContent: [],
                            matrixOptionContent: { optionLeft: [], optionRight: [] },
                            solutionContent: "",
                            questionHints: "",
                            correctAnswer: {
                                answerType: "",
                                data: []
                            }
                        };
                        let passageContentObj = {locale:locale,passageContent:passageContent};
                        resObject.content.push(passageContentObj);
                        previousQuestion.content.push(contentObj);
                    }
                    else {
                        previousQuestion.content[j].passageQuestion = passageContent;
                    }
                    return previousQuestion;
                });
                /**
                 * Updating previous question with serial number and total number of question
                 */
                notDeletedPreviousQuestions.map((previousQuestion,i)=>{
                    previousQuestion.passageInfo.totalQuestion = numberQuestion;
                    previousQuestion.passageInfo.thisQuestionNumber = i + 1;
                    return previousQuestion;
                });
                /**
                 * create contentarray from updated questionarray and the assign it to new questions
                 */
                notDeletedPreviousQuestions[0].content.map((cntnt)=>{
                    let contentObj = {
                        passageQuestion: cntnt.passageQuestion,
                        locale: cntnt.locale,
                        questionContent: "",
                        optionsContent: [],
                        matrixOptionContent: { optionLeft: [], optionRight: [] },
                        solutionContent: "",
                        questionHints: "",
                        correctAnswer: {
                            answerType: "",
                            data: []
                        }
                    };
                    previousContent.push(contentObj);
                });
                /**
                 * Creating new questions
                 */
                questionTypeArray.map((qType, i) => {
                    let question = new this.questionModelInstance();
                    question.passageInfo.totalQuestion = numberQuestion;
                    question.passageInfo.thisQuestionNumber = notDeletedPreviousQuestions.length + i + 1;
                    question.questionType = qType;
                    question.content = previousContent;
                    question.passageId = passageId;
                    promiseArray.push(new Promise((resolve, reject) => {
                        ((that) => {
                            question.save()
                                .then(function (question) {
                                    that.loggerInstance.info("Question saved successfully");
                                    questionArray.push(question);
                                    resolve();
                                })
                                .catch(function (err) {
                                    that.loggerInstance.error("DB Error saving question", err);
                                    reject(err);
                                })
                        })(this)
                    }));
                });
                /**
                 * Updating old questions 
                 */
                previousQuestionArray.map((prQuestion)=>{
                    promiseArray.push(new Promise((resolve, reject) => {
                        ((that) => {
                            that.questionModelInstance.findOneAndUpdate({_id:prQuestion._id},prQuestion,{new:true})
                                .then(function (question) {
                                    that.loggerInstance.info("Question updated successfully");
                                    questionArray.push(question);
                                    resolve();
                                })
                                .catch(function (err) {
                                    that.loggerInstance.error("DB Error updating question", err);
                                    reject(err);
                                })
                        })(this)
                    }));
                });
                
                Promise.all(promiseArray)
                    .then(() => {
                        resObject.questionArray = questionArray;
                        this.loggerInstance.info("Linked Questions Edited");
                        return res.json(new ResponseController(200, "Linked Questions Edited", resObject));
                    })
                    .catch((err) => {
                        this.loggerInstance.info("Edited Linked Questions Error in promise all");
                        return res.json(new ResponseController(500, " Edited Linked Questions Error", err));
                    });
            })
            .catch((err)=>{
                this.loggerInstance.info("Edited Linked Questions Error");
                return res.json(new ResponseController(500, " Edited Linked Questions Error", err));
            });  
        })
    }
    async getQuestionText(req, res){
        try {
            const resp = await this.questionModelInstance.findById(req.params.id).select('content');
            let text = {
                _id : resp._id,
                questionText: resp.content[0].questionContent
            }
            return res.json(new ResponseController(200, "Question text retrieved successfully", text));
        } catch (error) {
            this.loggerInstance.error(error);
            return res.json(new ResponseController(500, "Error getting question text"));
        }
    }


    updateQuestionConcept(req, res) {

        const id = req.query.draftId ? req.query.draftId : req.params.id;

        this.questionModelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
        .populate('draftId')
        .then(newObj => {
            return new Promise(async (resolve, reject) => {
                if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                    let cloneQuestion = await this.createQuestionClone(newObj, req.body);
                    newObj.draftId = cloneQuestion._id;
                    resolve(newObj);
                } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                    this.updateQuestionClone(newObj, req.body)
                    .then(() => {
                        resolve(newObj);
                    })
                    .catch(err => {
                        this.loggerInstance.error(`Question Clone Updation Error ${err}`);
                        reject(err);
                    });
                } else {
                    newObj.subjects = req.body.subjects;
                    newObj.conceptId = [];
                    newObj.conceptCode = [];
                    newObj.subjects.map(s => s.chapters && s.chapters.map(ch => {
                        ch.concepts && ch.concepts.map(cc => {
                            cc.conceptId && newObj.conceptId.push(cc.conceptId);
                            cc.conceptCode && newObj.conceptCode.push(cc.conceptCode);
                        });
                    }));
                    resolve(newObj);
                }
            });
        })
        .then(newObj => {
            let conditions = { _id: mongoose.Types.ObjectId(id) };
            this.questionModelInstance.findOneAndUpdate(conditions, newObj, { new: true,
                populate: 'draftId'})
            .then(questionObj => {
                this.loggerInstance.info(`Success question Concept update`);
                return res.json(new ResponseController(200, "question updated", questionObj));
            })
            .catch(err => {
                this.loggerInstance.error(`DB Error`);
                return res.json(new ResponseController(200, "question updated",err));
            });
        });
    }

    validateDoc(question) {

            let status = {'tolerance': true, 'conceptId': true, 'questionContent': true, 'solutionContent': true, 'correctAnswer': true, 'optionsContent': true, 'matrixOptionContent': true, 'difficultyLevel': true, 'difficultyType': true, 'concepts': true};

            const schemaFields = Array.from(Object.keys(question)
                .reduce((acc, curr) => {
                    acc.add(curr.split(".")[0]);
                    return acc;
                }, new Set()));
            
            let quesType = question.questionType;

            return new Promise((resolve) => {
                let invalid = [];
                for (let key in question) {
                    (schemaFields.includes(key)) && question.status !== 'PUBLISHED' && validate(key);
                }
                
                for (const k in status) {
                    if (!status[k]) {
                        invalid.push(k);
                    }
                }
                resolve(invalid);
            });

            function validate(key) {
            
                if (key === 'conceptId' && (!question[key] || question[key].length === 0)) {
                    status.conceptId = false;
                }

                if(key === 'subjects' && (!question["subjects"] || question["subjects"].length === 0)) {
                    status.concepts = false;
                }

                if(['difficultyLevel', 'difficultyType'].includes(key) &&
                    (!question[key] || question[key].length === 0)) {
                    status[key] = false;
                }

                if (key === 'content') {

                    question[key].map((contentVal) => {
                        if (!contentVal.questionContent || contentVal.questionContent.length === 0) {
                            status.questionContent = false;
                        }
                        if (!contentVal.solutionContent || contentVal.solutionContent.length === 0) {
                            status.solutionContent = false;
                        }

                        if (quesType !== "Descriptive" && (!contentVal.correctAnswer.data || contentVal.correctAnswer.data.length === 0)) {
                            status.correctAnswer = false;
                        }

                        switch (quesType) {
                            case 'SMCQ':
                                if (!contentVal.optionsContent || contentVal.optionsContent.length === 0 ||
                                    (contentVal.optionsContent.filter(opt => !opt.value).length < 2)) {
                                        console.log("!!!!", question.contentId)
                                    status.optionsContent = false;
                                }
                                !contentVal.correctAnswer.data || contentVal.correctAnswer.data.length !== 1 ? status.correctAnswer = false: '';
                                break;
                            case 'MMCQ':
                                if (!contentVal.optionsContent || contentVal.optionsContent.length === 0 ||
                                    (contentVal.optionsContent.filter(opt => !opt.value).length < 2)) {
                                        console.log("####", question.contentId)
                                    status.optionsContent = false;
                                }
                                !contentVal.correctAnswer.data || contentVal.correctAnswer.data.length <= 1 ? (status.correctAnswer = false): '';
                                break;
                            case 'Integer':

                                break;
                            case 'Matrix':
                                if ((!contentVal.matrixOptionContent.optionRight || contentVal.matrixOptionContent.optionRight.length < 2) || (!contentVal.matrixOptionContent.optionLeft || contentVal.matrixOptionContent.optionLeft.length < 2)) {
                                    status.matrixOptionContent = false;
                                } else if (contentVal.matrixOptionContent.optionLeft.length >
                                    contentVal.correctAnswer.data.length) {
                                    status.matrixOptionContent = false;
                                }
                                break;
                            case 'Numerical':
                                if (!contentVal.correctAnswer.data || contentVal.correctAnswer.data.length === 0 ||
                                    (!contentVal.correctAnswer.data.every(d =>
                                        d.hasOwnProperty("positiveTolerance") &&
                                        d.hasOwnProperty("negativeTolerance")))) {
                                    status.tolerance = false;
                                }
                                break;
                            case 'True-False':

                                break;
                            case 'Blanks':

                                break;
                            case 'Descriptive':

                                break;
                            default:

                        }
                    });
                }
            }
    }


}

export function getQuestionControllerInstance() {
    QuestionControllerInstance = QuestionControllerInstance || new QuestionController(loggerInstance, config);
    return QuestionControllerInstance;
}