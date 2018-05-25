var async = require('async');
var ObjectId= require('mongoose').Types.ObjectId;
var errorReporter = require('./paperUploadErrorList');
var dsl = require("./dsl");
var _ = require('lodash');

function titleCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};

var checkImage = function (imageStr) {
    if (imageStr.search('src="OK"') != -1) {
        return 1
    }
    else if (imageStr.search('src="Wrong Type"') != -1) {
        return -1
    }
    else {
        return 0
    }
}


var validateTestObj = function (testData, testvalback) {
    errList = [];
    var ids={};
    var Concepts=[];
    async.series([function(callback){
        /**
         * uncomment for id validation
         */
        // if(testData.search("TestId:") ==-1 && testData.search("ScheduleId:") == -1){
        //     errList.push("Missing both TestId and ScheduleId");
        // }
        callback();
    },function (callback) {
        //compulsory keys
        /**
         * uncomment for id validation
         */
        var keys = ['TestName:', 'Time:', 'TestType:'];//, 'CourseId:','Language:', 'Attempts:',];
        keys.forEach(function (key) {
            if (testData.search(key) == -1) {
                errList.push(errorReporter.createErrorObj('MISSING_KEY',"Missing key in Test " + key));
            }
        });
        callback();
    },
    function (callback) {
        //empty keys
        tempTestArray = testData.split("####");
        tempTestArray.forEach(function (element) {
            if (element.search("TestName:") != -1) {
                if (element.split("TestName:")[1].trim().length == 0) {
                    errList.push(errorReporter.createErrorObj('NO_VALUE_KEY',"No value for key 'TestName' "));
                }
            }
            else if (element.search("ConceptIds:") != -1) {
                var keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
                Concepts = keyvalue[1].split(',');
            }
            else if(element.search("ConceptCode:") != -1){
                var keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
                Concepts = keyvalue[1].split(',');
            }
            // else if (element.search("Syllabus:") != -1) {
            //     if (element.split("Syllabus:")[1].trim().length == 0) {
            //         errList.push("No value for Syllabus: ");
            //     }
            // }
            /**
             * uncomment for enabling validation
             */
            // else if (element.search("Time:") != -1) {
            //     if (element.split("Time:")[1].trim().length == 0 || isNaN(parseInt(element.split("Time:")[1].replace(/<[^>]*>/g, '').trim()))) {
            //         errList.push("No value or Incorrect value for Time: ");
            //     }
            // }
            // else if (element.search("Language:") != -1) {
            //     if (element.split("Language:")[1].trim().length == 0) {
            //         errList.push("No value for Language: ");
            //     }
            // }
            // else if (element.search("Attempts:") != -1) {
            //     if (element.split("Attempts:")[1].trim().length == 0) {
            //         errList.push("No value for Attempts: ");
            //     }
            // }
            // else if (element.search("TestPause:") != -1) {
            //     if (element.split("TestPause:")[1].trim().length == 0) {
            //         errList.push("No value for TestPause: ");
            //     }
            // }
            // else if (element.search("Review:") != -1) {
            //     if (element.split("Review:")[1].trim().length == 0) {
            //         errList.push("No value for Review: ");
            //     }
            // }
            // else if (element.search("ShowCorrectAnswers:") != -1) {
            //     if (element.split("ShowCorrectAnswers:")[1].trim().length == 0) {
            //         errList.push("No value for ShowCorrectAnswers: ");
            //     }
            // }
            // else if (element.search("SectionShuffle:") != -1) {
            //     if (element.split("SectionShuffle:")[1].trim().length == 0) {
            //         errList.push("No value for SectionShuffle: ");
            //     }
            // }
            // else if (element.search("QuestionShuffle:") != -1) {
            //     if (element.split("QuestionShuffle:")[1].trim().length == 0) {
            //         errList.push("No value for QuestionShuffle: ");
            //     }
            // }
            // else if (element.search("AnswerShuffle:") != -1) {
            //     if (element.split("AnswerShuffle:")[1].trim().length == 0) {
            //         errList.push("No value for AnswerShuffle: ");
            //     }
            // }
            // else if (element.search("TestType:") != -1) {
            //     if (element.split("TestType:")[1].trim().length == 0) {
            //         errList.push("No value for TestType: ");
            //     }
            // }
            // else if (element.search("StartDate:") != -1) {
            //     if (element.split("StartDate:")[1].trim().length == 0) {
            //         errList.push("No value for StartDate: ");
            //     }
            // }
            // else if (element.search("EndDate:") != -1) {
            //     if (element.split("EndDate:")[1].trim().length == 0) {
            //         errList.push("No value for EndDate: ");
            //     }
            // }
            // else if(element.search("TestId:") !=-1){
            //     if (element.split("TestId:")[1].trim().length != 0) {
            //         if(toObjectId(element.split("TestId:")[1].trim())==null){
            //             errList.push("TestId not valid object Id");
            //         }
            //         else{
            //             ids["TestId"] = element.split("TestId:")[1].trim();
            //         }
            //     }
            // }
            // else if(element.search("ScheduleId:") != -1){
            //     if (element.split("ScheduleId:")[1].trim().length != 0) {
            //         if(toObjectId(element.split("ScheduleId:")[1].trim())==null){
            //             errList.push("ScheduleId not valid object Id");
            //         }
            //         else{
            //             ids["ScheduleId"] = element.split("ScheduleId:")[1].trim();
            //         }
            //      }
            // }
            // else if(element.search("CourseId:") != -1){
            //     if (element.split("CourseId:")[1].trim().length != 0) {
            //         var courseIds = element.split("CourseId:")[1].split(',');
            //         courseIds.forEach(function(course){
            //             if(toObjectId(course.trim())==null){
            //                 errList.push("CourseId not valid object Id");
            //             }
            //         })
            //      }
            //      else if(element.split("CourseId:")[1].trim().length == 0){
            //         errList.push("CourseId not found");
            //      }
            // }
        })
        callback();
    }], function (err) {
        testvalback(ids,Concepts,errList);
    })

}

var validateSectionObj = function (sectionData, sectionvalback) {
    errList = []
    sectionDataSeperated = sectionData.split("####");
    var serialNo = 0;
    async.series([function (callback) {
        //serial number
        if (sectionData.search("SerialNo") == -1) {
            errList.push(errorReporter.createErrorObj("MISSING_KEY","Missing SerialNo key in Section "));
        }
        callback();
    }, function (callback) {
        //check value for serial no value
        sectionDataSeperated.forEach(function (element) {
            if (element.search("SerialNo:") != -1) {
                if (element.split("SerialNo:")[1].trim().length == 0 && isNaN(parseInt(element.replace(/<[^>]*>/g, '').split("SerialNo:")[1].trim()))) {
                    errList.push(errorReporter.createErrorObj("INVALID_VALUE_KEY","No value or Incorrect value for SerialNo: "));
                }
                else {
                    serialNo = parseInt(element.replace(/<[^>]*>/g, '').split("SerialNo:")[1].trim());
                }
            }
        })
        callback();
    }, function (callback) {
        //section name 
        if (sectionDataSeperated[0].length == 0 || sectionDataSeperated[0].search("SerialNo:") != -1 || sectionDataSeperated[0].search("Subject:") != -1) {
            if (serialNo != 0)
                errList.push(errorReporter.createErrorObj("NO_VALUE_KEY","Section Name Missing for " + serialNo));
            else
                errList.push(errorReporter.createErrorObj("NO_VALUE_KEY","Section Name and serial Number Missing for "));
        }
        callback();
    }], function () {
        sectionvalback(errList);
    })
}

var validateSubSectionObj = function (subsectionData, subsectionvalback) {
    errList = [];
    sectionDataSeperated = subsectionData.split("####");
    var serialNo = 0;
    async.series([function (callback) {
        //sub section serial no key
        if (subsectionData.search("SubSectionSerialNo") == -1) {
            errList.push(errorReporter.createErrorObj("MISSING_KEY","Missing SubSectionSerialNo key in SubSection "));
        }
        callback();
    }, function (callback) {
        //sub section serial number value
        sectionDataSeperated.forEach(function (element) {
            if (element.search("SubSectionSerialNo:") != -1) {
                if (element.split("SubSectionSerialNo:")[1].trim().length == 0 && isNaN(parseInt(element.replace(/<[^>]*>/g, '').split("SerialNo:")[1])))
                    errList.push( errorReporter.createErrorObj("INVALID_VALUE_KEY","Missing or invalid SubSectionSerialNo value in SubSection "));
                   
                else
                    serialNo = parseInt(element.replace(/<[^>]*>/g, '').split("SerialNo:")[1]);
            }
        })
        callback();
    }, function (callback) {
        //compulsory keys
        var keys = ['MarksPerQuestion:', 'NegativeMarks:'];
        keys.forEach(function (key) {
            if (subsectionData.search(key) == -1 && serialNo != 0) {
                errList.push(errorReporter.createErrorObj("NO_VALUE_KEY","Missing key " + key + " in SubSectionSerialNo " + serialNo));
            }
            else if (subsectionData.search(key) == -1) {
                errList.push(errorReporter.createErrorObj("NO_VALUE_KEY","Missing key " + key ));
            }
        });
        callback();
    }, function (callback) {
        //checking value for keys
        sectionDataSeperated.forEach(function (element) {
            if (element.search("MarksPerQuestion:") != -1) {
                if (element.split("MarksPerQuestion:")[1].trim().length == 0 && serialNo==0) {
                    errList.push( errorReporter.createErrorObj("NO_VALUE_KEY","No value for MarksPerQuestion: "));
                }
                else if(element.split("MarksPerQuestion:")[1].trim().length == 0){
                    errList.push( errorReporter.createErrorObj("NO_VALUE_KEY","No value for MarksPerQuestion: "+serialNo));
                }
            }
            else if (element.search("NegativeMarks:") != -1) {
                if (element.split("NegativeMarks:")[1].trim().length == 0 && serialNo==0) {
                    errList.push(errorReporter.createErrorObj("NO_VALUE_KEY","No value for NegativeMarks: "));
                }
                else if(element.split("NegativeMarks:")[1].trim().length == 0){
                    errList.push(errorReporter.createErrorObj("NO_VALUE_KEY","No value for NegativeMarks: "+serialNo));
                }
            }
            else if (element.search("PartialMarkPerChoice:") != -1) {
                if (element.split("PartialMarkPerChoice:")[1].trim().length == 0&& serialNo==0) {
                    errList.push(errorReporter.createErrorObj("NO_VALUE_KEY","No value for PartialMarkPerChoice: "));
                }
                else if (element.split("PartialMarkPerChoice:")[1].trim().length == 0&& serialNo==0) {
                    errList.push(errorReporter.createErrorObj("NO_VALUE_KEY","No value for PartialMarkPerChoice: "+serialNo));
                }
            }
        })
        callback();
    }], function () {
        subsectionvalback(errList);
    })
}

var validateQuestionObj = function (questionData,Concepts, questionvalback) {
    var errList = [];
    var serialNo = 0;
    var questionType = "";
    async.series([function (callback) {
        //question serial number
        if (questionData.search("QuestionSerialNo:") == -1) {
            errList.push(errorReporter.createErrorObj("QUESTION_MISSING_KEY","Missing QuestionSerialNo key in Question "));
        }
        callback();
    }, function (callback) {
        //value for question serial number
        qData = questionData.split('####');
        qData.forEach(function (element) {
            if (element.search("QuestionSerialNo:") != -1) {
                if (element.split("QuestionSerialNo:")[1].trim().length == 0 && isNaN(parseInt(element.replace(/<[^>]*>/g, '').split("QuestionSerialNo:")[1]))) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Missing or invalid QuestionSerialNo"));
                }
                else {
                    serialNo = parseInt(element.replace(/<[^>]*>/g, '').split("QuestionSerialNo:")[1]);
                }
            }
        })
        callback();
    },
     function(callback){
        if (questionData.search("ConceptCode:") == -1 && questionData.search("ConceptIds:") == -1 && serialNo != 0 && Concepts.length ==0 ) {
            errList.push(errorReporter.createErrorObj("QUESTION_MISSING_KEY","Missing Concept key in Question question No " + serialNo));
        }
        else if (questionData.search("ConceptCode:") == -1 && questionData.search("ConceptIds:") == -1 && serialNo == 0 && Concepts.length ==0 ) {
            errList.push(errorReporter.createErrorObj("QUESTION_MISSING_KEY","Missing Concept key in Question without serial number"));
        }
        callback();
    },
     function (callback) {
        //question type
        var qType = ['MMCQ', 'SMCQ', 'Matrix', 'Passage', 'True-False', 'Blanks', 'Descriptive', 'Numerical', 'Integer'];
        qData = questionData.split('####');
        var qFlag = 0;
        for (i = 0; i < qType.length; i++) {
            if (qData[0].replace(/<[^>]*>/g, '').trim()==qType[i]) {
                qFlag = 1;
                questionType = qType[i];
                break;
            }
        }
        if (qFlag == 0 && serialNo != 0) {
            errList.push(errorReporter.createErrorObj("QUESTION_TYPE","QuestionType not found for question No " + serialNo));
        }
        else if (qFlag == 0 && serialNo == 0) {
            errList.push(errorReporter.createErrorObj("QUESTION_TYPE","QuestionType not found and serial no missing"));
        }
        //value for key
        qData.forEach(function (element) {
            /**
             * Add check for options being saved
             */
            if (element.search("Answer:") != -1) {
                if (element.split("Answer:")[1].trim().length == 0 && serialNo != 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Answer doesn't have value in Question No" + serialNo));
                }
                else if (element.split("Answer:")[1].trim().length == 0 && serialNo == 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Answer doesn't have value"));
                }
                else if (element.split("Answer:")[1].trim().length != 0 && serialNo != 0 && checkImage(element.split("Answer:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Answer doesn't right image format in Question No" + serialNo));
                }
                else if (element.split("Answer:")[1].trim().length != 0 && serialNo == 0 && checkImage(element.split("Answer:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Answer doesn't right image format in Question"));
                }
                else if(questionType.length != 0 && (questionType == "MMCQ" || questionType == "SMCQ" || questionType == "True-False")){
                        var ansArray=element.split("Answer:")[1].replace(/<[^>]*>/g, '').split(",");
                        var errString = serialNo ? "Answer doesn't have right value in Question No"+serialNo : "Answer doesn't have right value"
                        ansArray.forEach(function(ans){
                            var aFlag = 0;
                            for (var i = 1; i < 10; i++) {
                                if( titleCase(ans.trim())=="Option" + i){
                                    aFlag = 1;
                                    break;
                                }
                            }
                            if(aFlag == 0){
                                errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY",errString));
                            }
                        });
                }
            }
            // else if (element.search("Level:") != -1) {
            //     if (element.split("Level:")[1].trim().length == 0 && serialNo != 0) {
            //         errList.push("Level doesn't have value in Question No" + serialNo);
            //     }
            //     else if (element.split("Level:")[1].trim().length == 0 && serialNo == 0) {
            //         errList.push("Level doesn't have value");
            //     }
            // }
            else if (element.search("Question:") != -1) {
                if (element.split("Question:")[1].trim().length == 0 && serialNo != 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Question doesn't have value in Question No" + serialNo));
                }
                else if (element.split("Question:")[1].trim().length == 0 && serialNo == 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Question doesn't have value"));
                }
                else if (element.split("Question:")[1].trim().length != 0 && serialNo != 0 && checkImage(element.split("Question:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Question doesn't right image format in Question No" + serialNo));
                }
                else if (element.split("Question:")[1].trim().length != 0 && serialNo == 0 && checkImage(element.split("Question:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Question doesn't right image format in Question"));
                }
            }
            else if (element.search("Solution:") != -1) {
                if (element.split("Solution:")[1].trim().length == 0 && serialNo != 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Solution doesn't have value in Question No" + serialNo));
                }
                else if (element.split("Solution:")[1].trim().length == 0 && serialNo == 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Solution doesn't have value"));
                }
                else if (element.split("Solution:")[1].trim().length != 0 && serialNo != 0 && checkImage(element.split("Solution:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Solution doesn't right image format in Question No" + serialNo));
                }
                else if (element.split("Solution:")[1].trim().length != 0 && serialNo == 0 && checkImage(element.split("Solution:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Solution doesn't right image format in Question"));
                }
            }
            else if (element.search("Hint:") != -1) {
                if (element.split("Hint:")[1].trim().length == 0 && serialNo != 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Hint doesn't have value in Question No" + serialNo));
                }
                else if (element.split("Hint:")[1].trim().length == 0 && serialNo == 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Hint doesn't have value"));
                }
                else if (element.split("Hint:")[1].trim().length != 0 && serialNo != 0 && checkImage(element.split("Hint:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Hint doesn't right image format in Question No" + serialNo));
                }
                else if (element.split("Hint:")[1].trim().length != 0 && serialNo == 0 && checkImage(element.split("Solution:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Hint doesn't right image format in Question"));
                }
            }
            else if (element.search("Tags:") != -1) {
                if (element.split("Tags:")[1].trim().length == 0 && serialNo != 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Tags doesn't have value in Question No" + serialNo));
                }
                else if (element.split("Tags:")[1].trim().length == 0 && serialNo == 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Tags doesn't have value"));
                }
            }
            // else if (element.search("ConceptIds:") != -1) {
            //     if (element.split("ConceptIds:")[1].trim().length == 0 && serialNo != 0) {
            //         errList.push("ConceptIds doesn't have value in Question No" + serialNo);
            //     }
            //     else if (element.split("ConceptIds:")[1].trim().length == 0 && serialNo == 0) {
            //         errList.push("ConceptIds doesn't have value");
            //     }
            // }
            // else if (element.search("ConceptCode:") != -1) {
            //     if (element.split("ConceptCode:")[1].trim().length == 0 && serialNo != 0) {
            //         errList.push("ConceptCode doesn't have value in Question No" + serialNo);
            //     }
            //     else if (element.split("ConceptCode:")[1].trim().length == 0 && serialNo == 0) {
            //         errList.push("ConceptCode doesn't have value");
            //     }
            // }
            else if (element.search("Paragraph:") != -1) {
                if (element.split("Paragraph:")[1].trim().length == 0 && serialNo != 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Paragraph doesn't have value in Question No" + serialNo));
                }
                else if (element.split("Paragraph:")[1].trim().length == 0 && serialNo == 0) {
                    errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Paragraph doesn't have value"));
                }
                else if (element.split("Paragraph:")[1].trim().length != 0 && serialNo != 0 && checkImage(element.split("Paragraph:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Paragraph doesn't right image format in Question No" + serialNo));
                }
                else if (element.split("Paragraph:")[1].trim().length != 0 && serialNo == 0 && checkImage(element.split("Paragraph:")[1]) == -1) {
                    errList.push(errorReporter.createErrorObj("INVALID_IMG","Paragraph doesn't right image format in Question"));
                }
            }
            else{
                for (var i = 1; i < 10; i++) {
                    if (element.search("Option" + i + ":") != -1) {
                        if (element.split("Option" + i + ":")[1].trim().length == 0 && serialNo != 0) {
                            errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Option"+i+" doesn't have value in question no"+ serialNo));
                        }
                        else if (element.split("Option" + i + ":")[1].trim().length == 0 && serialNo == 0){
                            errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Option"+i+" doesn't have value"));
                        }
                        else if (element.split("Option" + i + ":")[1].trim().length != 0 && serialNo == 0 && checkImage(element.split("Option" + i + ":")[1]) == -1){
                            errList.push(errorReporter.createErrorObj("INVALID_IMG","Option"+i+" doesn't right image format"));
                        }
                        else if (element.split("Option" + i + ":")[1].trim().length != 0 && serialNo != 0 && checkImage(element.split("Option" + i + ":")[1]) == -1){
                            errList.push(errorReporter.createErrorObj("INVALID_IMG","Option"+i+" doesn't right image format in Question No" + serialNo));
                        }
                    }
                    else if (element.search("Left" + i + ":") != -1) {
                        if (element.split("Left" + i + ":")[1].trim().length == 0 && serialNo != 0) {
                            errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Left"+i+" doesn't have value in question no"+ serialNo));
                        }
                        else if (element.split("Left" + i + ":")[1].trim().length == 0 && serialNo == 0){
                            errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Left"+i+" doesn't have value"));
                        }
                        else if (element.split("Left" + i + ":")[1].trim().length != 0 && serialNo == 0 && checkImage(element.split("Left" + i + ":")[1]) == -1){
                            errList.push(errorReporter.createErrorObj("INVALID_IMG","Left"+i+" doesn't right image format"));
                        }
                        else if (element.split("Left" + i + ":")[1].trim().length != 0 && serialNo != 0 && checkImage(element.split("Left" + i + ":")[1]) == -1){
                            errList.push(errorReporter.createErrorObj("INVALID_IMG","Left"+i+" doesn't right image format in Question No" + serialNo));
                        }
                    }
                    else if (element.search("Right" + i + ":") != -1) {
                        if (element.split("Right" + i + ":")[1].trim().length == 0 && serialNo != 0) {
                            errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Right"+i+" doesn't have value in question no"+ serialNo));
                        }
                        else if (element.split("Right" + i + ":")[1].trim().length == 0 && serialNo == 0){
                            errList.push(errorReporter.createErrorObj("QUESTION_NO_VALUE_KEY","Right"+i+" doesn't have value"));
                        }
                        else if (element.split("Right" + i + ":")[1].trim().length != 0 && serialNo == 0 && checkImage(element.split("Right" + i + ":")[1]) == -1){
                            errList.push(errorReporter.createErrorObj("INVALID_IMG","Right"+i+" doesn't right image format"));
                        }
                        else if (element.split("Right" + i + ":")[1].trim().length != 0 && serialNo != 0 && checkImage(element.split("Right" + i + ":")[1]) == -1){
                            errList.push(errorReporter.createErrorObj("INVALID_IMG","Right"+i+" doesn't right image format in Question No" + serialNo));
                        }
                    }
                }
            }
        })
        callback();
    }, function (callback) {
        //compulsory fields in question
        var keys = ['Answer:', 'Question:'];//, 'Level:'
        keys.forEach(function (key) {
            if (questionData.search(key) == -1 && serialNo != 0) {
                errList.push(errorReporter.createErrorObj("QUESTION_MISSING_KEY","Missing key  " + key + " in question No" + serialNo));
            }
            else if (questionData.search(key) == -1 && serialNo == 0) {
                errList.push(errorReporter.createErrorObj("QUESTION_MISSING_KEY","Missing key  " + key + " and question No"));
            }
        });
        callback();
    }], function () {
        questionvalback(errList);
    });
}

var validateConcepts = function(simpleHtml,conceptCallback){
    var elementArray = simpleHtml.split('####');
    var conceptCodeArray=[];
    var conceptIdArray=[];
    var errConceptCodeList= [];//'ConceptCode not found in whole paper - ';
    var errConceptIdList= [];//'ConceptIds not found in whole paper - ';
    elementArray.forEach(function(element){
        if (element.search("ConceptIds:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            concepts = keyvalue[1].split(",");
            for (var i = 0; i < concepts.length; i++) {
                conceptIdArray.push(concepts[i].trim());
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            code = keyvalue[1].split(",");
            for (var i = 0; i < code.length; i++) {
                conceptCodeArray.push(code[i].trim());
            }
        }
    })
    var uConceptCodeArray = Array.from(new Set(conceptCodeArray));//[...uSet]
    var uConceptIdArray = Array.from(new Set(conceptIdArray));
    if(uConceptIdArray.length==0 && uConceptCodeArray.length==0){
        conceptCallback('Zero conceptIds in file');
    }
    else{
        dsl.getConceptObj(uConceptCodeArray,uConceptIdArray, function(err,data){
            if(err){
                console.log(err);
                conceptCallback(err);
            }
            else{
                if(data.length==0){
                    conceptCallback('All Concepts not found in database');
                }
                else {
                    for(i=0;i<uConceptCodeArray.length;i++){
                        var cObj = _.find(data,{ 'conceptCode': uConceptCodeArray[i]});
                        if(cObj == undefined){
                            errConceptCodeList.push(uConceptCodeArray[i]);
                        }
                    }
                    
                    for(j=0;j<uConceptIdArray.length;j++){
                        var cObj = _.find(data,{ 'conceptId': uConceptIdArray[j]});
                        if(cObj == undefined){
                            errConceptIdList.push(uConceptIdArray[j]);
                        }
                    }
                    if(errConceptIdList.length==0 && errConceptCodeList.length==0){
                        conceptCallback(null);
                    }
                    else if(uConceptCodeArray.length==data.length || uConceptIdArray.length==data.length){
                        conceptCallback(null);
                    }
                    else{
                        var errConceptList = ((errConceptCodeList.length >0) ? ("ConceptCode not found in mongoDB - " + errConceptCodeList) : "") + "\n" 
                                                + ((errConceptIdList.length >0) ? ("ConceptIds not found in mongoDB - "+ errConceptIdList) : "");
                        conceptCallback(errConceptList);
                    }
                }
            }
        })
    }
}

//for script
exports.validate = function (testCode,resultHtml, dataInserted) { 
    //exports.validate = function (resultHtml, dataInserted) {
    var errList = []
    var testId;
    var scheduleId;
    var tempSection = resultHtml.slice(4, resultHtml.length).split("####Section:");
    var testData = tempSection[0];
    tempSection.splice(0, 1);
    dsl.validateTestObj(testCode,function(err){
        if(err){
            errList.push(errorReporter.createErrorObj("TEST_CODE_ISSUE",err));
        }
        validateTestObj(testData, function (ids,Concepts,testError) {
                //console.log(returnTestObj);
                // createCourseObj(testData, test, function (err) {
                //     if (err) {
                //         console.log("test not added in course", err);
                //     }
                //     else {
                if (tempSection.length == 0) {
                    //no section found
                    errList.push(errorReporter.createErrorObj("MISSING_SECTION","Test doesn't have Section"));
                    dataInserted(ids,errList);
                }
                else {
                    async.eachSeries(tempSection,
                        function (section, sectionback) {
                            var tempSubSection = section.split("####SubSection:");
                            var sectionData = tempSubSection[0];
                            tempSubSection.splice(0, 1);
                            //console.log("========================sectionData",sectionData);
                            validateSectionObj(sectionData, function (SectionError) {
                                errList = errList.concat(SectionError);
                                //console.log("sectionData",sectionData);
                                if (tempSubSection.length == 0) {
                                    //subsection not found
                                    errList.push(errorReporter.createErrorObj("MISSING_SUB_SECTION","Section doesn't have subsection"));
                                    dataInserted(ids,errList);
                                }
                                else {
                                    async.eachSeries(tempSubSection,
                                        function (subSection, subsectionback) {
                                            var questionIdArray = [];
                                            tempQuestion = subSection.split("####QuestionType:");
                                            var subsectionData = tempQuestion[0];
                                            //console.log("========================subsectionData",subsectionData);
                                            tempQuestion.splice(0, 1);
                                            //console.log(tempQuestion.length);
                                            async.eachSeries(tempQuestion,
                                                function (element, questionback) {
                                                    if(element.split("####")[0].replace(/<[^>]*>/g, '').trim()=="Passage" && element.search("####SubQuestionType:")!=-1){
                                                        var subQuestionArray = element.split("####SubQuestionType:");
                                                        subQuestionArray.splice(0,1);
                                                        async.eachSeries(subQuestionArray,function(subQuestion,nextSubQues){
                                                            validateQuestionObj(subQuestion,Concepts, function (subQuestionError) {
                                                                errList = errList.concat(subQuestionError);
                                                                //Maximum call stack size exceeded
                                                                async.setImmediate(function(){
                                                                    nextSubQues();
                                                                });
                                                                //questionback();
                                                            })
                                                        },function(err){
                                                            questionback();
                                                        });
                                                    }
                                                    else{
                                                        validateQuestionObj(element,Concepts, function (questionError) {
                                                            errList = errList.concat(questionError);
                                                            //Maximum call stack size exceeded
                                                            async.setImmediate(function(){
                                                                questionback()
                                                            });
                                                            //questionback();
                                                        })
                                                    }
                                                }, function (err) {
                                                    validateSubSectionObj(subsectionData, function (SubSectionError) {
                                                        errList = errList.concat(SubSectionError);
                                                        // console.log(errList);
                                                        subsectionback(null);
                                                    })
                                                })
                                        },function(err){
                                            sectionback(null);
                                        })
                                }
                            })
                        },function (err) {
                            if (err) {
                                dataInserted(err);
                            }
                            else {
                                validateConcepts(resultHtml, function (err) {
                                    if(err){
                                        errList.push(errorReporter.createErrorObj("CONCEPT_ISSUE",err));
                                    }
                                    errList = errList.concat(testError);
                                    //console.log(errList);
                                    dataInserted(ids, errList);
                                });
                            }
                        })
        
                    //     }
                    // })
                }
            })
    });
}
