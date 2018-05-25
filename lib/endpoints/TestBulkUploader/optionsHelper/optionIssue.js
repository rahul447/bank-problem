
var async = require('async');
var mongoose = require('mongoose');
var Question = require('../../question/question.model.js');


Question.find({'questionType':{'$in':['SMCQ','MMCQ', 'Matrix','Integer','Numerical']}}).lean().exec(function(err,questionList){
    if(err){console.log(err)}
    else{
        async.eachSeries(questionList,function(question,callback){
            var format = question.content[0].correctAnswer.data;
            if(['SMCQ', 'MMCQ'].includes(question.questionType)){
                format = format.map((element)=>{
                    element.value = element.value.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                    return element;
                });
            }
            else if(question.questionType=='Integer'){
                format = format.map((element)=>{
                    if(typeof(element.value) =='string'){
                        element.value = parseInt(element.value.replace(/<[^>]*>/g, '').replace(/\n/g, ''));
                    }
                    return element;
                });
            }
            else if(question.questionType=='Numerical'){
                format = format.map((element)=>{
                    element.value = element.value.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                    return element;
                });
            }
            else{
                format = format.map((element)=>{
                    if(Array.isArray(element.value)){
                        element.value = element.value.map((val)=>{
                            return val.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                        });
                        element.id = element.id.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                        return element;
                    }
                    else{
                        console.log(question._id);
                        console.log("question Error");
                        return element;
                    }
                });
            }
            question.content[0].correctAnswer.data = format;
            //console.log(question.content[0].correctAnswer);
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