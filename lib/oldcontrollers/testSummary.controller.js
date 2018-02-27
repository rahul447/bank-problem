/* eslint-disable */
var test = require('../endpoints/test/tests.model.js');
var async = require('async');
var TestSummary = require('../endpoints/testSummary/testSummary.model.js');
var Question = require('../endpoints/question/question.model.js');
var Course = require('../endpoints/course/course.model');
var CourseItems = require('../endpoints/courseItem/courseItem.model.js');
var CourseSyllabus = require('../endpoints/courseSyllabus/courseSyllabus.model');
var mongoose = require('mongoose');
var count = 0;
var totalCount = 0;
var success=0;
var request = require('request');
var _ = require('lodash');
var fs=require('fs');
var testId_courseId = [];
var csvWriter = require('csv-write-stream')
var writer = csvWriter()
function checkPaper(arrayObj, courseId, cb) {
    async.eachSeries(arrayObj, function (arrayel, testCallback) {
        
       // console.log(arrayel); 
        if(arrayel.paperDetail['id']== "undefined"){
            testCallback();
            return;
        }
        else{
            var testId = arrayel.paperDetail.id;
            //console.log("Herer",testId);
            if(typeof testId=="string"){
                testId = mongoose.Types.ObjectId(testId);
            }
           
           // console.log(testId);
        
            //console.log(testId);
            totalCount++;
            var obj = {
                'testId': testId,
                'courseId': courseId,
                "message":""
            };
            test.findOne({ _id: testId }, function (err, result) {
                if (err) {
                    console.log(err);
                    testCallback(err);
                }
                else {
                    if(result==null){
                        obj.message='wrong testId,Test NOT FOUND!';
                        testId_courseId.push(obj);
                        
                    testCallback();
                    }
                    //console.log(result===null,result.data);
                    else if (result && result.data && result.data.sections && result.data.sections.length) {
                        console.log('this test is uploaded -> ', count, " ,total count ->", totalCount,"test summary created count ",success);
                        console.log('testId->', testId, 'courseId->', courseId);
                        
                        count++;
                        //console.log(obj);
                        //testId_courseId.push(obj);
                        //console.log(result);
                        ///console.log(testId_courseId);
                        var endpoint = 'http://localhost:3021/createTestSummary';
    
                        request({
                            url: endpoint,
                            method: 'POST',
                            json: obj
                        },
                            function (error1, response1, body1) {
                                if(error1){
                                    console.log(error1);
                                }
                                else{
    
                                    console.log('success');
                                    obj.message=response1.body.message;
                                    testId_courseId.push(obj);
                                    if(response1.body.status==200)
                                    success++;
                                    console.log(testId_courseId);
                                }
                            });
                        
    
                    testCallback();
                    }
                    else {
                        console.log('test not uploaded yet');
                        obj.message='test not uploaded yet';
                        testId_courseId.push(obj);
    //                     console.log('******this test not uploaded yet*********, uploaded count-> ',count," total count ",totalCount,"test summary created count ",success);
                        
                    testCallback();
                        }
                }
            })
        }
        
    }, function (err) {
        if (err) {
            cb(err);
        }
        else {
            cb();
        }
    }
    );

}
module.exports = {
    /*
    Get testpaperSummary
    */
    forceEntry: function (req, res) {
        Course.find({}, { courseItems: 1 }, function (err, courseIdArray) {
            if (err) {
                res.send(err);
            }
            else {
              //  console.log('in course');
                //console.log(courseIdArray);
                //res.send(courseArray);
                async.eachSeries(courseIdArray, function (course, courseCallback) {
                    var courseId = course._id;
                   // console.log('courseId -> ',courseId);
                    var courseItemArray = course.courseItems;
                    async.eachSeries(courseItemArray, function (courseItemCourseObj, courseItemCourseObjCallback) {
                        var courseItemId = courseItemCourseObj.id;
                        CourseItems.find({ _id: courseItemId }, { details: 1 }, function (err, courseItems) {
                            if (err) {
                                courseItemCallback(err);
                            }
                            else {
                               // console.log('courseItems -> ',courseItems);
                                async.eachSeries(courseItems, function (courseItem, courseItemCallback) {
                                    var details = courseItem.details;
                                   // console.log('details -> ',details);
                                    if ('tests' in details && details.tests.length)
                                        checkPaper(details.tests, courseId, function (err) {
                                            if (err) {
                                                courseItemCallback(err);
                                            }
                                            else {
                                                courseItemCallback();
                                            }
                                        });
                                    else if ('schedule' in details&& details.schedule.length)
                                        checkPaper(details.schedule, courseId, function (err) {
                                            if (err) {
                                                courseItemCallback(err);
                                            }
                                            else {
                                                courseItemCallback();
                                            }
                                        });
                                    else if ('sampletests' in details && details.sampletests.length)
                                        checkPaper(details.sampletests, courseId, function (err) {
                                            if (err) {
                                                courseItemCallback(err);
                                            }
                                            else {
                                                courseItemCallback();
                                            }
                                        });
                                        else
                                            courseItemCallback();
                                }, function (err) {
                                    if (err) {
                                        courseItemCourseObjCallback(err);
                                    }
                                    else {
                                        courseItemCourseObjCallback();
                                    }
                                }
                                )

                            }
                        })
                    }, function (err) {
                        if (err) {
                            courseCallback(err);
                        }
                        else {
                            courseCallback();
                        }
                    }
                    )
                }, function (err) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        console.log('finished');
                        var writer = csvWriter()
                        writer.pipe(fs.createWriteStream('out.csv'))
                        for(var i=0;i<testId_courseId.length;i++){
                            var obj=testId_courseId[i];
                            writer.write(obj);
                            if(i==testId_courseId.length-1)
                                writer.end();
                        }
                        
                    }
                }
                )
                // for (i = 0; i < courseIdArray.length; i++) {
                //     console.log('in courseId array');
                //     var courseId = courseIdArray[i]._id;
                //     var courseItemArray = courseIdArray[i].courseItems;
                //     for (var j = 0; j < courseItemArray.length; j++) {
                //         if (courseItemArray[j].itemType != 'syllabus') {
                //             console.log(courseItemArray[j]);
                //             var courseItemId = courseItemArray[j].id;
                //             CourseItems.find({ _id: courseItemId }, { details: 1 }, function (err, courseItems) {
                //                 if (err) {

                //                 }
                //                 else {
                //                     console.log(courseItems);
                //                     for (var k = 0; k < courseItems.length; k++) {
                //                         if ('tests' in courseItems[k].details)
                //                             checkPaper(courseItems[k].details.tests, courseId);
                //                         if ('schedule' in courseItems[k].details, courseId)
                //                             checkPaper(courseItems[k].details.schedule, courseId);
                //                         if ('sampletests' in courseItems[k].details, courseId)
                //                             checkPaper(courseItems[k].details.sampletests, courseId);

                //                     }
                //                 }
                //             })
                //         }
                //     }
                // }

            }
        })
    },
    getTestSummary: function (req, res) {
        if (req.body.testId && req.body.courseId) {
            var testId = mongoose.Types.ObjectId(req.body.testId);
            var courseId = mongoose.Types.ObjectId(req.body.courseId);

            TestSummary.findOne({ testId: testId, courseId: courseId }, function (err, data) {
                if (err) {
                    return res.json({
                        'status': '404',
                        'message': "Error retrieving testSummary",
                        "error": err
                    });
                }
                else {
                    return res.json({
                        'status': '200',
                        'message': 'Request Successful',
                        'data': data
                    });
                }
            })
        }
        else {
            return res.json({
                'status': '404',
                'message': "Enter valid testId",
                "error": 'invalid data'
            });
        }
    },

    createTestSummary: function (req, res) {
        var testId = req.body.testId;
        testId = mongoose.Types.ObjectId(testId);
        console.log(testId);
        console.log(req.body.courseId);
        var calculatedTestSummary = {
            testId: req.body.testId,
            courseId: req.body.courseId,
            concepts: [],
            chapters: [],
            subjects: [],
            subSubjects: []
        }
        async.parallel([

            function (firstcb) {
                test.findOne({ '_id': testId }, function (err, data) {
                    if (err) {
                        firstcb(err);
                    }
                    else {
                        if (data == null) {
                            firstcb('no data');
                            return;
                        }
                        var sections = data.data.sections;
                        //console.log('test data received!', data);
                        var qIds = [];
                        //console.log(data.sections);
                        async.eachSeries(sections, function (section, sectioncallback) {
                            //console.log("in section");
                           // console.log(section.subSection.length);
                            async.eachSeries(section.subSection, function (subSection, subSectionCallback) {
                              //  console.log('in sub section');
                                //console.log(subSection.questions);
                                // console.log(subSection);
                                //return;
                                qIds = qIds.concat(subSection.questions);
                               // console.log(qIds);
                                subSectionCallback(null);
                            }, function (err) {
                                if (err) {
                                    firstcb(err);
                                }
                                else {
                                    sectioncallback(null);
                                }
                            }
                            )
                        }, function (err) {
                            if (err) {
                                return res.json({
                                    'status': '404',
                                    'message': "section process problem",
                                    "error": err
                                });
                            }
                            else {
                                var cqId = [];
                                var conceptIds = [];
                                var map = [];
                                //console.log(qIds);
                                async.eachSeries(qIds, function (qid, qcb) {
                                    console.log("in question");
                                    if(qid.qId==null)
                                        {
                                            firstcb('question doesnt exist');
                                            return;        
                                        }
                                    Question.findOne({ '_id': qid.qId }, function (err, data) {
                                        if (err) {
                                            qcb(err);
                                        }
                                        else {
                                            if(data==null)
                                                {
                                                    qcb('question doesnt exist');
                                                    return;        
                                                }
                                            console.log('find question', qid.qId);
                                            console.log('question conceptId', data.conceptId);

                                            var questionConceptIds = data.conceptId;
                                            if(questionConceptIds.length==0)
                                                {
                                                    qcb('no concept Id in this questionId '+qid.qId);
                                                    return;        
                                                }
                                            // console.log(questionConceptIds);
                                            for (var cid = 0; cid < questionConceptIds.length; cid++) {
                                                //  console.log('cqid ',cqId[questionConceptIds[cid]]);
                                                if (cqId[questionConceptIds[cid]] == undefined)
                                                    cqId[questionConceptIds[cid]] = [];
                                                cqId[questionConceptIds[cid]].push(qid.qId);
                                                if (map[questionConceptIds[cid]] == undefined) {
                                                    map[questionConceptIds[cid]] = 1;
                                                    conceptIds = conceptIds.concat(questionConceptIds[cid]);
                                                }
                                            }


                                            qcb();
                                        }
                                    })
                                }, function (err) {
                                    if (err) {
                                        firstcb(err);
                                    }
                                    else {
                                        console.log('firstcb work donwe');
                                        firstcb(null, { 'cqId': cqId, 'conceptIds': conceptIds });
                                    }
                                }
                                )
                            }
                        }
                        )
                    }
                })
            },
            function (secondcb) {

                var overallCourseData = [];
                var courseId = mongoose.Types.ObjectId(req.body.courseId);
               // console.log(courseId);

                CourseSyllabus.find({ type: "concept", courseId: courseId }).populate('ancestors').exec(function (err, data) {
                    if (err) {
                        console.log(err);
                        secondcb(err);
                    }
                    else {
                        // console.log("Here", data[0]['ancestors']);
                        var conceptDatas = data;
                        if (data.length == 0) {
                            console.log('no data in course');
                            secondcb('no data in course');
                            return;
                        }
                        for (var cd = 0; cd < conceptDatas.length; cd++) {

                            var conceptData = conceptDatas[cd];
                           // console.log('conceptdata masterIds', conceptData.masterIDs);
                            for (var mid = 0; mid < conceptData.masterIDs.length; mid++) {
                                var masterId = conceptData.masterIDs[mid];
                                var obj = {
                                    mConceptId: masterId,
                                    concept: {
                                        id: conceptData._id,
                                        name: conceptData.name
                                    },
                                    subject: [],
                                    chapter: [],
                                    subSubject: []
                                };
                                for (var anc = 0; anc < conceptData.ancestors.length; anc++) {
                                    var ancestor = conceptData.ancestors[anc];
                                    var oobj = {
                                        id: ancestor._id,
                                        name: ancestor.name
                                    };

                                    if (ancestor.type == 'subject') {
                                        obj.subject.push(oobj);
                                    }
                                    else if (ancestor.type == 'subSubject') {
                                        obj.subSubject.push(oobj);
                                    }
                                    else if (ancestor.type == 'chapter') {
                                        obj.chapter.push(oobj);
                                    }
                                }
                                overallCourseData.push(obj);


                            }
                            if (cd == conceptDatas.length - 1) {
                                console.log('second cb work done');
                                secondcb(null, overallCourseData);
                            }

                        }




                    }
                })

            }

        ], function (err, result) {
            if (err) {
                return res.json({
                    'status': '400',
                    'message': 'This is the error--->' + err,
                    'data': null
                });
            }
            else {
                console.log(result);
                var overallCourseData = result[1];
                var cqId = result[0].cqId;
                var conceptIds = result[0].conceptIds;
                var flag = 0;
                async.eachSeries(conceptIds, function (conceptId, conceptIdCallback) {
                    // console.log('in concept id');  
                    // console.log(conceptId);
                    // console.log(overallCourseData);
                    // console.log('***********************');    
                    var index1 = _.findIndex(overallCourseData, { mConceptId: conceptId });
                    if (index1 > -1) {
                        flag = 1;
                        // subject wise

                        if (overallCourseData[index1].subject != undefined)
                            for (var ii = 0; ii < overallCourseData[index1].subject.length; ii++) {
                               // console.log('in subject wise');
                                var index2 = _.findIndex(calculatedTestSummary.subjects, { id: overallCourseData[index1].subject[ii].id });
                               // console.log('index2', index2);
                                if (index2 == -1) {

                                    var subjectObj = {
                                        name: overallCourseData[index1].subject[ii].name,
                                        id: overallCourseData[index1].subject[ii].id,
                                        questions: []
                                    }

                                    subjectObj.questions = subjectObj.questions.concat(cqId[conceptId]);

                                    //console.log(subjectObj);
                                    calculatedTestSummary.subjects.push(subjectObj);
                                }
                                else {
                                    calculatedTestSummary.subjects[index2].questions = calculatedTestSummary.subjects[index2].questions.concat(cqId[conceptId]);
                                }
                            }
                        //sub subject wise
                        if (overallCourseData[index1].subSubject != undefined)
                            for (var ii = 0; ii < overallCourseData[index1].subSubject.length; ii++) {

                                //console.log('in sub subject wise');
                                var index3 = _.findIndex(calculatedTestSummary.subSubjects, { id: overallCourseData[index1].subSubject[ii].id });
                                if (index3 == -1) {
                                    var subjectOfSubject = _.filter(calculatedTestSummary, { 'subSubject': { "id": overallCourseData[index1].subSubject[ii].id } })
                                    var subSubjectObj = {

                                        name: overallCourseData[index1].subSubject[ii].name,
                                        id: overallCourseData[index1].subSubject[ii].id,
                                        questions: [],
                                        subjectId: subjectOfSubject[0].subject.id
                                    }

                                    subjectObj.questions = subjectObj.questions.concat(cqId[conceptId]);
                                    calculatedTestSummary.subSubjects.push(subSubjectObj);
                                }
                                else {
                                    calculatedTestSummary.subSubjects[index3].questions = calculatedTestSummary.subSubjects[index3].questions.concat(cqId[conceptId]);
                                }
                            }
                        //chapter wise
                        if (overallCourseData[index1].chapter != undefined)
                            for (var ii = 0; ii < overallCourseData[index1].chapter.length; ii++) {

                                //console.log('in chapter wise');

                                var index4 = _.findIndex(calculatedTestSummary.chapters, { id: overallCourseData[index1].chapter[ii].id });
                                if (index4 == -1) {
                                    //var chapterconcepts = _.filter(overallCourseData, { 'chapter': { "id": overallCourseData[index1].chapter[ii].id } });
                                    var chapterObj = {

                                        name: overallCourseData[index1].chapter[ii].name,
                                        id: overallCourseData[index1].chapter[ii].id,
                                        questions: [],
                                        concepts: []
                                    }
                                    for (var i = 0; i < overallCourseData.length; i++) {
                                        for (var j = 0; j < overallCourseData[i].chapter.length; j++) {
                                            if (overallCourseData[i].chapter[j].id == overallCourseData[index1].chapter[ii].id) {
                                                chapterObj.concepts.push(overallCourseData[i].concept.id);
                                            }
                                        }
                                    }
                                    var subSubjectOfChapter = _.filter(overallCourseData, { 'chapter': { "id": overallCourseData[index1].chapter.id } })

                                    if (overallCourseData[index1].subSubject != undefined) {
                                        chapterObj.subSubjectId = overallCourseData[index1].subSubject[0];
                                    }
                                    // for (var cc = 0; cc < chapterconcepts.length; cc++) {
                                    //     chapterObj.concepts.push(chapterconcepts[cc].concept.id);
                                    // }
                                    chapterObj.questions = chapterObj.questions.concat(cqId[conceptId]);
                                    calculatedTestSummary.chapters.push(chapterObj);
                                }
                                else {
                                    calculatedTestSummary.chapters[index4].questions = calculatedTestSummary.chapters[index4].questions.concat(cqId[conceptId]);
                                }
                            }

                        // concept wise

                        //console.log("overall course data", overallCourseData[index1]);
                        //console.log('in concept wise');
                        var index5 = _.findIndex(calculatedTestSummary.concepts, { id: overallCourseData[index1].concept.id });
                        if (index5 == -1) {
                            var chapterofconcept = _.filter(overallCourseData, { 'concept': overallCourseData[index1].concept });
                           // console.log(chapterofconcept);
                            var conceptObj = {

                                name: overallCourseData[index1].concept.name,
                                id: overallCourseData[index1].concept.id,
                                questions: [],
                                chapterId: chapterofconcept[0].chapter[0].id
                            }
                            conceptObj.questions = conceptObj.questions.concat(cqId[conceptId]);
                            calculatedTestSummary.concepts.push(conceptObj);
                        }
                        else {
                            calculatedTestSummary.concepts[index5].questions = calculatedTestSummary.concepts[index5].questions.concat(cqId[conceptId]);
                        }
                        conceptIdCallback();

                    }
                    else{
                        console.log('this conceptId is not found in the courseSyllabus data ',conceptId);
                        conceptIdCallback('this conceptId is not found in the courseSyllabus data '+conceptId);
                    }

                    
                }, function (err) {
                    if (err) {
                        return res.json({
                            'status': '400',
                            'message': 'This is the error--->' + err,
                            'data': null
                        });
                    }
                    else {
                        console.log('test summary about to be saved!!', calculatedTestSummary);
                        //var testSummary = new TestSummary(calculatedTestSummary);
                        TestSummary.update({ 'testId': calculatedTestSummary.testId, 'courseId': calculatedTestSummary.courseId }, { $set: calculatedTestSummary }, { upsert: true }, function (err) {
                            if (err) {
                                return res.json({
                                    'status': '400',
                                    'message': 'This is the error--->' + err,
                                    'data': null
                                });
                            }
                            else {
                                return res.json({
                                    'status': '200',
                                    'message': 'Test summary succesfully created and saved',
                                    'data': req.ip
                                });
                            }
                        });

                    }
                }
                )


            }
        }
        )
    }
}