/* eslint-disable */
var test = require('../endpoints/test/tests.model.js');
var async = require('async');
var TestSummary = require('../endpoints/testSummary/testSummary.model.js');
var Question = require('../endpoints/question/question.model.js');
var Course = require('../endpoints/course/course.model');
var CourseItems = require('../endpoints/courseItem/courseItem.model.js');
var CourseSyllabus = require('../endpoints/courseSyllabus/courseSyllabus.model');
var mongoose = require('mongoose');
var _ = require('lodash');
module.exports = {
    /*
    Get testpaperSummary
    */
demoentry:function(req,res){
    test.findOne({_id:req.body.testId},function(err,testData){
        if(err){

        }
        else{
            var courseId=mongoose.Types.ObjectId('5a1550ac2ffc3941a4d7e25b');
            var corIds=[];
            CourseSyllabus.find({'courseId':courseId,type:'concept'},function(err,conceptData){
                if(err){

                }
                else{
                    for(var l=0;l<conceptData.length;l++)
                        {
                            corIds.push(conceptData[l].masterIDs);
                        }
                        console.log('courseIds',corIds);
                        var p=0;
                        for(var i=0;i<testData.data.sections.length;i++){
                            console.log('in section');
                            for(var j=0;j<testData.data.sections[i].subSection.length;j++){
                                console.log('sub');
                                for(var k=0;k<testData.data.sections[i].subSection[j].questions.length;k++){
                                    var question=testData.data.sections[i].subSection[j].questions[k];
                                    Question.findOne({_id:question.qId},function(err,qData){
                                        if(err){
            
                                        }
                                        else{
                                            if(p==corIds.length)
                                                p=0;
                                            qData.conceptId=corIds[p];
                                            p++;
                                            var model=new Question(qData);
                                            model.save(function(err){
                                                if(err){

                                                }
                                                else{
                                                   
                                                }
                                            });
                                        }
                                    })
                                }
                            }
                            if(i==testData.data.sections.length-1)
                                return res.json({
                                    'status': '200',
                                    'message': 'Request Successful',
                                    'data': null
                                });
                        }
                }
            })
            
        }
    })
},
    getTestSummary: function (req, res) {
        if(req.body.testId&&req.body.courseId)
            {
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
    else{
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
                        console.log('test data received!', data);
                        var qIds = [];
                        //console.log(data.sections);
                        async.eachSeries(sections, function (section, sectioncallback) {
                            console.log("in section");
                            console.log(section.subSection.length);
                            async.eachSeries(section.subSection, function (subSection, subSectionCallback) {
                                console.log('in sub section');
                                //console.log(subSection.questions);
                                // console.log(subSection);
                                //return;
                                qIds = qIds.concat(subSection.questions);
                                console.log(qIds);
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
                                console.log(qIds);
                                async.eachSeries(qIds, function (qid, qcb) {
                                    console.log("in question");
                                    Question.findOne({ '_id': qid.qId }, function (err, data) {
                                        if (err) {
                                            qcb(err);
                                        }
                                        else {
                                            console.log('find question', qid.qId);
                                            console.log('question conceptId', data.conceptId);

                                            var questionConceptIds = data.conceptId;
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
                                        console.log('forstcb work donwe');
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

                CourseSyllabus.find({ type: "concept", courseId: req.body.courseId }).populate('ancestors').exec(function (err, data) {
                    if (err) {
                        console.log(err);
                        secondcb(err);
                    }
                    else {
                        // console.log("Here", data[0]['ancestors']);
                        var conceptDatas = data;
                        if (data.length == 0) {
                            secondcb('no data in course');
                            return;
                        }
                        for(var cd=0;cd<conceptDatas.length;cd++){

                            var conceptData=conceptDatas[cd];
                            console.log('conceptdata masterIds', conceptData.masterIDs);
                            for(var mid=0;mid<conceptData.masterIDs.length;mid++){
                                var masterId=conceptData.masterIDs[mid];
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
                                for(var anc=0;anc<conceptData.ancestors.length;anc++){
                                    var ancestor=conceptData.ancestors[anc];
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
                            if(cd==conceptDatas.length-1){
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
                                console.log('in subject wise');
                                var index2 = _.findIndex(calculatedTestSummary.subjects, { id: overallCourseData[index1].subject[ii].id });
                                console.log('index2', index2);
                                if (index2 == -1) {

                                    var subjectObj = {
                                        name: overallCourseData[index1].subject[ii].name,
                                        id: overallCourseData[index1].subject[ii].id,
                                        questions: []
                                    }

                                    subjectObj.questions = subjectObj.questions.concat(cqId[conceptId]);

                                    console.log(subjectObj);
                                    calculatedTestSummary.subjects.push(subjectObj);
                                }
                                else {
                                    calculatedTestSummary.subjects[index2].questions = calculatedTestSummary.subjects[index2].questions.concat(cqId[conceptId]);
                                }
                            }
                        //sub subject wise
                        if (overallCourseData[index1].subSubject != undefined)
                            for (var ii = 0; ii < overallCourseData[index1].subSubject.length; ii++) {

                                console.log('in sub subject wise');
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

                                console.log('in chapter wise');

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
                                    var subSubjectOfChapter=_.filter(overallCourseData,{'chapter':{"id":overallCourseData[index1].chapter.id}})

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

                        console.log("overall course data", overallCourseData[index1]);
                        console.log('in concept wise');
                        var index5 = _.findIndex(calculatedTestSummary.concepts, { id: overallCourseData[index1].concept.id });
                        if (index5 == -1) {
                            var chapterofconcept = _.filter(overallCourseData, { 'concept': overallCourseData[index1].concept });
                            console.log(chapterofconcept);
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


                    }

                    conceptIdCallback();
                }, function (err) {
                    if (err) {
                        return res.json({
                            'status': '400',
                            'message': 'This is the error--->' + err,
                            'data': null
                        });
                    }
                    else {
                        console.log('test summary about to be saved!!');
                        var testSummary = new TestSummary(calculatedTestSummary);
                        testSummary.save(function (err) {
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
                                    'data': calculatedTestSummary
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