"use strict";
import questions from "./question.model";
import {ResponseController} from "../../util/response.controller";

export class QuestionController {

    constructor(loggerInstance, config) {
        console.log(" ------in QuestionController--------- ");
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
    }

    questionSave(req, res) {
        console.log(" in questionList 2");
        let question = new this.questionModelInstance(req.body);
        ((that) => {
            question.save()
            .then(function(question) {
                that.loggerInstance.info("Question saved successfully");
                return res.json(new ResponseController(200, "Question saved successfully", question._id));
            })
            .catch(function(err) {
                that.loggerInstance.error("DB Error saving question");
                return res.json(new ResponseController(500, "Error saving question",err));
            })
        })(this)
    }

    questionEdit(req, res){
        let question = new this.questionModelInstance(req.body);
        ((that)=>{
            that.questionModelInstance.findOneAndUpdate({_id:question._id},question,{new: true})
            .then(function(newObj){
                that.loggerInstance.info("Question updated successfully");
                return res.json(new ResponseController(200, "Question updated successfully",newObj));
            })
            .catch(function(err){
                that.loggerInstance.error("DB Error saving question");
                return res.json(new ResponseController(500, "Error updating question"));
            })
        })(this)
    }

    getQuestion(req, res){
        if (req.params.id) {
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
                .catch(() => {
                    this.loggerInstance.debug("DB error listing questions");
                    res.json(new ResponseController(500, "Error listing questions"));
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
}