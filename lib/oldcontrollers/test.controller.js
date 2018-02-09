/* eslint-disable */
var test = require('../endpoints/test/tests.model.js');
var rules = require('../endpoints/rule/rule.model.js');
var question = require('../endpoints/question/question.model.js');
var _ = require('lodash');
var TestSummary = require('../endpoints/testSummary/testSummary.model');
var TestModel = require('../endpoints/test/tests.model');
var courseModel = require('../endpoints/course/course.model');
var mongoose = require('mongoose');
var async = require('async');
module.exports = {
    /*
    Get testpaper
    */
    testpaper: function (req, res) {
        var testId=mongoose.Types.ObjectId(req.query.testId);
        console.log('sending test');
        
        test.findOne({ '_id': testId }).populate('data.sections.subSection.questions.qId').exec(function (err, test) {
                //console.log(test.data.sections[0].subSection);
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in retrieving test'
                    });
                }
                else {
                    if(test==null){
                        return res.json({
                            'status': '500',
                            'message': ' test not found'
                        }); 
                    
                    }
                    // var temp = test.data.sections;
                    // var newtemp = temp.map(elem => ({
                    //     'name': elem.name,
                    //     'id': elem.sectionSerialNo,
                    //     'subSection': elem.subSection.map(elem1 => ({
                    //         'id': elem1.subSectionSerialNo,
                    //         'name': elem1.name,
                    //         'questionType': elem1.questionType,
                    //         'noOfQuestions': elem1.noOfQuestions,
                    //         'totalMarks': elem1.totalMarks,
                    //         'positiveMarks': elem1.positiveMarks,
                    //         'negativeMarks': elem1.negativeMarks
                    //     }))
                    // }));
                    // console.log(newtemp.subSection);
                    console.log(test);
                    console.log('test send');
                    // var temp1 = _.map(temp, function(obj){
                    //     return _.pick(obj, ['name', 'sectionSerialNo', 'subSection.questionType',
                    //                     'subSection.subSectionSerialNo', 'subSection.name', 
                    //                 'subSection.noOfQuestions', 'subSection.positiveMarks', 
                    //                 'subSection.negativeMarks', 'subSection.totalMarks']);
                    // });
                    // //console.log(temp1);
                    return res.json({
                        'status': '200',
                        'message': 'Test paper and rules retrieved sucessfully',
                        'data': test
                    });
                }
            });
    },


    //get subjects related to test
    SubjectList: function (req, res) {

        if (req.body.courseId == undefined) {
            var query = { testId: req.body.testId };
        }
        else {
            var query = { testId: req.body.testId, courseId: courseId };
        }
        //console.log(typeof req.body['testId']);return 
        try{
            var testId = mongoose.Types.ObjectId(req.body['testId']);
            //console.log(testId);return
            TestModel.aggregate([
                
                {$match:{_id:testId}},
                
                {$unwind:"$data.sections"},
                {$project:{"_id":"$data.sections._id","name":"$data.sections.name"}}
                
                ]).exec(function(err,data){
    
                    if(err){
                        return res.status(200).json({
                                        'code': 500,
                                        'message': "Some error occured",
                                        "error": err
                                    });
                    }else{
                        //console.log(data);return 
                        return res.status(200).json({
                                        'code':200,
                                        'message': "Success",
                                        "data":data
                                       
                                    });
                    }
    
    
    
                })
    
        }catch(err){
            return res.status(200).json({
                'code': 500,
                'message': "Some error occured",
                "error": err
            });
        }
               
    },
    //get solutions of questions related to testID
    getquestionsolution: function (req, res) {
      
        try{
            var testId = mongoose.Types.ObjectId(req.body['testId']);
            var sectionId = mongoose.Types.ObjectId(req.body['subjectId']);
            //console.log(testId);
            //console.log(sectionId);return 
                test.aggregate([
                    {$match:{_id:testId}},
                    {$unwind:"$data.sections"},
                    {$match:{"data.sections._id":sectionId}},
                    {$unwind:"$data.sections.subSection"},
            
                    {$unwind:"$data.sections.subSection.questions"},
                    {$sort : { 'data.sections.subSection.subSectionSerialNo':1,'data.sections.subSection.questions.questionSerialNo':1}},
                    {
                        $lookup:
                            {
                            from: 'questions',
                            localField:'data.sections.subSection.questions.qId',
                            foreignField:'_id',
                            as:'questions'
                            }
                    },
                    {$unwind:"$questions"}
                    
                  
                ]).exec(function (err, question) {
                if (err) {
                   
                    return res.json({
                        'code': 500,
                        'message': "Error retrieving test",
                        "error": err
                    });
    
                }
                else {
               
                var questions=[];
                  // console.log(question);return 
                if(question.length>0){
                    questions=question
                    TestSummary.findOne({testId:testId}).exec(function(err1,data1){
                        if(err1){
                            return res.json({
                                'code': 500,
                                'message': "Error retrieving test",
                                "error": err
                            });
                        }else{
                            if(data1._id){
                                var i=0;
                                async.each(questions, function(item, callback) {
                                  
                                    var qId=item['questions']['_id'];
                                  
                                    var concept=[];
                                   // console.log(data1.concepts);
                                    for(var m=0;m<data1.concepts.length;m++){
                                     
                                        for(var n=0;n<data1.concepts[m]['questions'].length;n++){
                                               
                                            if(qId.toString()==data1.concepts[m]['questions'][n].toString()){
                                                
                                                concept.push(data1.concepts[m]['name'])
                                            }
                                        }
                                        
                                      
                                    }
                                // console.log(qId,concept,i);
                                 
                                    questions[i]['questions']['concept']=concept;
                                    i++;
                                   
                                    callback();
                                },function(errLift){
                                    if(errLift){
                                        return res.json({
                                            'code': 500,
                                            'message': "Error retrieving test"
                                           
                                        });
                                    }else{
                                        //console.log(questions);return 
                                        return res.json({
                                            'code': 200,
                                            'message': 'question list',
                                            'data': questions
                                        });
                                    }
    
                                })
                            }else{
                                return res.json({
                                    'code': 500,
                                    'message': "Error retrieving test"
                                   
                                });
                            }
                        }
                        
    
                    })
                    return 
                }else{
                    return res.json({
                        'code': 200,
                        'message': 'question list',
                        'data': questions
                    });
                }
               
                   console.log(question);return
                    if(question.length>0){
                        
                        questions=question;
                        return res.json({
                            'code': 200,
                            'message': 'question list',
                            'data': questions
                        });
                    }else{
                    
                        return res.json({
                            'code': 200,
                            'message': 'question list',
                            'data': questions
                        });
                    }
               
                   
                }
    
            });

        }catch(err){

            return res.status(200).json({code:500,message:"Invalid request"});
        }
       
    },
    saveTest: function(req,res){
        var Test = new test(req.body);
        // Test.save(function(err){
        //     if(!err){
        //         return res.json({
        //             'status':"200",
        //             'message':"no error"
        //         })
        //     }
        //     else{
        //         console.log(err);
        //         return res.json({
        //             'status':"400",
        //             'message':"error"
        //         })
        //     }
        // })
        TestModel.findOneAndUpdate({_id:Test._id},Test,function(err){
            if(!err){
                return res.json({
                    'status':"200",
                    'message':"no error"
                })
            }
            else{
                console.log(err);
                return res.json({
                    'status':"400",
                    'message':"error"
                })
            }
        })
    },

    createTestObj: function(req,res){
        var t = new test();
        return res.json({
            'status':"200",
            'data':t
        })
    },
    upComingTest:function(req,res){
        
        if(req.query['goalId']){
            var mongoose = require('mongoose');
            var goalId = mongoose.Types.ObjectId(req.query['goalId']);
            courseModel.aggregate([
                {$match:{_id:goalId}},
                {$project:{courseItems:1,courseTypeId:'$courseType.id'}},
                {$unwind:"$courseItems"},
                {$match:{"courseItems.itemType":'scheduledTests'}},
                {
                   $lookup:
                     {
                       from: 'courseitems',
                       localField: 'courseItems.id',
                       foreignField: '_id',
                       as: 'tests'
                     }
                },
                {$unwind:"$tests"},
                {$unwind:"$tests.details.schedule"},
                
                {$project:{courseTypeId:1,test:"$tests.details.schedule"}},
                {$match:{'test.scheduleDate':{"$gte":new Date()}}},
                {$project:{courseTypeId:1,_id:"$test.scheduleID",duration:"$test.duration",testCode:"$test.codeName",name:"$test.displayName",available_date:"$test.scheduleDate",testId:"$test.paperDetail.id",syllabus:"$test.paperDetail.syllabus"}},
                
                { $group : {
                            _id : "$courseTypeId",
                            test: { $push : "$$ROOT" }
                        }}
            
            
            
            ]).exec(function(err1,data1){
                if(err1){
                    return res.status(200).json({code:500,message:"Invalid request"})
                    
                }else{
                    //console.log("Here",data1);return  
                    var data=[];
                    if(data1.length>0){
                        data=data1[0]['test']
                    }
                    return res.status(200).json({code:200,message:"Success",data:data});
                    
                }


            })
        }else{
            return res.status(200).json({code:500,message:"Invalid request"})
        }
    }
}