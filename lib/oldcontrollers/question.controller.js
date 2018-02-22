/* eslint-disable */
var Question = require('../endpoints/question/question.model.js'),
    Test = require('../endpoints/test/tests.model.js'),
    async = require('async'),
    _ = require("lodash");


var analysis = [];
var mongoose=require('mongoose');

module.exports = {

    questionFind: function(task, callback){
        Question.findOne({'_id': task.questionId}, function(err, questions){
            //console.log(questions);
            if(err){
                analysis.push({
                    'status': '500',
                    'message': 'Error retrieving question',
                    'data': {}
                });
                callback(err);
            }
            else
            {
                var obj=[];
                if(questions==null)
                    {
                        analysis.push({
                            'status': '500',
                            'message': 'Error retrieving question',
                            'data': null
                        });
                        callback();     
                    }
                    else{
                async.eachSeries(questions.content,function(content,contentcallback){
                    content.correctAnswer={
                        answerType:'no data here',
                        data:['hard work ']
                    };
                
                    obj.push(content);
                    
                    contentcallback();
                },function(err){
                    if(err){
                        analysis.push({
                            'status': '500',
                            'message': 'Error retrieving question',
                            'data': {}
                        });
                    }
                    else{
                        analysis.push({
                            'status' : '200',
                            'message': 'Question retrieved',
                            'data' : {'qData':{'content':obj},'qId':task.questionId,'questionType':questions.questionType,'questionCode':questions.questionCode}
                        });
                    }
                    callback();
                }
            )
        }
                 
            
        }
        });
    },

    getQuestion: function(req, res){
        var array = [];
        console.log("array of questions",req.body.questionArray);
        for(var i = 0;i < req.body.questionArray.length;i++)
            array.push({questionId:req.body.questionArray[i]});
        async.forEach(array, module.exports.questionFind, function(err){
            if(err){
                return res.json({
                    'status': '500',
                    'message': 'Error in retrieving all questions'
                });
            }
            console.log('analysis',analysis);
            //console.log(analysis);
            res.json(analysis);
            analysis = [];
        });
    },

    questionList: function(req, res){
        Test.find({ '_id': req.query.testId})
        .populate('data.sections.subSection.questions')
        .exec(function(err, Questions){
            if(err){
                return res.json({
                    'status': '500',
                    'message': 'Error retrieving questions'
                });
            }
            else{
                return res.json({
                    'status': '200',
                    'message': 'Questions retrieved',
                    'data': Questions
                });
            }
        });
    },
    saveQuestion: function(req,res){
        var question = new Question(req.body);
        question.save(function(err){
            if(!err){
                return res.json({
                    'status':"200",
                    'message':"no error",
                    "qId":question._id
                })
            }
            else{
                return res.json({
                    'status':"400",
                    'message':err
                })
            }
        })
    },

    submitQuesMap: function(req,res) {

        var changesQues = req.body;

        try{
            for (var key in changesQues) {
                (function(key){
                    Question.findOne({ "_id": key }, function (err, doc){
                        doc.content = changesQues[key];
                        doc.save();
                    });
                })(key);
            }
            return res.json({
                'status':"200",
                'message':"All Questions Updated"
            })
        }catch(err){
            console.log("err : ", err);
            return res.json({
                'status':"400",
                'message':err
            })
        }
    }
}
