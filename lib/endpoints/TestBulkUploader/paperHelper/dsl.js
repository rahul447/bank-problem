// var request = require('request');
// var dsApiUrl = 'http://localhost:3003';
var test = require('../../test/tests.model.js');
var Question = require('../../question/question.model.js');
var CourseItems = require('../../courseItem/courseItem.model.js');
var TestSummary = require('../../testSummary/testSummary.model');
var TestModel = require('../../test/tests.model');
var courseModel = require('../../course/course.model');
var Concepts = require('../../concept/concept.model.js');
var testMapping = require('../../testMapping/testMapping.model.js');
var mongoose = require('mongoose');
var async = require('async');


exports.saveFunc=function(obj,callback){
    //console.dir(obj,{depth:null});
    // request({
    //     url: dsApiUrl+'/saveQuestion',
    //     method: 'POST',
    //     json: obj
    //   },
    //    function(error,response,body){
    //        if(response.body.status!=200){
    //         console.log("i m in err",response.body.message); 
    //         callback(response.body.message);
    //        }
    //        else{
    //         console.log("i m in sucess",response.body.qId);
    //         callback(null,response.body.qId);
    //        }
    //   });
    //callback(null);
    var question = new Question(obj);
    if(question.conceptId.length==0){
        callback('conceptId empty');
    }else{
        console.log(question.conceptId,question.conceptId.length);
        question.save(function(err){
            if(!err){
                callback(null,question._id);
            }
            else{
                callback(err);
            }
        })
    }
}
exports.saveTestFunc=function(obj,callback){
    // request({
    //     url: dsApiUrl+'/saveTest',
    //     method: 'POST',
    //     json: obj
    //   },
    //    function(error,response,body){
    //        if(response.body.status!=200){
    //         console.log("i m in err",response.body.message); 
    //         callback(response.body.message);
    //        }
    //        else{
    //         console.log("test dsl");
    //         callback(null);
    //        }
    //   });
    //callback(null);
    var Test = new test(obj);
    console.log("Test Created with ID",Test._id);
    TestModel.findOneAndUpdate({_id:Test._id},Test,{upsert:true},function(err,data){
        if(!err){
            callback(null);
        }
        else{
            callback(err);
        }
    })
}
exports.startTestSummary=function(obj,callback){
    request({
        url: dsApiUrl+"/createTestSummary",
        method:'POST',
        json:obj
    },function(error,response,body){
        if(response.body.status!=200){
            console.log("i m in err",response.body.message); 
            callback(response.body.message);
           }
           else{
            console.log("Test Summary Initiated");
            callback(null);
           }
    })
}

exports.getNewTestObj=function(testCode,callback){
    // var empty={key:testCode};
    // request({
    //     url: dsApiUrl+"/createTestObj",
    //     method:'POST',
    //     json:empty //for test id defined in doc file
    // },function(error,response,body){
    //     if(response.body.status!=200){
    //         console.log("i m in err",response.body.message); 
    //         callback(response.body.message,null);
    //        }
    //        else{
    //         callback(null,response.body.data);
    //        }
    // })
    testCode = testCode.map((tcode)=>{return tcode.trim();});
    test.find({'migrationObject.columnIdValue':{'$in':testCode},'data.sections':{'$exists':false}}).lean().exec(function(err,tArray){
        if(err){
            callback(err);
        }
        else if(tArray.length==0){
            test.find({'migrationObject.columnIdValue':{'$in':testCode},'data.sections':{'$exists':true}}).lean().exec(function(err,checkTest){
                if(checkTest.length==0 && testCode.length==1 && (testCode[1]==''||testCode[1]==undefined||testCode[1].toUpperCase()=="NEW"||testCode[0].toUpperCase()=="SQL ID NOT AVAILABLE") ){
                    var testArray = [];
                    var newTest =new test();
                    testArray.push(newTest);
                    callback(null,"NEW_TEST_CREATED",testArray);
                }
                else if(checkTest.length==0){
                    callback(null,"SQL_ID_NOT_FOUND",tArray);
                }
                else{
                    callback(null,"TEST_ALREADY_CREATED",tArray);
                }
            })
        }
        else{
            console.log(tArray.length);
            var t = tArray[0];
            tArray.splice(0, 1);
            console.log(tArray.length);
            if(tArray.length==0){
                var singleTest=[];
                singleTest.push(t);
                callback(null,null,singleTest);
            }
            else{
                var usedInCourse=[];
                var fArray = t.oldTags.usedInCourse;
                for(i=0;i<t.oldTags.usedInCourse.length;i++){
                    fArray[i]["sqlId"]=t.migrationObject.columnIdValue;
                    usedInCourse.push(fArray[i]);   
                }
                for(j=0;j<tArray.length;j++){
                    var firstArray = tArray[j].oldTags.usedInCourse;
                    for(i=0;i<tArray[j].oldTags.usedInCourse.length;i++){
                        
                            firstArray[i]["sqlId"]=tArray[j].migrationObject.columnIdValue;
                            usedInCourse.push(firstArray[i]);
                        
                    }
                }
                async.eachSeries(tArray,function(testObj,testCallback){
                    // CourseItems.find({'$or': [{ 'details.schedule.paperDetail.id': testObj._id, 'itemType': 'scheduledTests' },
                    //             { 'details.tests.paperDetail.id': testObj._id, 'itemType': 'testGroup' },
                    //             { 'details.sampletests.paperDetail.id': testObj._id, 'itemType': 'sampleTests' }]
                    // }).lean().exec(function(err,courses){
                        console.log('courses',testObj._id);
                        //if(courses.length==0){
                            test.findOneAndUpdate({_id:t._id}, {'$set':{ oldTags:{usedInCourse:usedInCourse}}},{upsert:true},function(err,rTest){
                                if(err){
                                    testCallback(err);
                                }
                                else{
                                    test.findOneAndRemove({_id:testObj._id},function(err){
                                        if(err){
                                            testCallback(err);
                                        }
                                        else{
                                            testMapping.findOneAndUpdate({updatedTestId:t._id},{ $push: { removedTestIds: testObj._id } },{upsert:true},function(err){
                                                console.log("test mapping added to db");
                                                testCallback(null); 
                                            });                                   
                                        }
                                    })
                                }
                            //})
                            
                        //}
                        // else{
                        //     async.eachSeries(courses,function(cour,courseCallback){
                        //         var courseString = JSON.stringify(cour);
                        //         console.log(courseString.search(testObj._id));
                        //         courseString = courseString.replace(new RegExp(testObj._id, 'g'),t._id);
                        //         console.log(t._id);
                        //         console.log(courseString.search(testObj._id));
                        //         cour = JSON.parse(courseString);
                        //         cour.userId=null;
                        //         CourseItems.findOneAndUpdate({_id:cour._id},cour,function(err){
                        //             if(err){
                        //                 courseCallback(err);
                        //             }
                        //             else{
                        //                 // var secondArray = testObj.oldTags.usedInCourse;
                        //                 // for(i=0;i<secondArray.length;i++){
                        //                 //     secondArray[i]["sqlId"]=testObj.migrationObject.columnIdValue;
                        //                 //     usedInCourse.push(secondArray[i]);
                        //                 // }
                        //                 //console.log(usedInCourse);
                        //                 // usedInCourse = firstArray.concat(secondArray);
                        //                 // console.log(usedInCourse);
                        //                 // var oldTags={usedInCourse:usedInCourse};
                        //                 // console.log(oldTags);
                        //                 test.findOneAndUpdate({_id:t._id}, {'$set':{ oldTags:{usedInCourse:usedInCourse}}},{upsert:true},function(err,rTest){
                        //                     if(err){
                        //                         courseCallback(err);
                        //                     }
                        //                     else{
                        //                         test.findOneAndRemove({_id:testObj._id},function(err){
                        //                             if(err){
                        //                                 courseCallback(err);
                        //                             }
                        //                             else{
                        //                                 testMapping.findOneAndUpdate({updatedTestId:t._id},{ $push: { removedTestIds: testObj._id } },{upsert:true},function(err){
                        //                                     console.log("test mapping added to db");
                        //                                     courseCallback(null); 
                        //                                 });                                   
                        //                             }
                        //                         })
                        //                     }
                        //                 })
                        //             }
                        //         })
                        //     },function(err){
                        //         if(err){
                        //             testCallback(err)
                        //         }
                        //         else{
                        //             testCallback(null);
                        //         }
                        //     })
                        // }
                    });
                },function(err){
                    if(err){
                        callback(err,null,null);
                    }
                    else{
                        test.find({_id:t._id}).lean().exec(function(err,testData){
                            if(err){
                                callback(err,null,null);
                            }
                            else{
                                callback(null,null,testData);
                            }
                        })
                    }
                });
            }
        }
    })
}
exports.getConceptObj=function(cArray,iArray,callback){
    //var obj={codeArray:cArray,idArray:iArray};
    // request({
    //     url: dsApiUrl+"/getConceptObj",
    //     method:'POST',
    //     json:obj //for test id defined in doc file
    // },function(error,response,body){
    //     if(response.body.code!=200){
    //         console.log("i m in err",response.body.message); 
    //         callback(response.body.message,null);
    //        }
    //        else{
    //         //console.log(response.body.data);
    //         callback(null,response.body.data);
    //        }
    // })
    //cArray=JSON.stringify(cArray);
    //iArray=JSON.stringify(iArray);
    Concepts.aggregate([{'$match':{'$or':[ {'conceptCode': { '$in': cArray } },
    { 'migrationObject.columnIdValueID': { '$in': iArray } } ]}},
 { '$project': {'conceptCode':1,'conceptId': '$migrationObject.columnIdValueID' } }]).exec(function(err,concepts){
        if(err){
            callback(err);
          }
          else{ 
            callback(null,concepts);
          }
    });
}
// exports.getConceptIdObj=function(idArray,callback){
//     var obj={idArray:idArray};
//     request({
//         url: dsApiUrl+"/getConceptIdObj",
//         method:'POST',
//         json:obj //for test id defined in doc file
//     },function(error,response,body){
//         if(response.body.code!=200){
//             console.log("i m in err",response.body.message); 
//             callback(response.body.message,null);
//            }
//            else{
//             //console.log(response.body.data);
//             callback(null,response.body.data);
//            }
//     })
// }

exports.getTestObj=function(uniqueId,callback){
    //testCode = testCode.map((tcode)=>{return tcode.trim();});
    test.find({'uploadDetail.uniqueId':uniqueId,'data.sections':{'$exists':false}}).lean().exec(function(err,tArray){
        if(err){
            callback(err);
        }
        else if(tArray.length==0){
            test.find({'uploadDetail.uniqueId':uniqueId,'data.sections':{'$exists':true}}).lean().exec(function(err,checkTest){
                if(checkTest.length==0){
                    var t = new test()
                    var singleTest=[];
                    singleTest.push(t);
                    callback(null,null,singleTest);
                }
                else{
                    callback(null,"TEST_ALREADY_CREATED",tArray);
                }
            })
        }
        else{
            console.log(tArray.length);
            var t = tArray[0];
            tArray.splice(0, 1);
            console.log(tArray.length);
            if(tArray.length==0){
                var singleTest=[];
                singleTest.push(t);
                callback(null,null,singleTest);
            }
            else{
                console.log("something went wrong");
            }
            // else{
            //     var usedInCourse=[];
            //     var fArray = t.oldTags.usedInCourse;
            //     for(i=0;i<t.oldTags.usedInCourse.length;i++){
            //         fArray[i]["sqlId"]=t.migrationObject.columnIdValue;
            //         usedInCourse.push(fArray[i]);   
            //     }
            //     for(j=0;j<tArray.length;j++){
            //         var firstArray = tArray[j].oldTags.usedInCourse;
            //         for(i=0;i<tArray[j].oldTags.usedInCourse.length;i++){
                        
            //                 firstArray[i]["sqlId"]=tArray[j].migrationObject.columnIdValue;
            //                 usedInCourse.push(firstArray[i]);
                        
            //         }
            //     }
            //     async.eachSeries(tArray,function(testObj,testCallback){
            //         CourseItems.find({'$or': [{ 'details.schedule.paperDetail.id': testObj._id, 'itemType': 'scheduledTests' },
            //                     { 'details.tests.paperDetail.id': testObj._id, 'itemType': 'testGroup' },
            //                     { 'details.sampletests.paperDetail.id': testObj._id, 'itemType': 'sampleTests' }]
            //         }).lean().exec(function(err,courses){
            //             console.log('courses',testObj._id,courses.length);
            //             if(courses.length==0){
            //                 test.findOneAndUpdate({_id:t._id}, {'$set':{ oldTags:{usedInCourse:usedInCourse}}},{upsert:true},function(err,rTest){
            //                     if(err){
            //                         courseCallback(err);
            //                     }
            //                     else{
            //                         test.findOneAndRemove({_id:testObj._id},function(err){
            //                             if(err){
            //                                 courseCallback(err);
            //                             }
            //                             else{
            //                                 testMapping.findOneAndUpdate({updatedTestId:t._id},{ $push: { removedTestIds: testObj._id } },{upsert:true},function(err){
            //                                     console.log("test mapping added to db");
            //                                     testCallback(null); 
            //                                 });                                   
            //                             }
            //                         })
            //                     }
            //                 })
                            
            //             }
            //             else{
            //                 async.eachSeries(courses,function(cour,courseCallback){
            //                     var courseString = JSON.stringify(cour);
            //                     console.log(courseString.search(testObj._id));
            //                     courseString = courseString.replace(new RegExp(testObj._id, 'g'),t._id);
            //                     console.log(t._id);
            //                     console.log(courseString.search(testObj._id));
            //                     cour = JSON.parse(courseString);
            //                     cour.userId=null;
            //                     CourseItems.findOneAndUpdate({_id:cour._id},cour,function(err){
            //                         if(err){
            //                             courseCallback(err);
            //                         }
            //                         else{
            //                             // var secondArray = testObj.oldTags.usedInCourse;
            //                             // for(i=0;i<secondArray.length;i++){
            //                             //     secondArray[i]["sqlId"]=testObj.migrationObject.columnIdValue;
            //                             //     usedInCourse.push(secondArray[i]);
            //                             // }
            //                             //console.log(usedInCourse);
            //                             // usedInCourse = firstArray.concat(secondArray);
            //                             // console.log(usedInCourse);
            //                             // var oldTags={usedInCourse:usedInCourse};
            //                             // console.log(oldTags);
            //                             test.findOneAndUpdate({_id:t._id}, {'$set':{ oldTags:{usedInCourse:usedInCourse}}},{upsert:true},function(err,rTest){
            //                                 if(err){
            //                                     courseCallback(err);
            //                                 }
            //                                 else{
            //                                     test.findOneAndRemove({_id:testObj._id},function(err){
            //                                         if(err){
            //                                             courseCallback(err);
            //                                         }
            //                                         else{
            //                                             testMapping.findOneAndUpdate({updatedTestId:t._id},{ $push: { removedTestIds: testObj._id } },{upsert:true},function(err){
            //                                                 console.log("test mapping added to db");
            //                                                 courseCallback(null); 
            //                                             });                                   
            //                                         }
            //                                     })
            //                                 }
            //                             })
            //                         }
            //                     })
            //                 },function(err){
            //                     if(err){
            //                         testCallback(err)
            //                     }
            //                     else{
            //                         testCallback(null);
            //                     }
            //                 })
            //             }
            //         });
            //     },function(err){
            //         if(err){
            //             callback(err,null,null);
            //         }
            //         else{
            //             test.find({_id:t._id}).lean().exec(function(err,testData){
            //                 if(err){
            //                     callback(err,null,null);
            //                 }
            //                 else{
            //                     callback(null,null,testData);
            //                 }
            //             })
            //         }
            //     });
            // }
        }
    })
}