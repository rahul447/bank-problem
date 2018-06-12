var fs = require('fs');
var mammoth = require("../mammoth/lib");
var AWS = require('aws-sdk');
var async = require('async');
var mongoose = require('mongoose');
var Question = require('../../question/question.model');
var Test = require('../../test/tests.model');
var dsl = require("./dsl");
var CourseItem = require('../../courseItem/courseItem.model');
var Concept = require('../../concept/concept.model');
var uuidv4 = require('uuid/v4');
var _ = require('lodash');

var keyArray = ['#Subject:', '#TestName:', '#Time:', '#Language:', '#Attempts:', '#StartDate:', '#EndDate:',
    '#TestPause:', '#Review:', '#ShowCorrectAnswers:', '#SectionShuffle:', '#QuestionShuffle:',
    '#AnswerShuffle:', '#TestType:', '#Syllabus:', '#ConceptIds:','#ConceptIds:','#ConceptIds:' ,'#Section:', '#SectionSerialNo:',
    '#Subject:', '#SubSection:', '#MarksPerQuestion:', '#NegativeMarks:', '#QuestionType:', '#QuestionSerialNo:',
    '#Question:', '#Answer:', '#Solution:', '#Hint:', '#Level:', '#Tags:', '#SubQuestionType:',
    '#Option', '#Left', '#Right', '#SubSubject:', '#Paragraph:', '#ConceptCode:','#ConceptCode:', '#ScheduleId:', '#Course:',
    '#SerialNo:', '#SubSectionSerialNo:', '#TotalQuestions:', '#CourseId:', '#TestId:', '#PartialMarkPerChoice:'];

var checkKeyArray = ['#subject:', '#testname:', '#time:', '#language:', '#attempts:', '#startdate:', '#enddate:',
    '#testpause:', '#review:', '#showcorrectanswers:', '#sectionshuffle:', '#questionshuffle:',
    '#answershuffle:', '#testtype:', '#syllabus:', '#conceptids:','#conceptid:','#conceptlds:','#section:', '#sectionserialno:',
    '#subject:', '#subsection:', '#marksperquestion:', '#negativemarks:', '#questiontype:', '#questionserialno:',
    '#question:', '#answer:', '#solution:', '#hint:', '#level:', '#tags:', '#subquestiontype:',
    '#option', '#left', '#right', '#subsubject:', '#paragraph:', '#conceptcode:','#Concept Code:', '#scheduleid:', '#course:',
    '#serialno:', '#subsectionserialno:', '#totalquestions:', '#partialmarkperchoice:'];

String.prototype.replaceBetween = function(start, end, what) {
    return this.substring(0, start) + what + this.substring(end);
};
function titleCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
};
exports.formatEquation = function(result,formatFirst){
    var replacestrng = "\(";
    //replace(/\\kern-\\nulldelimiterspace/g, "") cause this creates issues while forming the equation
    result = result.replace(/\\rm/g,"\\space").replace(/\\limits/g,"\\int").replace(/\\hfill/g,"").replace(/\\cr/g,"").replace(/\\nderline/g,"\\underline");
    var text = result.replace(/\\~/g, "\\text{~}").replace(/\\kern-\\nulldelimiterspace/g, "").replace(/<\/strong>/g, '').replace(/<strong>/g, '').replace(/<\/?a[^>]*>/g, "");
        for (n = 0; n < text.length; n++) {
            if (text[n] == "#" && text[n + 1] == "e" && text[n + 2] == "q" && text[n + 3] == "u" && text[n + 4] == "a" && text[n + 5] == "t" && text[n + 6] == "i" && text[n + 7] == "o" && text[n + 8] == "n") {
                for (m = n + 8; m < text.length; m++) {
                    if (text[m] == "e" && text[m + 1] == "q" && text[m + 2] == "u" && text[m + 3] == "a" && text[m + 4] == "t" && text[m + 5] == "i" && text[m + 6] == "o" && text[m + 7] == "n" && text[m + 8] == "#") {
                        var equationStr = text.substring(n, m + 9);
                        var rEquationStr = equationStr.replace(/<p>/g, "").replace(/<\/p>/g, "");//.replace(/[$]/g,'');//remove p tag and $ from latex 
                        // if (rEquationStr.search('&amp;') != -1) {
                        //     //console.log(rEquationStr);
                        //     rEquationStr = "#equation\\begin{matrix}" + rEquationStr.replace(/\$/g, '').replace(/equation#/g, '').replace(/#equation/g, '') + "\\end{matrix}equation#";
                        // }
                         //console.log("equationStr",equationStr);
                         //console.log("rEquationStr",rEquationStr);
                        //console.log(text.length);
                        rEquationStr = rEquationStr.replace(/\$/g, "").replace(/\[/g,"(").replace(/\]/g,")");
                        text = text.replaceBetween(n, m + 9, rEquationStr);
                        break;
                    }
                }
            }
        }
    if(n==text.length)formatFirst(null,text);
}

exports.formatHtml = function(text,formatSecond){
    //.replace(/<br \/>/g,'</p><p>')
    //.replace(/\$\$equation#/g, "$</span>").replace(/#equation\$\$/g, "<span class='math-tex'>$")




    // var replacestrng = ">\\(";
    var html = text.replace(/equation#/g, "\\)</span>").replace(/#equation/g, "<span class='math-tex'>\\(");
    html = html.replace(/\\\)\\\)/g,"\\)").replace(/\\\(\\\(/g,"\\(");
    // html = html.replace(/>\$/g,replacestrng).replace(/\$</g,"\)<");
    // //console.log(html.search(">\\["));
    // html = html.replace(/\[/g,replacestrng).replace(/\]</g,"\)<");




    // var replacestrng = "\(";

    // var replaceArray=[">\$",">\$\$",">\\\[","$</","$$</","\]</"];
    // var replacewithArray = [">\(",">\(",">\(","\)</","\)</","\)</"];
    // //.replace(/\$\$equation#/g, "$</span>").replace(/#equation\$\$/g, "<span class='math-tex'>$")
    // //var html = text.replace(/equation#/g, "</span>").replace(/#equation/g, "<span class='math-tex'>");
    // //html = html.replace(/>\$/g,replacestrng).replace(/\$</g,"\\)<");
    // //html =html.replace(/\[/g,replacestrng).replace(/\]</g,"\)");
    // var html=text.replace(/#equation/g,"<span class='math-tex'>").replace(/equation#/g,"</span>");
    // for(i=0;i<replaceArray.length;i++){
    //     //console.log(replaceArray[i]);
    //     html=html.replace(new RegExp(replaceArray[i],'g'),replacewithArray[i]);
    // }
    //html =html.replace(/\[/g,replacestrng);
    //console.log(html);
    for (i = 0; i < html.length; i++) {
        if (html[i] == "<" && html[i + 1] == "p" && html[i + 2] == ">") {
            for (j = i + 3; j < html.length; j++) {
                if (html[j] == "<" && html[j + 1] == "/" && html[j + 2] == "p" && html[j + 3] == ">") {
                    var str = html.substring(i, j + 4);
                    var valueStr = html.substring(i, j);
                    for (k = 0; k < checkKeyArray.length; k++) {
                        var element = checkKeyArray[k];
                        if (str.toLowerCase().search(element) != -1) {
                            var value = valueStr.toLowerCase().split(element);
                            var replaceStr = "###"+keyArray[k] + value[1];
                            // console.log("str",str);
                            // console.log("valuestr",valueStr);
                            // console.log("value",value[1]);
                            // console.log("replaceStr",replaceStr);
                            html = html.replaceBetween(i, j + 4, replaceStr);
                            break;
                        }
                    }
                    break;
                }
            }
        }
        else if (html[i] == "<" && html[i + 1] == "h" && html[i + 3] == ">") {
            //can be implemented into one function
            for (j = i + 4; j < html.length; j++) {
                if (html[j] == "<" && html[j + 1] == "/" && html[j + 2] == "h" && html[j + 4] == ">") {
                    var str = html.substring(i, j + 5);
                    var valueStr = html.substring(i, j);
                    for (k = 0; k < checkKeyArray.length; k++) {
                        var element = checkKeyArray[k];
                        if (str.toLowerCase().search(element) != -1) {
                            var value = valueStr.toLowerCase().split(element);
                            var replaceStr = "###"+keyArray[k] + value[1];
                            // console.log("str",str);
                            // console.log("valuestr",valueStr);
                            // console.log("value",value[1]);
                            // console.log("replaceStr",replaceStr);
                            html = html.replaceBetween(i, j + 5, replaceStr);
                            break;
                        }
                    }
                    break;
                }
            }

        }
    }
    formatSecond(null,html);
}

exports.readFile = function(test,resultHtml,conceptsObjArray,dataInserted){

        var tempSection = resultHtml.slice(4, resultHtml.length).split("####Section:");
        var testData = tempSection[0];
        var totalMarks=0;
        tempSection.splice(0, 1);
        //console.log("========================TestData",testData);
        createTestObj(test, testData, tempSection.length,conceptsObjArray, function (returnTestObj, conceptArray) {
            //console.log(returnTestObj);
            // createCourseObj(testData, test, function (err) {
            //     if (err) {
            //         console.log("test not added in course", err);
            //     }
            //     else {
                conceptArray = conceptsObjArray;
                    async.eachSeries(tempSection,
                        function (section, sectionback) {
                            var tempSubSection = section.split("####SubSection:");
                            var sectionData = tempSubSection[0];
                            //console.log("========================sectionData",sectionData);
                            createSectionObj(sectionData, function (returnSectionObj) {
                                //console.log("sectionData",sectionData);
                                tempSubSection.splice(0, 1);
                                async.eachSeries(tempSubSection, function (subSection, subsectionback) {
                                    var questionIdArray = [];
                                    tempQuestion = subSection.split("####QuestionType:");
                                    var subsectionData = tempQuestion[0];
                                    //console.log("========================subsectionData",subsectionData);
                                    tempQuestion.splice(0, 1);
                                    //console.log(tempQuestion.length);
                                    async.eachSeries(tempQuestion,
                                        function (element, questionback) {
                                            //console.log(element);
                                            var data = element.split('####');
                                            //console.log(data[0]);
                                            if (data[0].replace(/<[^>]*>/g, '').trim() == "MMCQ") {
                                                console.log("mmcq");
                                                mmcq(data, conceptArray,conceptsObjArray, function (returnObj, sNo) {
                                                    dsl.saveFunc(returnObj,function(err,qId){
                                                        if(!err){
                                                            var qObj = {
                                                                qId: qId,
                                                                questionSerialNo: sNo
                                                            };
                                                            questionIdArray.push(qObj);
                                                            questionback();
                                                        }
                                                        else{
                                                            questionback(err);
                                                        }
                                                    });
                                                });
                                            }
                                            else if (data[0].replace(/<[^>]*>/g, '').trim() == "SMCQ") {
                                                console.log("smcq");
                                                smcq(data, conceptArray,conceptsObjArray, function (returnObj, sNo) {
                                                    dsl.saveFunc(returnObj,function(err,qId){
                                                        if(!err){
                                                            var qObj = {
                                                                qId: qId,
                                                                questionSerialNo: sNo
                                                            };
                                                            questionIdArray.push(qObj);
                                                            questionback();
                                                        }
                                                        else{
                                                            questionback(err);
                                                        }
                                                    });
                                                });
                                            }
                                            else if (data[0].replace(/<[^>]*>/g, '').trim() == "Matrix") {
                                                console.log("Matrix");
                                                matrix(data, conceptArray,conceptsObjArray, function (returnObj, sNo) {
                                                    dsl.saveFunc(returnObj,function(err,qId){
                                                        if(!err){
                                                            var qObj = {
                                                                qId: qId,
                                                                questionSerialNo: sNo
                                                            };
                                                            questionIdArray.push(qObj);
                                                            questionback();
                                                        }
                                                        else{
                                                            questionback(err);
                                                        }
                                                    });
                                                });
                                            }
                                            else if (data[0].replace(/<[^>]*>/g, '').trim() == "Passage") {
                                                console.log("Passage");
                                                passage(element, conceptArray,conceptsObjArray, function (returnObjArray) {
                                                    //dsl call with async.series
                                                    async.eachSeries(returnObjArray, function (element, elementback) {
                                                        dsl.saveFunc(element.question, function (err, qId) {
                                                            if (!err) {
                                                                var qObj = {
                                                                    qId: qId,
                                                                    questionSerialNo: element.sNo
                                                                };
                                                                questionIdArray.push(qObj);
                                                                elementback();
                                                            }
                                                            else {
                                                                elementback(err);
                                                            }
                                                        })
                                                    }, function (err) {
                                                        if (err) {
                                                            questionback(err);
                                                        }
                                                        else {
                                                            questionback();
                                                        }
                                                    });
                                                });
                                            }
                                            else if (data[0].replace(/<[^>]*>/g, '').trim() == "True-False") {
                                                console.log("True-False");
                                                torf(data, conceptArray, function (returnObj, sNo) {
                                                    dsl.saveFunc(returnObj,function(err,qId){
                                                        if(!err){
                                                            var qObj = {
                                                                qId: qId,
                                                                questionSerialNo: sNo
                                                            };
                                                            questionIdArray.push(qObj);
                                                            questionback();
                                                        }
                                                        else{
                                                            questionback(err);
                                                        }
                                                    });
                                                });
                                            }
                                            else if (data[0].replace(/<[^>]*>/g, '').trim() == "Blanks") {
                                                console.log("Fill in the Blanks");
                                                blanks(data, conceptArray, function (returnObj, sNo) {
                                                    dsl.saveFunc(returnObj,function(err,qId){
                                                        if(!err){
                                                            var qObj = {
                                                                qId: qId,
                                                                questionSerialNo: sNo
                                                            };
                                                            questionIdArray.push(qObj);
                                                            questionback();
                                                        }
                                                        else{
                                                            questionback(err);
                                                        }
                                                    });
                                                });
                                            }
                                            else if (data[0].replace(/<[^>]*>/g, '').trim() == "Descriptive") {
                                                console.log("Descriptive");
                                                descriptive(data, conceptArray, function (returnObj, sNo) {
                                                    dsl.saveFunc(returnObj,function(err,qId){
                                                        if(!err){
                                                            var qObj = {
                                                                qId: qId,
                                                                questionSerialNo: sNo
                                                            };
                                                            questionIdArray.push(qObj);
                                                            questionback();
                                                        }
                                                        else{
                                                            questionback(err);
                                                        }
                                                    });
                                                });
                                            }
                                            else if (data[0].replace(/<[^>]*>/g, '').trim() == "Numerical") {
                                                console.log("Numerical");
                                                numerical(data, conceptArray,conceptsObjArray, function (returnObj, sNo) {
                                                    dsl.saveFunc(returnObj,function(err,qId){
                                                        if(!err){
                                                            var qObj = {
                                                                qId: qId,
                                                                questionSerialNo: sNo
                                                            };
                                                            questionIdArray.push(qObj);
                                                            questionback();
                                                        }
                                                        else{
                                                            questionback(err);
                                                        }
                                                    });
                                                });
                                            }
                                            else if (data[0].replace(/<[^>]*>/g, '').trim() == "Integer") {
                                                console.log("Integer");
                                                integer(data, conceptArray,conceptsObjArray, function (returnObj, sNo) {
                                                    dsl.saveFunc(returnObj,function(err,qId){
                                                        if(!err){
                                                            var qObj = {
                                                                qId: qId,
                                                                questionSerialNo: sNo
                                                            };
                                                            questionIdArray.push(qObj);
                                                            questionback();
                                                        }
                                                        else{
                                                            questionback(err);
                                                        }
                                                    });
                                                });
                                            }
                                            else {
                                                console.log("Question Type not found",data[0].trim().replace(/<[^>]*>/g, ''));
                                                //console.log("Question Type not found", element);
                                                questionback("Question Type not found");
                                            }
                                        }, function (err) {
                                            if (!err) {
                                                console.log("subsection added");
                                                createSubSectionObj(subsectionData, questionIdArray, function (returnSubSectionObj) {
                                                    returnSectionObj.subSection.push(returnSubSectionObj);
                                                    totalMarks = totalMarks+returnSubSectionObj.totalMarks;
                                                    subsectionback(null);
                                                })
                                            }
                                            else {
                                                subsectionback(err)
                                            }
                                        });
                                }, function (err) {
                                    if (!err) {
                                        console.log("section added");
                                        returnTestObj.data.sections.push(returnSectionObj);
                                        sectionback(null);
                                    }
                                    else {
                                        sectionback(err);
                                    }
                                })
                            })
                        }, function (err) {
                            if (!err) {
                                console.log("test object created");
                                test.settings.totalMarks = totalMarks;
                                //console.dir(returnTestObj,{depth:null});
                                dsl.saveTestFunc(returnTestObj,function(err){
                                    if(!err){
                                        console.log(returnTestObj._id);
                                        dataInserted(null);
                                    }
                                    else{
                                        console.log(err);
                                        dataInserted(err);
                                    }
                                })
                            }
                            else {
                                console.log(err);
                                dataInserted(err);
                            }
                        });
            //     }
            // })
        });
}
var mmcq = function (mcqobj, conceptArray,conceptsObjArray, dbsave) {
    var mcqdbobj = {
        questionType: "MMCQ",
        questionCode:8,
        level: "",
        tags: [],
        conceptId: [],
        conceptCode:[],
        content: [{
            locale: "en-us",
            questionContent: "",
            optionsContent: [],
            solutionContent: "",
            questionHints: "",
            correctAnswer: {
                answerType: "",
                data: []
            }
        }]
    };
    var sNo = 0;
    if(conceptArray.length !=0 ){
        for(i=0;i<conceptArray.length;i++){
            mcqdbobj.conceptId[i]=conceptArray[i]._id;
            mcqdbobj.conceptCode[i]=conceptArray[i].conceptCode;
        }
    }
    mcqobj.forEach(function (element) {
        //console.log(element);
        //keyvalue = element.split(':');
        if (element.search("Level:") != -1) {
            keyvalue = element.split("Level:");
            mcqdbobj.level = keyvalue[1].replace(/<[^>]*>/g, '').trim();
        }
        else if (element.search("Tags:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split('Tags:');
            mcqtags = keyvalue[1].split(",");
            for (var i = 0; i < mcqtags.length; i++) {
                mcqdbobj.tags[i] = mcqtags[i].trim();
            }
        }
        else if (element.search("ConceptIds:") != -1) {
            mcqdbobj.conceptCode=[];
            mcqdbobj.conceptId=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            mcqconcepts = keyvalue[1].split(",");
            for (var i = 0; i < mcqconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': mcqconcepts[i].trim()});
                if(cObj == undefined){
                    console.log('conceptId not found',mcqconcepts[i]);
                }
                else{
                    mcqdbobj.conceptId[i] = cObj._id;
                    mcqdbobj.conceptCode[i] = cObj.conceptCode;
                    // mcqdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            mcqdbobj.conceptCode=[];
            mcqdbobj.conceptId=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            mcqcodes = keyvalue[1].split(",");
            for (var i = 0; i < mcqcodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': mcqcodes[i].trim()});
                if(cObj == undefined){
                    mcqdbobj.conceptCode[i] = mcqcodes[i];
                }
                else{
                    mcqdbobj.conceptId[i] = cObj._id;
                    //mcqdbobj.conceptId[i] = conceptArray[i];
                    mcqdbobj.conceptCode[i] = cObj.conceptCode;
                }
            }
        }
        else if (element.search("Question:") != -1) {
            keyvalue = element.split("Question:");
            mcqdbobj.content[0].questionContent = keyvalue[1].trim();
        }
        else if (element.search("Solution:") != -1) {
            keyvalue = element.split("Solution:");
            mcqdbobj.content[0].solutionContent = keyvalue[1].trim();
        }
        else if (element.search("Hint:") != -1) {
            keyvalue = element.split("Hint:");
            mcqdbobj.content[0].questionHints = keyvalue[1].trim();
        }
        else if (element.search("Answer:") != -1) {
            keyvalue = element.split("Answer:");
            mcqdbobj.content[0].correctAnswer.answerType = "id";
            if(keyvalue[1].search(',')!=-1){
                var ansArray = keyvalue[1].split(',');
                ansArray.forEach(function(ans){
                    var dataObj ={value:titleCase(ans.replace(/<[^>]*>/g, '').trim())};
                    mcqdbobj.content[0].correctAnswer.data.push(dataObj);
                })
            }
            else{
                var dataObj ={value:titleCase(keyvalue[1].replace(/<[^>]*>/g, '').trim())};
                mcqdbobj.content[0].correctAnswer.data.push(dataObj);
            }
        }
        else if(element.search("QuestionSerialNo:") != -1){
            keyvalue = element.replace(/<[^>]*>/g, '').split("QuestionSerialNo:");
            sNo = parseInt(keyvalue[1].trim());
        }
        else {
            for (var i = 1; i < 10; i++) {
                var optionobj = {};
                if (element.search("Option" + i + ":") != -1) {
                    keyvalue = element.split("Option" + i + ":");
                    optionobj["id"] = "Option" + i;
                    optionobj["serialNo"] = i;
                    optionobj["value"] = keyvalue[1].trim();
                    mcqdbobj.content[0].optionsContent.push(optionobj);
                }
            }
        }
    })
    //console.log(mcqdbobj);
    //console.dir(mcqdbobj, { depth: null })
    dbsave(mcqdbobj,sNo);
}

var smcq = function (mcqobj, conceptArray,conceptsObjArray, dbsave) {
    var mcqdbobj = {
        questionType: "SMCQ",
        questionCode:0,
        level: "",
        tags: [],
        conceptId: [],
        conceptCode:[],
        content: [{
            locale: "en-us",
            questionContent: "",
            optionsContent: [],
            solutionContent: "",
            questionHints: "",
            correctAnswer: {
                answerType: "",
                data: []
            }
        }]
    };
    var sNo = 0;
    if(conceptArray.length !=0 ){
        for(i=0;i<conceptArray.length;i++){
            mcqdbobj.conceptId[i]=conceptArray[i]._id;
            mcqdbobj.conceptCode[i]=conceptArray[i].conceptCode;
        }
    }
    mcqobj.forEach(function (element) {
        //console.log(element);
        //keyvalue = element.split(':');
        if (element.search("Level:") != -1) {
            keyvalue = element.split("Level:");
            mcqdbobj.level = keyvalue[1].replace(/<[^>]*>/g, '').trim();
        }
        else if (element.search("Tags:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split('Tags:');
            mcqtags = keyvalue[1].split(",");
            for (var i = 0; i < mcqtags.length; i++) {
                mcqdbobj.tags[i] = mcqtags[i].trim();
            }
        }
        else if (element.search("ConceptIds:") != -1) {
            mcqdbobj.conceptCode=[];
            mcqdbobj.conceptId=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            mcqconcepts = keyvalue[1].split(",");
            for (var i = 0; i < mcqconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': mcqconcepts[i].trim()});
                if(cObj == undefined){
                    console.log('conceptId not found',mcqconcepts[i]);
                }
                else{
                    mcqdbobj.conceptId[i] = cObj._id;
                    mcqdbobj.conceptCode[i] = cObj.conceptCode;
                   // mcqdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            mcqdbobj.conceptCode=[];
            mcqdbobj.conceptId=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            mcqcodes = keyvalue[1].split(",");
            for (var i = 0; i < mcqcodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': mcqcodes[i].trim()});
                if(cObj == undefined){
                    mcqdbobj.conceptCode[i] = mcqcodes[i];
                }
                else{
                    mcqdbobj.conceptId[i] = cObj._id;
                    //mcqdbobj.conceptId[i] = conceptArray[i];
                    mcqdbobj.conceptCode[i] = cObj.conceptCode;
                }
            }
        }
        else if (element.search("Question:") != -1) {
            keyvalue = element.split("Question:");
            mcqdbobj.content[0].questionContent = keyvalue[1].trim();
        }
        else if (element.search("Solution:") != -1) {
            keyvalue = element.split("Solution:");
            mcqdbobj.content[0].solutionContent = keyvalue[1].trim();
        }
        else if (element.search("Hint:") != -1) {
            keyvalue = element.split("Hint:");
            mcqdbobj.content[0].questionHints = keyvalue[1].trim();
        }
        else if (element.search("Answer:") != -1) {
            keyvalue = element.split("Answer:");
            mcqdbobj.content[0].correctAnswer.answerType = "id";
            if(keyvalue[1].search(',')!=-1){
                mcqdbobj.questionCode = 8;
                var ansArray = keyvalue[1].split(',');
                ansArray.forEach(function(ans){
                    var dataObj ={value:titleCase(ans.replace(/<[^>]*>/g, '').trim())};
                    mcqdbobj.content[0].correctAnswer.data.push(dataObj);
                })
            }
            else{
            var dataObj ={value:titleCase(keyvalue[1].replace(/<[^>]*>/g, '').trim())};
            mcqdbobj.content[0].correctAnswer.data.push(dataObj);
            }
        }
        else if(element.search("QuestionSerialNo:") != -1){
            keyvalue = element.replace(/<[^>]*>/g, '').split("QuestionSerialNo:");
            sNo = parseInt(keyvalue[1].trim());
        }
        else {
            for (var i = 1; i < 10; i++) {
                var optionobj = {};
                if (element.search("Option" + i + ":") != -1) {
                    keyvalue = element.split("Option" + i + ":");
                    optionobj["id"] = "Option" + i;
                    optionobj["serialNo"] = i;
                    optionobj["value"] = keyvalue[1].trim();
                    mcqdbobj.content[0].optionsContent.push(optionobj);
                }
            }
        }
    })
    //console.log(mcqdbobj);
    //console.dir(mcqdbobj, { depth: null })
    dbsave(mcqdbobj,sNo);
}

var matrix = function (matrixobj, conceptArray,conceptsObjArray, dbsave) {
    var matrixdbobj = {
        //Why no number of questions here. Rules in question paper will conflict here
        tags: [],
        questionType: "Matrix",
        questionCode:1,
        level: "",
        conceptId: [],
        conceptCode:[],
        content: [{
            locale: "en-us",
            questionContent: "",
            matrixOptionContent: { optionLeft: [], optionRight: [] },
            solutionContent: "",
            questionHints: "",
            correctAnswer: { answerType: "", data: [] }
        }]
    };
    var sNo = 0;
    if(conceptArray.length !=0 ){
        for(i=0;i<conceptArray.length;i++){
            matrixdbobj.conceptId[i]=conceptArray[i]._id;
            matrixdbobj.conceptCode[i]=conceptArray[i].conceptCode;
        }
    }
    matrixobj.forEach(function (element) {
        //keyvalue = element.split(':');

        if (element.search("Level:") != -1) {
            keyvalue = element.split("Level:");
            matrixdbobj.level = keyvalue[1].replace(/<[^>]*>/g, '').trim();
        }
        else if (element.search("Tags:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split("Tags:");
            matrixtags = keyvalue[1].split(",");
            for (var i = 0; i < matrixtags.length; i++) {
                matrixdbobj.tags[i] = matrixtags[i].trim();
            }
        }
        else if (element.search("ConceptIds:") != -1) {
            matrixdbobj.conceptId =[];
            matrixdbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            matrixconcepts = keyvalue[1].split(",");
            for (var i = 0; i < matrixconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': matrixconcepts[i].trim()});
                if(cObj == undefined){
                    console.log('conceptId not found',matrixconcepts[i]);
                }
                else{
                    matrixdbobj.conceptId[i] = cObj._id;
                    matrixdbobj.conceptCode[i] = cObj.conceptCode;
                    matrixdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            matrixdbobj.conceptId =[];
            matrixdbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            matrixcodes = keyvalue[1].split(",");
            for (var i = 0; i < matrixcodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': matrixcodes[i].trim()});
                if(cObj == undefined){
                    matrixdbobj.conceptCode[i] = matrixcodes[i];
                }
                else{
                    matrixdbobj.conceptId[i] = cObj._id;
                    matrixdbobj.conceptCode[i] = cObj.conceptCode;
                    matrixdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("Question:") != -1) {
            keyvalue = element.split("Question:");
            matrixdbobj.content[0].questionContent = keyvalue[1].trim();
        }
        else if (element.search("Solution:") != -1) {
            keyvalue = element.split("Solution:");
            matrixdbobj.content[0].solutionContent = keyvalue[1].trim();
        }
        else if (element.search("Hint:") != -1) {
            keyvalue = element.split("Hint:");
            matrixdbobj.content[0].questionHints = keyvalue[1].trim();
        }
        else if (element.search("Answer:") != -1) {
            keyvalue = element.split("Answer:");
            matrixdbobj.content[0].correctAnswer.answerType = "id";
            answerArray = keyvalue[1].split(",");
            answerArray.forEach(function (ans) {
                tempAns = ans.split("-&gt;");
                var weightage = 2;//tempAns[1].split("%")[1];
                console.log(tempAns[1]);
                var value = tempAns[1].split("&amp;&amp;");
                var answerobj = { id: "", value: [], weightage: 0 };
                answerobj["id"] = tempAns[0].replace(/<[^>]*>/g, '').trim();
                value.forEach(function (val) {
                    answerobj["value"].push(val.replace(/<[^>]*>/g, '').trim());
                });
                answerobj["weightage"] = weightage;
                matrixdbobj.content[0].correctAnswer.data.push(answerobj);
            })
        }
        else if(element.search("QuestionSerialNo:") != -1){
            keyvalue = element.split("QuestionSerialNo:");
            sNo = parseInt(keyvalue[1].replace(/<[^>]*>/g, '').trim());
        }
        else {
            for (var i = 1; i < 10; i++) {
                var optionobj = {};
                if (element.search("Left" + i + ":") != -1) {
                    keyvalue = element.split("Left" + i + ":");
                    optionobj["id"] = "Left" + i;
                    optionobj["serialNo"] = i;
                    optionobj["value"] = keyvalue[1].trim();
                    matrixdbobj.content[0].matrixOptionContent.optionLeft.push(optionobj);
                }

                if (element.search("Right" + i + ":") != -1) {
                    keyvalue = element.split("Right" + i + ":");
                    optionobj["id"] = "Right" + i;
                    optionobj["serialNo"] = i;
                    optionobj["value"] = keyvalue[1].trim();
                    matrixdbobj.content[0].matrixOptionContent.optionRight.push(optionobj);
                }
            }
        }
    })
    //console.dir(matrixdbobj,{depth: null});
    dbsave(matrixdbobj,sNo);
}

var torf = function (torfobj, conceptArray, dbsave) {
    var torfdbobj = {
        questionType: "True-False",
        questionCode:2,
        level: "",
        tags: [],
        conceptId: [],
        conceptCode:[],
        content: [{
            locale: "",
            questionContent: "",
            optionsContent: [],
            solutionContent: "",
            questionHints: "",
            correctAnswer: {
                answerType: "",
                data: []
            }
        }]
    };
    var sNo = 0;
    if(conceptArray.length !=0 ){
        for(i=0;i<conceptArray.length;i++){
            torfdbobj.conceptId[i]=conceptArray[i]._id;
            torfdbobj.conceptCode[i]=conceptArray[i].conceptCode;
        }
    }
    torfobj.forEach(function (element) {
        //keyvalue = element.split(':');

        if (element.search("Level:") != -1) {
            keyvalue = elemet.split("Level:")
            torfdbobj.level = keyvalue[1].replace(/<[^>]*>/g, '').trim();
        }
        else if (element.search("Tags:") != -1) {
            keyvalue = element.split('Tags:');
            torftags = keyvalue[1].replace(/<[^>]*>/g, '').split(",");
            for (var i = 0; i < torftags.length; i++) {
                torfdbobj.tags[i] = torftags[i].trim();
            }
        }
        else if (element.search("ConceptIds:") != -1) {
            torfdbobj.conceptId=[];
            torfdbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            torfconcepts = keyvalue[1].split(",");
            for (var i = 0; i < torfconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': torfconcepts[i].trim()});
                if(cObj == undefined){
                    console.log('conceptId not found',torfconcepts[i]);
                }
                else{
                    torfdbobj.conceptId[i] = cObj._id;
                    torfdbobj.conceptCode[i] = cObj.conceptCode;
                    torfdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            torfdbobj.conceptId=[];
            torfdbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            torfcodes = keyvalue[1].split(",");
            for (var i = 0; i < torfcodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': torfcodes[i].trim()});
                if(cObj == undefined){
                    torfdbobj.conceptCode[i] = torfcodes[i];
                }
                else{
                    torfdbobj.conceptId[i] = cObj._id;
                    torfdbobj.conceptCode[i] = cObj.conceptCode;
                    torfdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("Question:") != -1) {
            keyvalue = element.split("Question:");
            torfdbobj.content[0].questionContent = keyvalue[1].trim();
        }
        else if (element.search("Solution:") != -1) {
            keyvalue = element.split("Solution:");
            torfdbobj.content[0].solutionContent = keyvalue[1].trim();
        }
        else if (element.search("Hint:") != -1) {
            keyvalue = element.split("Hint:");
            torfdbobj.content[0].questionHints = keyvalue[1].trim();
        }
        else if (element.search("Answer:") != -1) {
            keyvalue = element.split("Answer:");
            torfdbobj.content[0].correctAnswer.answerType = "id";
            var ansObj = {value:titleCase(keyvalue[1].replace(/<[^>]*>/g, '').replace(":",'').trim())};
            torfdbobj.content[0].correctAnswer.data.push(ansObj);
        }
        else if(element.search("QuestionSerialNo:") != -1){
            keyvalue = element.split("QuestionSerialNo:");
            sNo = parseInt(keyvalue[1].replace(/<[^>]*>/g, '').trim());
        }
        else {
            for (var i = 1; i < 10; i++) {
                var optionobj = {};
                if (element.search("Option" + i + ":") != -1) {
                    keyvalue = element.split("Option" + i + ":");
                    optionobj["id"] = "Option" + i;
                    optionobj["serialNo"] = i;
                    optionobj["value"] = keyvalue[1].trim();
                    torfdbobj.content[0].optionsContent.push(optionobj);
                }
            }
        }
    })
    //console.log(mcqdbobj);
    //console.dir(torfdbobj, { depth: null });
    dbsave(torfdbobj,sNo);
}

var blanks = function (blankobj, conceptArray, dbsave) {
    var blankdbobj = {
        questionType: "Blanks",
        questionCode:3,
        level: "",
        tags: [],
        conceptId: [],
        conceptCode:[],
        content: [{
            locale: "en-us",
            questionContent: "",
            solutionContent: "",
            questionHints: "",
            correctAnswer: {
                answerType: "value",
                data: []
            }
        }]
    };
    var sNo = 0 ;
    if(conceptArray.length !=0 ){
        for(i=0;i<conceptArray.length;i++){
            blankdbobj.conceptId[i]=conceptArray[i]._id;
            blankdbobj.conceptCode[i]=conceptArray[i].conceptCode;
        }
    }
    blankobj.forEach(function (element) {
        //keyvalue = element.split(':');

        if (element.search("Level:") != -1) {
            keyvalue = element.split("Level:");
            blankdbobj.level = keyvalue[1].replace(/<[^>]*>/g, '').trim();
        }
        else if (element.search("Tags:") != -1) {
            keyvalue = element.split('Tags:');
            blanktags = keyvalue[1].replace(/<[^>]*>/g, '').split(",");
            for (var i = 0; i < blanktags.length; i++) {
                blankdbobj.tags[i] = blanktags[i].trim();
            }
        }
        else if (element.search("ConceptIds:") != -1) {
            blankdbobj.conceptId=[];
            blankdbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            blankconcepts = keyvalue[1].split(",");
            for (var i = 0; i < blankconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': blankconcepts[i].trim()});
                if(cObj == undefined){
                    console.log('conceptId not found',blankconcepts[i]);
                }
                else{
                    blankdbobj.conceptId[i] = cObj._id;
                    blankdbobj.conceptCode[i] = cObj.conceptCode;
                    blankdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            blankdbobj.conceptId=[];
            blankdbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            blankcodes = keyvalue[1].split(",");
            for (var i = 0; i < blankcodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': blankcodes[i].trim()});
                if(cObj == undefined){
                    blankdbobj.conceptCode[i] = blankcodes[i];
                }
                else{
                    blankdbobj.conceptId[i] = cObj._id;
                    blankdbobj.conceptCode[i] = cObj.conceptCode;
                    blankdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("Question:") != -1) {
            keyvalue = element.split("Question:");
            blankdbobj.content[0].questionContent = keyvalue[1].trim();
        }
        else if (element.search("Solution:") != -1) {
            keyvalue = element.split("Solution:");
            blankdbobj.content[0].solutionContent = keyvalue[1].trim();
        }
        else if (element.search("Hint:") != -1) {
            keyvalue = element.split("Hint:");
            blankdbobj.content[0].questionHints = keyvalue[1].trim();
        }
        else if(element.search("QuestionSerialNo:") != -1){
            keyvalue = element.split("QuestionSerialNo:");
            sNo = parseInt(keyvalue[1].replace(/<[^>]*>/g, '').trim());
        }
        else if (element.search("Answer:") != -1) {
            keyvalue = element.split("Answer:");
            blankdbobj.content[0].correctAnswer.answerType = "value";
            answerArray = keyvalue[1].split("&amp;&amp;");
            answerArray.forEach(function (ans) {
                var weightage = ans.split("%")[1];
                var value = ans.split("%")[0];
                var answerobj = { id: "", value: [], weightage: 0 };
                var value = ans.split("%")[0];
                answerobj["id"] = ans.split("%")[0].trim();
                answerobj["value"].push(value.trim());
                answerobj["weightage"] = weightage.trim();
                blankdbobj.content[0].correctAnswer.data.push(answerobj);
            })
        }
    })
    dbsave(blankdbobj,sNo);
}

var descriptive = function (descriptiveobj, conceptArray, dbsave) {
    var descriptivedbobj = {
        questionType: "Descriptive",
        questionCode:4,
        level: "",
        conceptId: [],
        conceptCode:[],
        tags: [],
        content: [{
            locale: "en-us",
            questionContent: "",
            questionHints: "",
        }]
    };
    var sNo = 0;
    if(conceptArray.length !=0 ){
        for(i=0;i<conceptArray.length;i++){
            descriptivedbobj.conceptId[i]=conceptArray[i]._id;
            descriptivedbobj.conceptCode[i]=conceptArray[i].conceptCode;
        }
    }
    descriptiveobj.forEach(function (element) {
        //keyvalue = element.split(':');

        if (element.search("Level:") != -1) {
            keyvalue = element.split("Level:");
            descriptivedbobj.level = keyvalue[1].replace(/<[^>]*>/g, '').trim();
        }
        else if (element.search("Tags:") != -1) {
            keyvalue = element.split('Tags:');
            descriptivetags = keyvalue[1].replace(/<[^>]*>/g, '').split(",");
            for (var i = 0; i < descriptivetags.length; i++) {
                descriptivedbobj.tags[i] = descriptivetags[i].trim();
            }
        }
        else if (element.search("ConceptIds:") != -1) {
            descriptivedbobj.conceptId=[];
            descriptivedbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            descriptiveconcepts = keyvalue[1].split(",");
            for (var i = 0; i < descriptiveconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': descriptiveconcepts[i].trim()});
                if(cObj == undefined){
                    console.log('conceptId not found',descriptiveconcepts[i]);
                }
                else{
                    descriptivedbobj.conceptId[i] = cObj._id;
                    descriptivedbobj.conceptCode[i] = cObj.conceptCode;
                    descriptivedbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            descriptivedbobj.conceptId=[];
            descriptivedbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            descriptivecodes = keyvalue[1].split(",");
            for (var i = 0; i < descriptivecodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': descriptivecodes[i].trim()});
                if(cObj == undefined){
                    descriptivedbobj.conceptCode[i] = descriptivecodes[i];
                }
                else{
                    descriptivedbobj.conceptId[i] = cObj._id;
                    descriptivedbobj.conceptCode[i] = cObj.conceptCode;
                    descriptivedbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("Question:") != -1) {
            keyvalue = element.split("Question:");
            descriptivedbobj.content[0].questionContent = keyvalue[1].trim();
        }
        else if (element.search("Hint:") != -1) {
            keyvalue = element.split("Hint:");
            descriptivedbobj.content[0].questionHints = keyvalue[1].trim();
        }
        else if(element.search("QuestionSerialNo:") != -1){
            keyvalue = element.split("QuestionSerialNo:");
            sNo = parseInt(keyvalue[1].replace(/<[^>]*>/g, '').trim());
        }
    })
    dbsave(descriptivedbobj,sNo);
}

var passage = function (passageobj, conceptArray,conceptsObjArray, dbsave) {
    subQuestionArray = passageobj.split("####SubQuestionType:");
    //subQuestionArray[0].split("#")[2].split(":")[1].trim(), 3rd element is number of question
    //subQuestionArray[0].split("#")[1].split(":")[1].trim(), 2nd element is passage
    var passagedbobj = {
        questionType: "Passage",
        questionCode:0,
        level: "",
        passageId:"",
        totalQuestion: 0,
        tags: [],
        conceptId: [],
        conceptCode:[],
        content: [{
            passageQuestion:"",
            locale: ""
        }]
    };
    var sNo = 0;
    var passageId = uuidv4();
    var paragraph = "";
    //console.log(subQuestionArray[0].split("#"));
    var passageDetails = subQuestionArray[0].split("####");
    var passagedbobjArray =[];
    passageDetails.forEach(function (element) {
        if (element.search("Paragraph:") != -1) {
            data = element.split("Paragraph:");
            paragraph = data[1].trim();
        }
        else if (element.search("TotalQuestions:") != -1) {
            data = element.split("TotalQuestions:");
            passagedbobj.totalQuestion = parseInt(data[1].replace(/<[^>]*>/g, '').trim());
        }
        else if (element.search("ConceptIds:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            passageconcepts = keyvalue[1].split(",");
            for (var i = 0; i < passageconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': passageconcepts[i].trim()});
                if(cObj == undefined){
                    console.log('conceptId not found',passageconcepts[i]);
                }
                else{
                    passagedbobj.conceptId[i] = cObj._id;
                    passagedbobj.conceptCode[i] = cObj.conceptCode;
                    passagedbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            passagecodes = keyvalue[1].split(",");
            for (var i = 0; i < passagecodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': passagecodes[i].trim()});
                if(cObj == undefined){
                    passagedbobj.conceptCode[i] = passagecodes[i];
                }
                else{
                    passagedbobj.conceptId[i] = cObj._id;
                    passagedbobj.conceptCode[i] = cObj.conceptCode;
                    passagedbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
    })
    //subQuestions[0] is the details about passage question
    for (var i = 1; i < subQuestionArray.length; i++) {
        subQuestion = subQuestionArray[i].split("####");
        if (["SMCQ", "MMCQ"].includes(subQuestion[0].replace(/<[^>]*>/g, '').trim())) {
            mcq(subQuestion, conceptArray,conceptsObjArray, function (returnObj,sNo) {
                passagedbobj=_.extend(returnObj);
                passagedbobj.passageId=passageId;
                passagedbobj.content[0].passageQuestion = paragraph;
                var passageArrayobj = {sNo:sNo,question:passagedbobj};
                passagedbobjArray.push(passageArrayobj);
            })
        }
        else if (subQuestion[0].replace(/<[^>]*>/g, '').trim() == "Matrix") {
            matrix(subQuestion, conceptArray,conceptsObjArray, function (returnObj,sNo) {
                passagedbobj=_.extend(returnObj);
                passagedbobj.passageId=passageId;
                passagedbobj.content[0].passageQuestion = paragraph;
                var passageArrayobj = {sNo:sNo,question:passagedbobj};
                passagedbobjArray.push(passageArrayobj);
            })
        }
        else if (subQuestion[0].replace(/<[^>]*>/g, '').trim() == "True-False") {
            torf(subQuestion, conceptArray,conceptsObjArray, function (returnObj,sNo) {
                passagedbobj=_.extend(returnObj);
                passagedbobj.passageId=passageId;
                passagedbobj.content[0].passageQuestion = paragraph;
                var passageArrayobj = {sNo:sNo,question:passagedbobj};
                passagedbobjArray.push(passageArrayobj);
            })
        }
        else if (subQuestion[0].replace(/<[^>]*>/g, '').trim() == "Integer") {
            integer(subQuestion, conceptArray,conceptsObjArray, function (returnObj,sNo) {
                passagedbobj=_.extend(returnObj);
                passagedbobj.passageId=passageId;
                passagedbobj.content[0].passageQuestion = paragraph;
                var passageArrayobj = {sNo:sNo,question:passagedbobj};
                passagedbobjArray.push(passageArrayobj);
            });
        }
        else if (subQuestion[0].replace(/<[^>]*>/g, '').trim() == "Blanks") {
            blanks(subQuestion, conceptArray,conceptsObjArray, function (returnObj,sNo) {
                passagedbobj=_.extend(returnObj);
                passagedbobj.passageId=passageId;
                passagedbobj.content[0].passageQuestion = paragraph;
                var passageArrayobj = {sNo:sNo,question:passagedbobj};
                passagedbobjArray.push(passageArrayobj);
            });
        }
        else if (subQuestion[0].replace(/<[^>]*>/g, '').trim() == "Numerical") {
            numerical(subQuestion, conceptArray,conceptsObjArray, function (returnObj,sNo) {
                passagedbobj=_.extend(returnObj);
                passagedbobj.passageId=passageId;
                passagedbobj.content[0].passageQuestion = paragraph;
                var passageArrayobj = {sNo:sNo,question:passagedbobj};
                passagedbobjArray.push(passageArrayobj);
            });
        }
        else if (subQuestion[0].replace(/<[^>]*>/g, '').trim() == "Descriptive") {
            descriptive(subQuestion, conceptArray,conceptsObjArray, function (returnObj,sNo) {
                passagedbobj=_.extend(returnObj);
                passagedbobj.passageId=passageId;
                passagedbobj.content[0].passageQuestion = paragraph;
                var passageArrayobj = {sNo:sNo,question:passagedbobj};
                passagedbobjArray.push(passageArrayobj);
            });
        }
    }
    if(i==subQuestionArray.length) dbsave(passagedbobjArray);
    //dbsave(passagedbobj,sNo);
}

var numerical = function (numericalobj, conceptArray,conceptsObjArray, dbsave) {
    var numericaldbobj = {
        questionType: "Numerical",
        questionCode:6,
        level: "",
        tags: [],
        conceptId: [],
        conceptCode:[],
        content: [{
            locale: "en-us",
            questionContent: "",
            solutionContent: "",
            questionHints: "",
            correctAnswer: {
                answerType: "",
                data: []
            }
        }]
    };
    var sNo = 0;
    if(conceptArray.length !=0 ){
        for(i=0;i<conceptArray.length;i++){
            numericaldbobj.conceptId[i]=conceptArray[i]._id;
            numericaldbobj.conceptCode[i]=conceptArray[i].conceptCode;
        }
    }
    numericalobj.forEach(function (element) {
        //keyvalue = element.split(':');

        if (element.search("Level:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split("Level:");
            numericaldbobj.level = keyvalue[1].trim();
        }
        else if (element.search("Tags:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split('Tags:');
            numericaltags = keyvalue[1].split(",");
            for (var i = 0; i < numericaltags.length; i++) {
                numericaldbobj.tags[i] = numericaltags[i].trim();
            }
        }
        else if (element.search("ConceptIds:") != -1) {
            numericaldbobj.conceptId=[];
            numericaldbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            numericalconcepts = keyvalue[1].split(",");
            for (var i = 0; i < numericalconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': numericalconcepts[i].trim()});
                if(cObj == undefined){
                    console.log('conceptId not found',numericalconcepts[i]);
                }
                else{
                    numericaldbobj.conceptId[i] = cObj._id;
                    numericaldbobj.conceptCode[i] = cObj.conceptCode;
                    numericaldbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            numericaldbobj.conceptId=[];
            numericaldbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            numericalcodes = keyvalue[1].split(",");
            for (var i = 0; i < numericalcodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': numericalcodes[i].trim()});
                if(cObj == undefined){
                    numericaldbobj.conceptCode[i] = numericalcodes[i];
                }
                else{
                    numericaldbobj.conceptId[i] = cObj._id;
                    numericaldbobj.conceptCode[i] = cObj.conceptCode;
                    numericaldbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if(element.search("QuestionSerialNo:") != -1){
            keyvalue = element.replace(/<[^>]*>/g, '').split("QuestionSerialNo:");
            sNo = parseInt(keyvalue[1].trim());
        }
        else if (element.search("Question:") != -1) {
            keyvalue = element.split("Question:");
            numericaldbobj.content[0].questionContent = keyvalue[1].trim();
        }
        else if (element.search("Solution:") != -1) {
            keyvalue = element.split("Solution:");
            numericaldbobj.content[0].solutionContent = keyvalue[1].trim();
        }
        else if (element.search("Hint:") != -1) {
            keyvalue = element.split("Hint:");
            numericaldbobj.content[0].questionHints = keyvalue[1].trim();
        }
        else if (element.search("Answer:") != -1) {
            keyvalue = element.split("Answer:");
            numericaldbobj.content[0].correctAnswer.answerType = "value";
            if(keyvalue[1].search(":")!=-1){
                var values = keyvalue[1].split(":");
                var answerobj = {
                    value: values[0].split("{")[1],
                    tolerance: values[1].split("}")[0]
                };
                numericaldbobj.content[0].correctAnswer.data.push(answerobj);
            }
            else{
                var ansObj = {value:keyvalue[1].replace(/<[^>]*>/g, '').trim()};
                numericaldbobj.content[0].correctAnswer.data.push(ansObj);
            }
        }
    })
    //console.log(mcqdbobj);
    dbsave(numericaldbobj,sNo);
}

var integer = function (integerobj, conceptArray,conceptsObjArray, dbsave) {
    var integerdbobj = {
        questionType: "Integer",
        questionCode:7,
        level: "",
        tags: [],
        conceptId: [],
        conceptCode:[],
        content: [{
            locale: "en-us",
            questionContent: "",
            //optionsContent: [],
            solutionContent: "",
            questionHints: "",
            correctAnswer: {
                answerType: "value",
                data: []
            }
        }]
    };
    var sNo = 0;
    if(conceptArray.length !=0 ){
        for(i=0;i<conceptArray.length;i++){
            integerdbobj.conceptId[i]=conceptArray[i]._id;
            integerdbobj.conceptCode[i]=conceptArray[i].conceptCode;
        }
    }
    integerobj.forEach(function (element) {
        //keyvalue = element.split(':');

        if (element.search("Level:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split("Level:");
            integerdbobj.level = keyvalue[1].trim();
        }
        else if (element.search("Tags:") != -1) {
            keyvalue = element.replace(/<[^>]*>/g, '').split('Tags:');
            integertags = keyvalue[1].split(",");
            for (var i = 0; i < integertags.length; i++) {
                integerdbobj.tags[i] = integertags[i].trim();
            }
        }
        else if (element.search("ConceptIds:") != -1) {
            integerdbobj.conceptId=[];
            integerdbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptIds:');
            integerconcepts = keyvalue[1].split(",");
            for (var i = 0; i < integerconcepts.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': integerconcepts[i].trim()});
                if(cObj==undefined){
                    console.log('conceptId not found',integerconcepts[i]);
                }
                else{
                    integerdbobj.conceptId[i] = cObj._id;
                    integerdbobj.conceptCode[i] = cObj.conceptCode;
                    integerdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("ConceptCode:") != -1) {
            integerdbobj.conceptId=[];
            integerdbobj.conceptCode=[];
            keyvalue = element.replace(/<[^>]*>/g, '').split('ConceptCode:');
            integercodes = keyvalue[1].split(",");
            for (var i = 0; i < integercodes.length; i++) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': integercodes[i].trim()});
                if(cObj==undefined){
                    integerdbobj.conceptCode[i] = integercodes[i];
                }
                else{
                    integerdbobj.conceptId[i] = cObj._id;
                    integerdbobj.conceptCode[i] = cObj.conceptCode;
                    integerdbobj.conceptId[i] = conceptArray[i];
                }
            }
        }
        else if (element.search("Question:") != -1) {
            keyvalue = element.split("Question:");
            integerdbobj.content[0].questionContent = keyvalue[1].trim();
        }
        else if(element.search("QuestionSerialNo:") != -1){
            keyvalue = element.split("QuestionSerialNo:");
            sNo = parseInt(keyvalue[1].replace(/<[^>]*>/g, '').trim());
        }
        else if (element.search("Solution:") != -1) {
            keyvalue = element.split("Solution:");
            integerdbobj.content[0].solutionContent = keyvalue[1].trim();
        }
        else if (element.search("Hint:") != -1) {
            keyvalue = element.split("Hint:");
            integerdbobj.content[0].questionHints = keyvalue[1].trim();
        }
        else if (element.search("Answer:") != -1) {
            keyvalue = element.split("Answer:");
            var ansObj = {value:parseInt(keyvalue[1].replace(/<[^>]*>/g, '').trim())};
            integerdbobj.content[0].correctAnswer.data.push(ansObj);
        }
    })
    //console.log(integerdbobj);
    dbsave(integerdbobj,sNo);
}

var createTestObj = function (test,testData, noOfSections,conceptsObjArray, testObj) {
    var conceptArray = [];
    test.data.noOfSections = noOfSections;
    tempTestArray = testData.split("####");
    tempTestArray.forEach(function (element) {
        //var data = element.split(":");
        /*if (element.search("TestName:") != -1) {
            data = element.split("TestName:");
            test.name = data[1].replace(/<[^>]*>/g, '').trim();
        }
        else */if (element.search("Time:") != -1) {
            data = element.split("Time:");
            test.settings.duration = data[1].replace(/<[^>]*>/g, '').trim().split(" ")[0];
        }
        else if (element.search("Language:") != -1) {
            data = element.split("Language:");
            test.settings.language.push(data[1].trim());
        }
        else if (element.search("Attempts:") != -1) {
            data = element.split("Attempts:");
            test.settings.noOfAttempts = parseInt(data[1].replace(/<[^>]*>/g, '').trim(), 10);
        }
        else if (element.search("TestPause:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("TestPause:");
            test.settings.pause = data[1].trim();
        }
        else if (element.search("Review:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("Review:");
            test.settings.reviewAttempts = data[1].trim();
        }
        else if (element.search("ShowCorrectAnswers:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("ShowCorrectAnswers:");
            test.settings.showCorrectAnswers = data[1].trim();
        }
        else if (element.search("SectionShuffle:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("SectionShuffle:");
            //test.settings.shuffle={};
            test.settings.shuffle.sections = data[1].trim();
        }
        else if (element.search("QuestionShuffle:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("QuestionShuffle:");
            //test.settings.shuffle={};
            test.settings.shuffle.questions = data[1].trim();
        }
        else if (element.search("AnswerShuffle:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("AnswerShuffle:");
            //test.settings.shuffle={};
            test.settings.shuffle.answer = data[1].trim();
        }
        // else if (element.search("Syllabus:") != -1) {
        //     data = element.split("Syllabus:");
        //     test.syllabus.text = data[1].trim();
        // }
        // else if (element.search("StartDate:") != -1) {
        //     data = element.replace(/<[^>]*>/g, '').split("StartDate:");
        //     var startdate = data[1].trim().replace(/\//g, "-");
        //     var sdate = new Date();
        //     startdate = startdate.split("-");
        //     sdate.setDate(parseInt(startdate[0]));
        //     sdate.setMonth(parseInt(startdate[1]));
        //     sdate.setFullYear(parseInt(startdate[2]));
        //     test.settings.validity.startDate = sdate;
        // }
        // else if (element.search("EndDate:") != -1) {
        //     data = element.replace(/<[^>]*>/g, '').split("EndDate:");
        //     var enddate = data[1].trim().replace(/\//g, "-");
        //     var edate = new Date();
        //     enddate = enddate.split("-");
        //     edate.setDate(enddate[0]);
        //     edate.setMonth(enddate[1]);
        //     edate.setFullYear(enddate[2]);
        //     test.settings.validity.endDate = edate;
        // }
        // else if (element.search("TestType:") != -1) {
        //     data = element.split("TestType:");
        //     test.settings.testType = data[1].replace(/<[^>]*>/g, '').trim();
        // }
        else if (element.search("ConceptIds:") != -1 && test.settings.testType && test.settings.testType.toLowerCase() == "concept") {
            conceptId = element.replace(/<[^>]*>/g, '').split("ConceptIds:");
            conceptIdArray = conceptId[1].split(",");
            conceptIdArray.forEach(function (concept) {
                var cObj = _.find(conceptsObjArray,{ 'conceptId': concept});
                conceptArray.push(cObj);
            })
        }
        else if (element.search("ConceptCode:") != -1 && test.settings.testType && test.settings.testType.toLowerCase() == "concept") {
            conceptCode = element.replace(/<[^>]*>/g, '').split("ConceptCode:");
            conceptCodeArray = conceptCode[1].split(",");
            conceptCodeArray.forEach(function (concept) {
                var cObj = _.find(conceptsObjArray,{ 'conceptCode': concept});
                conceptArray.push(cObj);
            })
        }
    })
    var uconceptArray = Array.from(new Set(conceptArray));
    testObj(test, uconceptArray);
}

var createCourseObj = function (testData, test, courseObj) {
    //console.log(testData);
    var courseItem = new CourseItem();

    if (test.settings.testType && test.settings.testType.toLowerCase() == "concept") {
        courseItem.itemType = "Test Group";
        var tests = {
            testId: test._id,
            displayName: test.name,
            codeName: [],
            duration: test.settings.duration,
            courseConcepts: []
        };
        //console.log(testData);
        tempTestArray = testData.split("####");
        //console.log(tempTestArray.length);
        async.eachSeries(tempTestArray, function (element, nexttest) {
            //console.log("element",element);
            if (element.search("ConceptCode:") != -1) {
                var data = element.replace(/<[^>]*>/g, '').split("ConceptCode:")[1].split(',');
                data.forEach(function (codeData) {
                    tests.codeName.push(codeData);
                })
                nexttest(null);
            }
            else if (element.search("ConceptIds:") != -1) {
                var conceptIds = element.replace(/<[^>]*>/g, '').split("ConceptIds:")[1].split(',');
                async.eachSeries(conceptIds, function (conceptId, nextConcept) {
                    // Concept.find({_id:conceptId}).lean().exec(function(err,conceptData){
                    //     if(err){
                    //         nextConcept(err);
                    //     }
                    //     else{
                    //         var concepts = {
                    //             id: conceptId,
                    //             name: conceptData.conceptName
                    //         }
                    //         tests.courseConcepts.push(concepts);
                    //         nextConcept(null);
                    //     }
                    //})
                    nextConcept(null);
                }, function (err) {
                    if (err) nexttest(err)
                    else nexttest(null);
                })
            }
            else {
                nexttest(null);
            }
        }, function (err) {
            if (err) {
                courseObj(err);
            }
            else {
                courseItem.details.tests.push(tests);
                dsl.saveCourseFunc(courseItem,function(err){
                    if(!err){
                        console.log(courseItem._id);
                    }
                    else{
                        console.log("err",err);
                    }
                })
                //courseItem.save();
                courseObj(null);
            }
        })

        // add the cocept Id and name thing here and callback inside the db hit 
        // console.log(courseItem);
        // console.log(courseItem.details);
    }
    else {
        courseItem.itemType = "Scheduled Tests";
        var schedule = {
            scheduleId: [],
            scheduleDate: "",
            scheduleTime: 0,
            displayName: "",
            codeName: "",
            status: "",
            duration: test.settings.duration,
            paperDetail: {
                id: test._id,
                name: test.name,
                type: test.settings.testType,
                syllabus: test.syllabus
            }
        };
        tempTestArray = testData.split("####");
        tempTestArray.forEach(function (element) {
            if (element.search("ScheduleId:") != -1) {
                var data = element.replace(/<[^>]*>/g, '').split("ScheduleId:")[1].split(',');
                data.forEach(function (scheduleData) {
                    schedule.scheduleId.push(scheduleData);
                })
            }
        })
        courseItem.details.schedule.push(schedule);
        dsl.saveCourseFunc(courseItem,function(err){
            if(!err){
                console.log(courseItem._id);
            }
            else{
                console.log("err",err);
            }
        })
        //courseItem.save();
        courseObj(null);
        // console.log(courseItem);
        // console.log(courseItem.details);
    }
}

var createSectionObj = function (sectionData, sectionObj) {
    var section = {
        name: "",
        sectionSerialNo: 0,
        subSection: []
    };
    sectionDataSeperated = sectionData.split("####");
    section.name = sectionDataSeperated[0].replace(/<[^>]*>/g, '');
    sectionDataSeperated.forEach(function (element) {
        if (element.search("SerialNo:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("SerialNo:");
            section.sectionSerialNo = parseInt(data[1].trim());
        }
    })
    sectionObj(section);
}

var createSubSectionObj = function (subsectionData, questionIdArray, subSectionObj) {
    var subsection = {
        name: "",
        noOfQuestions: questionIdArray.length,
        totalMarks: 0,
        positiveMarks: 0,
        negativeMarks: 0,
        subSectionSerialNo:0,
        questions: questionIdArray
    }
    sectionDataSeperated = subsectionData.split("####");
    subsection.name = sectionDataSeperated[0].replace(/<[^>]*>/g, '');
    sectionDataSeperated.forEach(function (element) {
        //var data = element.split(":");
        if (element.search("MarksPerQuestion:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("MarksPerQuestion:");
            subsection.totalMarks = questionIdArray.length * parseInt(data[1].trim());
            subsection.positiveMarks = parseInt(data[1].trim());
        }
        else if (element.search("NegativeMarks:") != -1) {
            data = element.replace(/<[^>]*>/g, '').split("NegativeMarks:");
            subsection.negativeMarks = parseInt(data[1].trim());
        }
        else if(element.search("SubSectionSerialNo:") !=-1){
            data = element.replace(/<[^>]*>/g, '').split("SubSectionSerialNo:");
            subsection.subSectionSerialNo = parseInt(data[1].trim());
        }
    })
    subSectionObj(subsection);
}

exports.generateConcept = function(simpleHtml,formatThird){
    var elementArray = simpleHtml.split('####');
    var conceptCodeArray=[];
    var conceptIdArray=[];
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
    //console.log("conceptCodeArray",conceptCodeArray.length);
    //console.log("conceptIdArray",conceptIdArray.length);
    //console.log("uConceptCodeArray",uConceptCodeArray.length);
    //console.log("uConceptIdArray",uConceptIdArray.length);
    if(uConceptIdArray.length==0 && uConceptCodeArray.length==0){
        formatThird('Zero conceptIds in file',null);
    }
    else{
        dsl.getConceptObj(uConceptCodeArray,uConceptIdArray, function(err,data){
            if(err){
                console.log(err);
                formatThird(err,null);
            }
            else{
                if(data.length==0){
                    formatThird('Concept not found in database',null);
                }
                // else if(uConceptIdArray.length!=data.length && uConceptCodeArray.length!=data.length){
                //     formatThird('No of concept mismatch in file and DB',null);
                // }
                else{
                    formatThird(null,data);
                }
            }
        })
    }
    // async.parallel([function (pdfcb) {
    //     dsl.getConceptObj(uConceptCodeArray, function (err, data) {
    //         if(err){
    //             pdfcb(err,null);
    //         }
    //         else{
    //             console.log('uConceptCodeArray->DB',data.length);
    //             pdfcb(null, data);
    //         }
    //     })
    // },
    // function (pdfcb) {
    //     dsl.getConceptIdObj(uConceptIdArray, function (err, data) {
    //         if(err){
    //             pdfcb(err,null);
    //         }
    //         else{
    //             console.log('uConceptIdArray->DB',data.length);
    //             pdfcb(null, data);
    //         }
    //     })
    // }], function (err, results) {
    //     if (err) {
    //         formatThird(err,null);
    //     }
    //     else {
    //         var finalConceptArray = [];
    //         finalConceptArray = finalConceptArray.concat(results[0]);
    //         finalConceptArray = finalConceptArray.concat(results[1]);
    //         console.log(results[0]);
    //         console.log(results[1]);
    //         var uFinalConceptArray = _.uniq(finalConceptArray);
    //         console.log('final',uFinalConceptArray);
    //         formatThird(null,finalConceptArray);
    //     }
    // });
}