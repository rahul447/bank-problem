
var async = require('async');
var mongoose = require('mongoose');
var Question = require('./models/question.model.js');

Question.find({ $or: [ { questionType: 'SMCQ'},{questionType: 'MMCQ'} ] } ).lean().exec(function(err,questionList){
    if(err){console.log(err)}
    else{

        async.eachSeries(questionList,function(question,callback){
            var format = question.content[0].correctAnswer.data;
            var correctAnswer =[];
            var updatedCorrectAnswer = [];
            format.map((element)=>{
                correctAnswer.push(element.value);
            })
            var setCorrectAnswer =  Array.from(new Set(correctAnswer));
            setCorrectAnswer.map((element)=>{
                var AnswerObj = {'value':element};
                updatedCorrectAnswer.push(AnswerObj);
            });
            if(updatedCorrectAnswer.length==1){
                question.questionCode = 0;
            }
            else if(updatedCorrectAnswer.length > 1){
                question.questionCode = 8;
            }
            question.content[0].correctAnswer.data = updatedCorrectAnswer;
            Question.findOneAndUpdate({_id:question._id},question,function(err){
                if(err){
                    callback(err);
                }
                else{
                    callback();
                }
            });
        },function(err){
            if(!err){
            }
            else{
            }
        })
    }
})