"use strict";

import audios from "../audio/audio.model";
import category from "../category/category.model.js";
import chapters from "../chapter/chapter.model";
import classes from "../class/class.model";
import client from "../client/client.model";
import concepts from "../concept/concept.model";
import contentTag from "../contentTag/contentTag.model";
import course from "../course/course.model";
import courseItem from "../courseItem/courseItem.model";
import courseSyllabus from "../courseSyllabus/courseSyllabus.model";
import courseTag from "../courseTag/courseTag.model";
import courseType from "../courseType/courseType.model";
import formula from "../formula/formula.model";
import grade from "../grade/grade.model";
import languages from "../language/language.model";
import packages from "../package/package.model";
import questions from "../question/question.model";
import roles from "../role/role.model";
import rules from "../rule/rule.model";
import studyMaterial from "../studyMaterial/studyMaterial.model";
import subCategory from "../subCategory/subCategory.model";
import subjects from "../subject/subject.model";
import subSubjects from "../subSubject/subSubject.model";
import tests from "../test/tests.model";
import testSummary from "../testSummary/testSummary.model";
import testType from "../testType/testType.model";
import User from "../user/user.model";
import videos from "../video/video.model";

import mongoose from "mongoose";
import {_} from "lodash";
import async from "async";

export class MigrateController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.audios = audios;
        this.category = category;
        this.chapters = chapters;
        this.classes = classes;
        this.client = client;
        this.concepts = concepts;
        this.contentTag = contentTag;
        this.course = course;
        this.courseItem = courseItem;
        this.courseSyllabus = courseSyllabus;
        this.courseTag = courseTag;
        this.courseType = courseType;
        this.formula = formula;
        this.languages = languages;
        this.packages = packages;
        this.grade = grade;
        this.questions = questions;
        this.roles = roles;
        this.rules = rules;
        this.studyMaterial = studyMaterial;
        this.subCategory = subCategory;
        this.subjects = subjects;
        this.subSubjects = subSubjects;
        this.tests = tests;
        this.testSummary = testSummary;
        this.testType = testType;
        this.User = User;
        this.videos = videos;
    }

    async changes(req, res) {

        req.params.id === '1' ? await this.courseChanges() : '';
        req.params.id === '2' ? await this.courseItemChanges() : '';
        req.params.id === '3' ? await this.packageChanges() : '';
        req.params.id === '4' ? await this.testChanges() : '';
        req.params.id === '5' ? await this.questionChanges() : '';
        //req.params.id === '5' ? await this.abhiChanges() : '';
        req.params.id === '6' ? await this.rulesChanges() : '';
        req.params.id === '7' ? await this.gradeChanges() : '';
        req.params.id === '8' ? await this.genericQuestionChanges() : '';
        req.params.id === '9' ? await this.insertClass() : '';
        req.params.id === '10' ? await this.updateTestTotalMarks() : '';
        req.params.id === '11' ? await this.updateTest() : '';

        return res.json({
         message: "Done",
         status: 200
        });
    }

    async abhiChanges() {
        var passage = await this.passageList();
        console.log(passage.length);
        for(let pId of passage){
            var questionlist = await this.getQuestions(pId);
            for(let [i,question] of questionlist.entries()){
                question.passageInfo.totalQuestion = questionlist.length;
                question.passageInfo.thisQuestionNumber = i+1;
                console.log(question._id);
                await question.save();
            }
        }
    }

        
    totalMarksFunction(test){
        let totalMarks = 0;
        return new Promise((resolve,reject)=>{
            if(!test.settings && test.data.sections){
                test["settings"] = {
                                    totalMarks: 0,
                                    duration: null,
                                    customTime: false,
                                    noOfAttempts: 0,
                                    validity: {
                                        startDate: null,
                                        endDate: null
                                    },
                                    pause: false,
                                    reviewAttempts: false,
                                    showCorrectAnswers: false,
                                    shuffle: {
                                        sections: false,
                                        questions: false,
                                        answer: false
                                    },
                                    isHintShow: false,
                                    testType: null
                                    };
                test.data.sections.map((section)=>{
                    section.subSection.map((ssection)=>{
                        totalMarks += ssection.totalMarks;
                    })
                })
                test.settings.totalMarks = totalMarks;
                console.log("Updated Settings",test._id);
                test.userId=null;
                this.tests.findOneAndUpdate({_id:test._id},test,function(err){
                    if(err){
                        console.log(err);
                        reject(err);
                    }
                    else{
                        resolve();
                    }
                });
            }
            else if(test.data.sections){
                test.data.sections.map((section)=>{
                    section.subSection.map((ssection)=>{
                        totalMarks += ssection.totalMarks;
                    })
                })
                test.settings.totalMarks = totalMarks;
                console.log("Updated",test._id);
                test.userId=null;
                this.tests.findOneAndUpdate({_id:test._id},test,function(err){
                    if(err){
                        console.log(err);
                        reject(err);
                    }
                    else{
                        resolve();
                    }
                })
            }
            else{
                console.log("Test with no sections",test._id);
                resolve();
            }
        });
    }
    
    courseChanges() {
        return new Promise((resolve) => {
            let updates = {};

            updates.language = {id: "5a8405fa2c386932c50f77ea", name: "en-us"};
            updates.price = 0;
            updates.courseImage = null;
            updates.coupons = [{
                name: null,
                percentage: 0,
            }];

            this.course.update({},updates,{multi: true}, (err) => {
                if(err) {
                    console.log("err : ", err);
                }
                console.log("course Updated");
                resolve();
            });
        });
    }

    courseItemChanges() {
        return new Promise((resolve) => {
            this.courseItem.find({}, function (err, docs) {
                let promises = [];
                docs.map(doc => {
                    promises.push(new Promise((resolve) => {

                        doc.deleted = false;
                        doc.userId = !doc.userId ? null : doc.userId;

                        if(!doc.details) {
                            doc.details = {};
                            doc.details.levels = ['subject', 'subsubject', 'chapter', 'concept'];
                        }

                        doc.save(function(err) {
                            if(err)
                                console.log(" err : ", err);
                            resolve();
                        });
                    }));
                });
                Promise.all(promises).then(() => {
                    console.log("all courseItems Updated");
                    resolve();
                });
            });
        });
    }

    packageChanges() {
        return new Promise((resolve) => {
            let updates = {};
            updates.code = 0;
            updates.url = null;
            updates.thumbUrl = null;
            updates.status = "DRAFT";

            this.packages.update({},updates,{multi: true}, () => {
                console.log("packages Updated");
                resolve();
            });
        });
    }

    testChanges() {
        return new Promise((resolve) => {
            this.tests.find({}, function (err, docs) {
                let promises = [];
                docs.map(doc => {
                    promises.push(new Promise((resolve) => {
                        if(doc.data && doc.data.sections) {
                            doc.displayName = doc.name ? doc.name : null;
                            doc.settings.customTime = false;
                            doc.settings.language = ["en-us"];
                            doc.settings.noOfAttempts = doc.settings.noOfAttempts === null ? 0 : doc.settings.noOfAttempts;
                            doc.settings.pause = doc.settings.pause === null ? false : doc.settings.pause;
                            doc.settings.reviewAttempts = doc.settings.reviewAttempts === null ? false : doc.settings.reviewAttempts;
                            doc.settings.showCorrectAnswers = doc.settings.showCorrectAnswers === null ? false : doc.settings.showCorrectAnswers;
                            doc.settings.shuffle.sections = doc.settings.shuffle.sections === null ? false : doc.settings.shuffle.sections;
                            doc.settings.shuffle.questions = doc.settings.shuffle.questions === null ? false : doc.settings.shuffle.questions;
                            doc.settings.shuffle.answer = doc.settings.shuffle.answer === null ? false : doc.settings.shuffle.answer;
                            doc.settings.testType = doc.settings.testType === null ? 'sample' : doc.settings.testType;
                            doc.status = doc.status === null ? 'DRAFT' : doc.status.toUpperCase();

                            doc.userId = !doc.userId ? null : doc.userId;
                            if(doc.data && doc.data.sections) {
                                doc.data.sections.map(sec => {
                                    if(!sec.isHidden)
                                        sec.isHidden = false;
                                });
                            }
                            if(doc.tags && doc.tags.usedInCourse) {
                                doc.oldTags = doc.tags;
                                Reflect.deleteProperty(doc, 'tags');
                            }
                            if(doc.tags) {
                                doc.tags.map(tag => {
                                    tag.type = tag.type === "contentType" ? tag.relation.name : tag.type;
                                })
                            }
                            doc.testMode = 0;
                            doc.save(function(err) {
                                if(err)
                                    console.log(" err : ", err);
                                resolve();
                            });
                        } else
                            resolve();
                    }));
                });
                Promise.all(promises).then(() => {
                    console.log("all test updated");
                    resolve();
                });
            });
        });
    }

    questionChanges() {
        return new Promise((resolve) => {
            this.questions.aggregate( [
                { $match : { 'status': {'$ne':'DELETED'} } },
                {
                    $group : {
                        _id :  "$passageId",
                        ids: { $addToSet: "$_id" },
                    }
                }
            ] )
            .then( (docs) => {
                let passageMap = new Map();
                docs.map(doci => {
                    let c = [];
                    doci.ids.map((i, k) => c.push(k+1));
                    passageMap.set(doci._id, c);

                    doci.ids.map(async id => {
                        let doc = await this.questions.findOne({ _id: id}).exec();
                        (async () => {
                            await new Promise((resolve) => {
                                if(doc.passageId) {
                                    doc.passageInfo = doc.passageInfo ? doc.passageInfo : {};
                                    doc.passageInfo.totalQuestion = doci.ids.length;
                                    doc.passageInfo.thisQuestionNumber =
                                        passageMap.get(doc.passageId).shift();
                                    doc.save(function(err) {
                                        if(err)
                                            console.log("err : ", err);
                                        resolve();
                                    });
                                } else
                                    resolve();
                            });
                        })();
                    });
                });
                resolve();
            })
            .catch(err => {
                console.log("err : ", err);
            });
        });
    }

    rulesChanges() {
        return new Promise((resolve) => {
            this.rules.find({}, function (err, docs) {
                let promises = [];
                docs.map(doc => {
                    promises.push(new Promise((resolve) => {
                        doc.sections.map(sec => {
                            sec.isHidden = !sec.isHidden ? false: sec.isHidden;
                            sec.subSection.map((sub) => {
                                if(sub.marks) {
                                    sub.totalMarks = sub.marks;
                                    Reflect.deleteProperty(sub, "marks");
                                }
                                sec.positiveMarks = !sec.positiveMarks ? null: sec.positiveMarks;
                                sec.negativeMarks = !sec.negativeMarks ? null: sec.negativeMarks;
                                sec.partialMarks = !sec.partialMarks ? null: sec.partialMarks;
                                sec.noOfQuestions = !sec.noOfQuestions ? null: sec.noOfQuestions;
                            });
                        });
                        doc.save(function(err) {
                            if(err)
                                console.log(" err : ", err);
                            resolve();
                        });
                    }));
                });
                Promise.all(promises).then(() => {
                    console.log("all rules updated");
                    resolve();
                });
            });
        });
    }

    passageList() {
        return new Promise((resolve, reject) => {
            this.questions.distinct('passageId', function (err, data) {
                if(err){
                    reject(err);
                }
                else{
                    resolve(data);
                }
            });
        });
    }

    getQuestions(passageId) {
        return new Promise((resolve, reject) => {
            this.questions.find({'passageId':passageId,'status':{'$ne':'DELETED'}}, function (err, data) {
                if(err){
                    reject(err);
                }
                else{
                    resolve(data);
                }
            });
        });
    }

     gradeChanges() {
        return new Promise(async (resolve) => {
            let grades = await this.grade.find().exec();
                grades.map(grade => {
                    grade.subjects.map(subject => {
                        subject.chapters.map(async chapter => {
                            await new Promise(async (resolve) => {
                                let chapterdoc = await this.chapters.find({_id: chapter.id},
                                    {"subsubject": 1}).exec();
                                chapter.subsubject = chapterdoc[0].subsubject;
                                grade.userId = !grade.userId ? null : grade.userId;
                                grade.save((err) => {
                                    if(err)
                                        console.log("err : ", err);
                                    resolve();
                                });
                            });
                        });
                    });
                });
            resolve();
        });
    }

    genericQuestionChanges() {
        return new Promise((resolve) => {
            let updates = {};
            updates.status = "PUBLISHED";
            updates.updatedAt = new Date();

            this.questions.update({},updates,{multi: true, upsert: true}, () => {
                console.log("Questions Updated");
                resolve();
            });
        });
    }

    insertClass() {
        return new Promise(async (resolve, reject) => {
          let CourseCommaCourseItemAndTestData = await this.getCourseCommaCourseItemAndTest();
            async.forEach(CourseCommaCourseItemAndTestData, async (doc) => {
                let farziconceptidData = await this.farzitestSummaryCall(doc);
                if(farziconceptidData.length > 0) {
                    let classData = await this.farziCourseSyllabusCall(farziconceptidData);
                    if(classData.length > 0) {
                        let highestClass = null;
                        classData.map(eachClass => {
                            highestClass = !highestClass || parseInt(eachClass._id.slice(1,3)) > highestClass ? parseInt(eachClass._id.slice(1,3)): highestClass;
                        });
                        highestClass ? doc.highestClass = highestClass: '';
                    }
                }
            }, (err) => {
                if (err) reject(err);
                async.forEach(CourseCommaCourseItemAndTestData, async (doc) => {
                    await this.updateHighestClass(doc);
                }, (err) => {
                    if (err) reject(err);
                    console.log("Class inserted");
                    resolve();
                });
            });
        });
    }


    farziCourseSyllabusCall(farziconceptidData) {
        return this.courseSyllabus.aggregate([
            {
                "$match": {
                    "_id": mongoose.Types.ObjectId(farziconceptidData[0].farziConceptId)
                }
            },
            {
                "$group": {
                    "_id": "$typeCode",
                }
            }
        ]);
    }

    farzitestSummaryCall(doc) {
        return this.testSummary.aggregate([
            {
                "$match": {
                    "courseId": doc.courseId,
                    "testId": doc.testId
                }
            },
            {
                "$unwind": "$concepts"
            },
            {
                "$project": {
                    "courseId": 1,
                    "testId": 1,
                    "farziConceptId": "$concepts.id"
                }
            }
        ]);
    }

    updateHighestClass(mainDoc) {
        //console.log("doc : ", doc);
        return new Promise((resolve, reject) => {
            if(mainDoc.highestClass) {
                let conditions = {
                    "_id": mongoose.Types.ObjectId(mainDoc.courseItemId),
                    "details.tests": { $elemMatch: {
                            "paperDetail.id": mongoose.Types.ObjectId(mainDoc.testId) } }
                }, update = {'$set': {
                        'details.tests.$.class': mainDoc.highestClass,
                    }};

                this.courseItem.update(conditions, update, {}, function(err, numAffected) {
                    if(err) {
                        console.log("err : ", err);
                        reject(err);
                    }
                    console.log("done : ", numAffected);
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    getCourseCommaCourseItemAndTest() {
        return new Promise((resolve, reject) => {
           this.course.aggregate([
               {
                   "$unwind": "$courseItems"
               },
               {
                   "$match": {
                       "courseItems.itemType": "testGroup"
                   }
               },
               {
                   "$project": {
                       "courseItemId": "$courseItems.id"
                   }
               },
               {
                   "$lookup": {
                       "from": "courseitems",
                       "localField": "courseItemId",
                       "foreignField": "_id",
                       "as": "courseItemData"
                   }
               },
               {
                   "$unwind": "$courseItemData"
               },
               {
                   "$unwind": "$courseItemData.details.tests"
               },
               {
                   "$project": {
                       "courseId": "$_id",
                       "courseItemId": 1,
                       "testId": "$courseItemData.details.tests.paperDetail.id"
                   }
               }
           ]).then(function (docs) {
               resolve(docs);
           }).catch(err => {
               console.log("err : ", err);
               reject(err);
           });
        });
    }

    updateTestTotalMarks(){
        return new Promise((resolve,reject)=>{
            ((that)=>{
                this.tests.find().lean().exec(async function(err,testList){
                    for(let test of testList){
                        let farziVariable = await that.totalMarksFunction(test);
                    }
                    console.log("All Test Updated");
                    resolve();
                })
            })(this)
        })
    }


    getMap1() {
        let dataMap = new Map();
        dataMap.set(1, ["P110708"]);
        dataMap.set(2, ["P110709"]);
        dataMap.set(3, ["P110702"]);
        dataMap.set(4, ["P110710"]);
        dataMap.set(5, ["P111001"]);
        dataMap.set(6, ["P120101"]);
        dataMap.set(7, ["P120603"]);
        dataMap.set(8, ["P120306"]);
        dataMap.set(9, ["P110304"]);
        dataMap.set(10,["P110304"]);
        dataMap.set(11, ["P110502"]);
        dataMap.set(12, ["P111307"]);
        dataMap.set(13, ["P120409"]);
        dataMap.set(14, ["P110704"]);
        dataMap.set(15, ["P120303"]);
        dataMap.set(16, ["P110406"]);
        dataMap.set(17, ["P110310"]);
        dataMap.set(18, ["P111208"]);
        dataMap.set(19, ["P110902"]);
        dataMap.set(20, ["P111002"]);
        dataMap.set(21, ["P120511"]);
        dataMap.set(22, ["P120609"]);
        dataMap.set(23, ["P110602"]);
        dataMap.set(24, ["C121207"]);
        dataMap.set(25, ["C121207"]);
        dataMap.set(26, ["C121207"]);
        dataMap.set(27, ["C110103"]);
        dataMap.set(28, ["C120507"]);
        dataMap.set(29, ["C111901"]);
        dataMap.set(30, ["C110305"]);
        dataMap.set(31, ["C111601"]);
        dataMap.set(32, ["C120106"]);
        dataMap.set(33, ["C120106"]);
        dataMap.set(34, ["C111404"]);
        dataMap.set(35, ["C121203"]);
        dataMap.set(36, ["C120601"]);
        dataMap.set(37, ["C120304"]);
        dataMap.set(38, ["C121006"]);
        dataMap.set(39, ["C111101"]);
        dataMap.set(40, ["C120208"]);
        dataMap.set(41, ["C111505"]);
        dataMap.set(42, ["C111105"]);
        dataMap.set(43, ["C110601"]);
        dataMap.set(44, ["C110402"]);
        dataMap.set(45, ["C121501"]);
        dataMap.set(46, ["C110204"]);
        dataMap.set(47, ["M120802"]);
        dataMap.set(48, ["M120701"]);
        dataMap.set(49, ["M120803"]);
        dataMap.set(50, ["M110302"]);
        dataMap.set(51, ["M120201"]);
        dataMap.set(52, ["M120601"]);
        dataMap.set(53, ["M120607"]);
        dataMap.set(54, ["M120904"]);


        dataMap.set(55, ["M121001"]);
        dataMap.set(56, ["M121001"]);
        dataMap.set(57, ["M121102", "M121103"]);
        dataMap.set(58, ["M110103"]);
        dataMap.set(59, ["M111401"]);
        dataMap.set(60, ["M121208"]);
        dataMap.set(61, ["M111801"]);
        dataMap.set(62, ["M121502"]);

        dataMap.set(63, ["M110602"]);
        dataMap.set(64, ["M111207"]);
        dataMap.set(65, ["M110310"]);
        dataMap.set(66, ["M110809"]);
        dataMap.set(67, ["M110706"]);

        dataMap.set(68, ["M110107"]);
        dataMap.set(69, ["M120101"]);

        return dataMap;
    }

    getMap2() {
        let dataMap = new Map();
        dataMap.set(1, ["P110310"]);
        dataMap.set(2, ["P110409"]);
        dataMap.set(3, ["P120303"]);
        dataMap.set(4, ["P110301"]);
        dataMap.set(5, ["P111001"]);
        dataMap.set(6, ["P110708"]);
        dataMap.set(7, ["P120203"]);
        dataMap.set(8, ["P110304"]);
        dataMap.set(9, ["P110304"]);
        dataMap.set(10,["P110304"]);
        dataMap.set(11, ["P110710"]);
        dataMap.set(12, ["P110710"]);
        dataMap.set(13, ["P110710"]);
        dataMap.set(14, ["P110307"]);
        dataMap.set(15, ["P110401"]);
        dataMap.set(16, ["P110603"]);
        dataMap.set(17, ["P120306"]);
        dataMap.set(18, ["P120305"]);
        dataMap.set(19, ["C110301"]);
        dataMap.set(20, ["C110203"]);
        dataMap.set(21, ["C110501"]);
        dataMap.set(22, ["C121203"]);
        dataMap.set(23, ["C111904"]);
        dataMap.set(24, ["C120806"]);
        dataMap.set(25, ["C111301"]);
        dataMap.set(26, ["C120306"]);
        dataMap.set(27, ["C120306"]);
        dataMap.set(28, ["C120306"]);
        dataMap.set(29, ["C120208"]);
        dataMap.set(30, ["C120203"]);
        dataMap.set(31, ["C120203"]);
        dataMap.set(32, ["C110605"]);
        dataMap.set(33, ["C111909"]);
        dataMap.set(34, ["P110310"]);
        dataMap.set(35, ["P110310"]);
        dataMap.set(36, ["P110310"]);
        dataMap.set(37, ["P110310"]);
        dataMap.set(38, ["P110310"]);
        dataMap.set(39, ["P110310"]);
        dataMap.set(40, ["P110310"]);
        dataMap.set(41, ["P110310"]);
        dataMap.set(42, ["P110310"]);
        dataMap.set(43, ["P110310"]);
        dataMap.set(44, ["M110308"]);
        dataMap.set(45, ["M110308"]);
        dataMap.set(46, ["M110308"]);
        dataMap.set(47, ["M110308"]);
        dataMap.set(48, ["M110308"]);
        dataMap.set(49, ["M110308"]);
        dataMap.set(50, ["M110308"]);
        dataMap.set(51, ["M110308"]);
        dataMap.set(52, ["M120301"]);
        dataMap.set(53, ["M120101"]);
        dataMap.set(54, ["M110308"]);

        return dataMap;
    }


    async updateTest() {
        let questionData = await this.getQuestionsForTest();

        let dataMap = this.getMap1();
        //let dataMap = this.getMap2();

        questionData.map((ques) => {

            this.questions.findOne({ _id: mongoose.Types.ObjectId(ques.qId.qId) }, function (err, doc){
                console.log("doc bef: ", doc.conceptCode );

                let codes = [];
                dataMap.get(ques.qId.questionSerialNo).map(c => {
                   codes.push(c);
                });
                doc.conceptCode = codes;

                console.log("doc: ", doc.conceptCode );
                doc.save(function(err) {
                    if(err) console.log("err: ", err);

                    console.log("updated");
                });
            });

        });
    }

    getQuestionsForTest() {
        return this.tests.aggregate([
            {
                "$match": {
                    "_id": mongoose.Types.ObjectId("5ace202c9fe7b01d5806baf6")
                }
            },
            {
                "$unwind": "$data.sections"
            },
            {
                "$unwind": "$data.sections.subSection"
            },
            {
                "$unwind": "$data.sections.subSection.questions"
            },
            {
                "$project": {
                    "name": 1,
                    "qId": "$data.sections.subSection.questions"
                }
            }
        ]);
    }

}