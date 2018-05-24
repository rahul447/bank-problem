
var async = require('async');
var mongoose = require('mongoose');
var Question = require('./models/question.model.js');

Question.find({'questionType':'MCQ'}).lean().exec(function(err,questionList){
    if(err){console.log(err)}
    else{

        async.eachSeries(questionList,function(question,callback){
            console.log(question._id);
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
            console.log(setCorrectAnswer);
            if(updatedCorrectAnswer.length==1){
                question.questionCode = 0;
            }
            else if(updatedCorrectAnswer.length > 1){
                question.questionCode = 8;
            }
            question.content[0].correctAnswer.data = updatedCorrectAnswer;
            console.log(question.content[0].correctAnswer);
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
                console.log("congrats");
            }
            else{
                console.log("err",err);
            }
        })
    }
})