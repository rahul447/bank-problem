"use strict";
import questions from "./question.model";

export class QuestionController {

    constructor(loggerInstance, config) {
        console.log(" ------in QuestionController--------- ");
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.questionModelInstance = questions;
    }

    questionSave(req, res){
        console.log(" in questionList 2");
        let question = new this.questionModelInstance(req.body);
        question.save(function(err){
            if(err){
                console.log(err);
                return res.json({
                    'status': '500',
                    'message': 'Error saving question'
                });
            }
            else{
                return res.json({
                    'status': '200',
                    'message': 'Question saved successfully',
                    'data': question._id
                });
            }
        })
    }
    questionEdit(req, res){
        let question = new this.questionModelInstance(req.body);
        this.questionModelInstance.findOneAndUpdate({_id:question._id},req.body.question,{new: true},function(err,newObj){
            if(err){
                console.log(err);
                return res.json({
                    'status': '500',
                    'message': 'Error saving question'
                });
            }
            else{
                return res.json({
                    'status': '200',
                    'message': 'Question updated successfully',
                   // 'data': newObj
                });
            }
        });
    }
}