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
}