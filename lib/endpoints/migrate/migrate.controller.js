"use strict";

import audios from "../audio/audio.model";
import category from "../category/category.model.js";
import chapters from "../chapter/chapter.model";
import classes from "../class/class.model";
import client from "../client/client.model";
import orgCenter from "../orgCenter/orgCenter.model";
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
import testInfo from "./testInfo.model";
import elasticsearch from "elasticsearch";
import paperName from './paperName';

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
        this.orgCenter = orgCenter;
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
        this.testInfo = testInfo;

        this.elasticClient = new elasticsearch.Client({
            host: `${this.config.elasticConnection.hostname}:${this.config.elasticConnection.port}`,
            log: 'trace'
        });

        this.checkElasticCluster();
    }


    checkElasticCluster() {
        this.elasticClient.ping({ requestTimeout: 1000 }, error => {
            error ? this.loggerInstance.error(`elasticsearch cluster is down!`): this.loggerInstance.info(`elasticsearch cluster is up`);
        });
    }

    async changes(req, res) {
        try {
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
            req.params.id === '12' ? await this.moveSubjectChapterConceptToElastic(): '';
            req.params.id === '13' ? await this.publishContent() : '';
            req.params.id === '14' ? await this.moveOldConceptsToNewTree(): '';
            req.params.id === '15' ? await this.fixAllNullObjectIds(): '';
            req.params.id === '20' ? await this.createTestInfo(): '';
            req.params.id === '16' && await this.addContentIdToContent();
            req.params.id === '17' && this.mcqOperation();
            req.params.id === '21' ? await this.paperNameChange(): '';
            req.params.id === '18' && this.findingMissingTestCourse();
            req.params.id === '22' ? await this.updateLevel(): '';
            req.params.id === '23' ? await this.removeWrongAnswers() : '';
            req.params.id === '24' && this.migrateToNewRoles();
            req.params.id === '25' && await this.createFIITJEERolesAndOrg();
    
            return res.json({
             message: "Done",
             status: 200
            });
        } catch (error) {
            console.log(error);
            return res.json({
                message: "API failed",
                status: 500
            });
        }
    }

    async moveOldConceptsToNewTree() {
        const query = {
            $or: [
                {
                    'conceptId.0': { $exists: true }
                },
                {
                    'chapterId.0': { $exists: true }
                },
                {
                    'subjectId.0': { $exists: true }
                }
            ]
        };
        const length = await this.questions.count(query);
        const limit = 100;
        let skips = 0;
        while (skips <= length) {
            const questions = await this.questions.find(query).skip(skips).limit(limit);
            await Promise.all(questions.map(async question => {
                question.subjects = question.subjects || [];
                // Process subjects directly
                question.subjectId = question.subjectId || [];
                question.conceptId = question.conceptId || [];
                question.chapterId = question.chapterId || [];
                await Promise.all(question.subjectId.map(async oldSubject => {
                    let mySubject = question.subjects.find(newSubject => newSubject.subjectId.equals(oldSubject));
                    if (!mySubject) {
                        mySubject = {
                            subjectId: oldSubject
                        }
                        question.subjects.push(mySubject);
                    }
                    mySubject.chapters = mySubject.chapters || [];
                }));
        
                // process chapters
                await Promise.all(question.chapterId.map(async oldChapter => {
                    // find chapter's subject
                    const chapterDetails = await this.chapters.findById(oldChapter);
                    const oldSubject = chapterDetails.subject.id;
                    let mySubject = question.subjects.find(newSubject => newSubject.subjectId.equals(oldSubject));
                    if (!mySubject) {
                        mySubject = {
                            subjectId: oldSubject
                        }
                        question.subjects.push(mySubject);
                        mySubject = question.subjects.find(newSubject => newSubject.subjectId.equals(oldSubject));
                    }
                    // find chapter
                    let myChapter = mySubject.chapters.find(newChapter => newChapter.chapterId.equals(oldChapter));
                    if (!myChapter) {
                        myChapter = {
                            chapterId: oldChapter
                        }
                        mySubject.chapters.push(myChapter);
                    }
                    myChapter.concepts = myChapter.concepts || [];
                }));
        
                //process concepts
                await Promise.all(question.conceptId.map(async oldConcept => {
                    const conceptDetails = await this.concepts.findById(oldConcept);
                    const oldChapter = conceptDetails.chapter.id;
                    const chapterDetails = await this.chapters.findById(oldChapter);
                    const oldSubject = chapterDetails.subject.id;
                    let mySubject = question.subjects.find(newSubject => newSubject.subjectId.equals(oldSubject));
                    if (!mySubject) {
                        mySubject = {
                            subjectId: oldSubject
                        }
                        question.subjects.push(mySubject);
                        mySubject = question.subjects.find(newSubject => newSubject.subjectId.equals(oldSubject));
                    }
                    let myChapter = mySubject.chapters.find(newChapter => newChapter.chapterId.equals(oldChapter));
                    if (!myChapter) {
                        myChapter = {
                            chapterId: oldChapter
                        }
                        mySubject.chapters.push(myChapter);
                        myChapter = mySubject.chapters.find(newChapter => newChapter.chapterId.equals(oldChapter));
                    }
                    let myConcept = myChapter.concepts.find(newConcept => newConcept.conceptId.equals(oldConcept));
                    if (!myConcept) {
                        myConcept = {
                            conceptId: oldConcept
                        }
                        myChapter.concepts.push(myConcept);
                    }
                }));
                console.log("question : ", question);
                console.log(JSON.stringify(question));
                question.save();
            }));
            skips+=100;
            console.log(`************ ${skips} questions have been processed`);
        }
        console.log("############ All Questions Processed");
    }

    async fixAllNullObjectIds() {
        const query = {};
        const length = await this.tests.count(query);
        const limit = 100;
        let skips = 0;
        while (skips <= length) {
            const tests = await this.tests.find(query).skip(skips).limit(limit);
            await Promise.all(tests.map(async test => {
                test.userId = test.userId || null;
                test.clientId = test.clientId || null;
                await test.save();
            }));
            skips += 100;
            console.log(`************ ${skips} tests have been processed`);
        }
        console.log("############ All tests Processed");
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

    getMap2() {
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

    getMap1() {
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

        //let dataMap = this.getMap1();
        let dataMap = this.getMap2();
        questionData.map((ques) => {

            this.questions.findOne({ _id: mongoose.Types.ObjectId(ques.qId.qId) }, async (err, doc) => {
                let codes = [];
                dataMap.get(ques.qId.questionSerialNo).map(c => {
                   codes.push(c);
                });
                let conceptIds = await this.getConceptIdsByCodes(codes);
                let allConcepts = conceptIds.map(concept => concept._id);
                doc.conceptCode = codes;
                doc.conceptId = allConcepts;

                doc.save(function(err) {
                    if(err) console.log("err: ", err);
                    console.log("updated");
                });
            });

        });
    }

    getQuestionsForTest() {

        // 1 => 5ace202c9fe7b01d5806baf3
        // 2 => 5ace202c9fe7b01d5806baf6
        return this.tests.aggregate([
            {
                "$match": {
                    "_id": mongoose.Types.ObjectId("5ace202c9fe7b01d5806baf3")
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

    getConceptIdsByCodes(codes) {
        return this.concepts.find({ conceptCode: { $in: codes }}, { _id: 1} )
        .exec();
    }

    async moveSubjectChapterConceptToElastic() {

        await this.elasticClient.indices.exists({
            index: 'cms-subjects-chapters-concepts',
        }) ? await this.elasticClient.indices.delete({
            index: 'cms-subjects-chapters-concepts',
        }) : '';

        await this.elasticClient.indices.exists({
            index: 'cms-subjects-chapters',
        }) ? await this.elasticClient.indices.delete({
            index: 'cms-subjects-chapters',
        }) : '';

        await this.elasticClient.indices.exists({
            index: 'cms-subjects',
        }) ? await this.elasticClient.indices.delete({
            index: 'cms-subjects',
        }) : '';

        await this.moveSubjectsToElastic();
        await this.movesubjectChapterToElastic();
        await this.movesubjectChapterConceptToElastic();
    }


    async moveSubjectsToElastic() {
        let subjects = await this.getAllSubjects();
        await this.checkSubjectOnlyIndex();
        await this.pushSubjectsToElastic(subjects);
    }

    async movesubjectChapterToElastic() {
        let subjectAndChapter = await this.getsubjectAndChapter();
        await this.checkSubChapIndex();
        await this.pushSubChapToElastic(subjectAndChapter);
    }

    async movesubjectChapterConceptToElastic() {
        let subjectChapterAndConcept = await this.getsubjectChapterAndConcept();
        await this.checkSubChapConIndex();
        await this.pushSubChapConToElastic(subjectChapterAndConcept);
    }


    getAllSubjects() {
        return this.subjects.find({}, {"_id": 1, "name": 1}).exec()
    }

    getsubjectAndChapter() {
        return this.chapters.aggregate([
            {
                "$project": {
                    "chapterId": "$_id",
                    "chapterName": "$name",
                    "subjectId": "$subject.id",
                    "subjectName": "$subject.name"
                }
            }
        ])
    }

    getsubjectChapterAndConcept() {
        return this.concepts.aggregate([
            {
                "$project": {
                    "conceptId": "$_id",
                    "conceptName": "$name",
                    "chapterId": "$chapter.id",
                    "chapterName": "$chapter.name",
                    "subjectId": "$subject.id",
                    "subjectName": "$subject.name",
                    "conceptCode": 1
                }
            }
        ])
    }

    checkSubChapIndex() {
        return new Promise((resolve, reject) => {
            this.elasticClient.indices.exists({
                index: 'cms-subjects-chapters'
            }).then((indexExists) => {
                if(!indexExists) {
                    this.createSubjectChapterIndex(resolve, reject);
                } else
                    resolve();
            });
        });
    }

    checkSubChapConIndex() {
        return new Promise((resolve, reject) => {
            this.elasticClient.indices.exists({
                index: 'cms-subjects-chapters-concepts'
            }).then((indexExists) => {
                if(!indexExists) {
                    this.createSubjectChapterConceptIndex(resolve, reject);
                } else
                    resolve();
            });
        });
    }

    checkSubjectOnlyIndex() {
        return new Promise((resolve, reject) => {
            this.elasticClient.indices.exists({
                index: 'cms-subjects'
            }).then((indexExists) => {
                if(!indexExists) {
                    this.createSubjectIndex(resolve, reject);
                } else
                    resolve();
            });
        });
    }

    createSubjectChapterConceptIndex(resolve, reject) {
        this.elasticClient.indices.create({
            index: 'cms-subjects-chapters-concepts',
            body: {
                settings: {
                    "analysis": {
                        "tokenizer": MigrateController.gethamaraTokenizer(),
                        "analyzer": MigrateController.hamaraAnalyzer()
                    }
                },
                mappings: {
                    "cms-subjects-chapters-concepts": {
                        "properties": {
                            "conceptName": {
                                "type": "text",
                                analyzer: "hamaraAnalyzer",
                                search_analyzer: "hamamraDoAnalyzer"
                            },
                            "conceptCode": {
                                "type": "text",
                                analyzer: "hamaraAnalyzer",
                                search_analyzer: "hamamraDoAnalyzer"
                            },
                            "chapterName": {
                                "type": "text",
                                analyzer: "hamaraAnalyzer",
                                search_analyzer: "hamamraDoAnalyzer"
                            },
                            "subjectName": {
                                "type": "text",
                                analyzer: "hamaraAnalyzer",
                                search_analyzer: "hamamraDoAnalyzer"
                            }
                        }
                    }
                }
            }
        }, (err, resp, status) => {
            console.log("err : ", err);
            console.log("resp : ", resp);
            console.log("status : ", status);
            err ? reject(): resolve();
        });
    }


    createSubjectChapterIndex(resolve, reject) {
        this.elasticClient.indices.create({
            index: 'cms-subjects-chapters',
            body: {
                settings: {
                    "analysis": {
                        "tokenizer": MigrateController.gethamaraTokenizer(),
                        "analyzer": MigrateController.hamaraAnalyzer()
                    }
                },
                mappings: {
                    "cms-subjects-chapters": {
                        "properties": {
                            "chapterName": {
                                "type": "text",
                                analyzer: "hamaraAnalyzer",
                                search_analyzer: "hamamraDoAnalyzer"
                            },
                            "subjectName": {
                                "type": "text",
                                analyzer: "hamaraAnalyzer",
                                search_analyzer: "hamamraDoAnalyzer"
                            }
                        }
                    }
                }
            }
        }, (err, resp, status) => {
            console.log("err : ", err);
            console.log("resp : ", resp);
            console.log("status : ", status);
            err ? reject(): resolve();
        });
    }


    createSubjectIndex(resolve, reject) {
        this.elasticClient.indices.create({
            index: 'cms-subjects',
            body: {
                settings: {
                    "analysis": {
                        "tokenizer": MigrateController.gethamaraTokenizer(),
                        "analyzer": MigrateController.hamaraAnalyzer()
                    }
                },
                mappings: {
                    "cms-subjects": {
                        "properties": {
                            "name": {
                                "type": "text",
                                analyzer: "hamaraAnalyzer",
                                search_analyzer: "hamamraDoAnalyzer"
                            }
                        }
                    }
                }
            }
        }, (err, resp, status) => {
            console.log("err : ", err);
            console.log("resp : ", resp);
            console.log("status : ", status);
            err ? reject(): resolve();
        });
    }

    static hamaraAnalyzer() {
        return {
            "hamaraAnalyzer": {
                "type": "custom",
                "tokenizer": "hamaraTokeniser",
                "filter": [
                    "lowercase"
                ]
            },
            "hamamraDoAnalyzer": {
                "type": "standard"
            }
        };
    }

    static gethamaraTokenizer() {
        return {
            "hamaraTokeniser": {
                "type": "edge_ngram",
                "min_gram": 2,
                "max_gram": 256,
                "token_chars": [
                    "letter", "digit"
                ]
            }
        };
    }

    pushSubjectsToElastic(subjects) {
        let bulkData = [];
        subjects.map(subject => {
            bulkData.push({ index: { _index: 'cms-subjects', _type: 'cms-subjects', _id: subject._id } }, {
                'subjectId': subject._id,
                'name': subject.name
            });
        });

        return new Promise((resolve) => {
            this.elasticClient.bulk({
                maxRetries: 5,
                index: 'cms-subjects',
                body: bulkData
            }, (err, resp, status) => {
                if (err) {
                    console.log(err);
                } else {
                    //console.log("docs : ", resp.items);
                    resolve();
                }
            })
        });
    }

    pushSubChapToElastic(subjectAndChapter) {
        let bulkData = [];
        subjectAndChapter.map(doc => {
            bulkData.push({ index: { _index: 'cms-subjects-chapters', _type: 'cms-subjects-chapters', _id: `${doc.subjectId}-${doc.chapterId}`  } }, {
                'chapterId': doc.chapterId,
                'chapterName': doc.chapterName,
                'subjectId': doc.subjectId,
                'subjectName': doc.subjectName
            });
        });

        return new Promise((resolve) => {
            this.elasticClient.bulk({
                maxRetries: 5,
                index: 'cms-subjects-chapters',
                body: bulkData
            }, (err, resp, status) => {
                if (err) {
                    console.log(err);
                } else {
                    // console.log("docs : ", resp.items);
                    resolve();
                }
            })
        });
    }

    pushSubChapConToElastic(subjectChapterAndConcept) {
        let bulkData = [];
        subjectChapterAndConcept.map(doc => {
            bulkData.push({ index: { _index: 'cms-subjects-chapters-concepts', _type: 'cms-subjects-chapters-concepts', _id: `${doc.subjectId}-${doc.chapterId}-${doc.conceptId}` } }, {
                'conceptId': doc.conceptId,
                'conceptCode': doc.conceptCode,
                'conceptName': doc.conceptName,
                'chapterId': doc.chapterId,
                'chapterName': doc.chapterName,
                'subjectId': doc.subjectId,
                'subjectName': doc.subjectName
            });
        });

        return new Promise((resolve) => {
            this.elasticClient.bulk({
                maxRetries: 5,
                index: 'cms-subjects-chapters-concepts',
                body: bulkData
            }, (err, resp, status) => {
                if (err) {
                    console.log(err);
                } else {
                    //console.log("docs : ", resp.items);
                    resolve();
                }
            })
        });
    }

    publishContent() {
        let query = {}, options = { multi: true };

        this.questions.update(query, { status: "PUBLISHED" }, options, (err, doc) => {
            if(err) {
                this.loggerInstance.error(`publish Failure for question ${doc._id}`);
            }
        });


        this.tests.update(query, { status: "PUBLISHED" }, options, (err, doc) => {
            if(err) {
                this.loggerInstance.error(`publish Failure for tests ${doc._id}`);
            }
        });
    }

    createTestInfo(){
        return new Promise((resolve,reject)=>{ 
            let promises = [];
            ((that)=>{
                that.tests.find({'data.noOfSections':{'$ne':null}}).populate('data.sections.subSection.questions.qId',"conceptId").lean().exec(function(err,testList){
                    for(let test of testList){
                        let testInfoObj = new that.testInfo();
                        testInfoObj.testId = test._id;
                        let conceptIdArray = [];
                        test.data.sections.map((section)=>{
                            section.subSection.map((subS)=>{
                                subS.questions.map((question)=>{
                                    conceptIdArray = conceptIdArray.concat(question.qId.conceptId);
                                })
                            })
                        })
                        let conceptIdSet = Array.from(new Set(conceptIdArray));
                        console.log(conceptIdArray.length,conceptIdSet.length);
                        conceptIdSet.map((conceptId)=>{
                            let conceptMappingObj = {};
                            let qIdArray = [];
                            conceptMappingObj["conceptId"] = conceptId;
                            test.data.sections.map((section)=>{
                                section.subSection.map((subS)=>{
                                    subS.questions.map((question)=>{
                                        if(question.qId.conceptId.includes(conceptId)){
                                            qIdArray = qIdArray.concat(question.qId._id);
                                        }
                                    })
                                })
                            })
                            conceptMappingObj["questionId"] = qIdArray;
                            testInfoObj.conceptMapping.push(conceptMappingObj);
                        })
                        promises.push(new Promise((res,rej)=>{
                            testInfoObj.save(function(err){
                                if (err) {
                                    console.log(err);
                                }
                                res();
                            });
                        }));
                    }
                    Promise.all(promises).then(function () {
                        console.log("Complete",promises.length);
                        resolve();
                    })
                })   
            })(this)
        })
    }

    async addContentIdToContent() {
        this.audioContentIdUpdate();
        this.formulaContentIdUpdate();
        this.questionContentIdUpdate();
        this.materialContentIdUpdate();
        this.testContentIdUpdate();
        this.videoContentIdUpdate();
    }

    async audioContentIdUpdate() {
        let maxContentId = await this.getMaxContentId("Audio");
        this.audios.find({ contentId: { "$exists": false } }, (err, docs) => {
            docs.map(doc => {
                doc.contentId = !maxContentId ? 'A-1': `${maxContentId.split("-")[0]}-${(parseInt(maxContentId.split("-")[1]) + 1)}`;
                maxContentId = doc.contentId;
                doc.save(err => {
                    if(err) {
                        this.loggerInstance.error(`Error in content id updation ${err}`);
                    }
                });
            });
        });
    }

    async formulaContentIdUpdate() {
        let maxContentId = await this.getMaxContentId("Formula");
        this.formula.find({ contentId: { "$exists": false }, publishId: { "$exists": false } }, (err, docs) => {
            docs.map(doc => {
                doc.contentId = !maxContentId ? 'F-1': `${maxContentId.split("-")[0]}-${(parseInt(maxContentId.split("-")[1]) + 1)}`;
                maxContentId = doc.contentId;
                doc.save(err => {
                    if(err) {
                        this.loggerInstance.error(`Error in content id updation ${err}`);
                    }
                });
            });
        });
    }

    async questionContentIdUpdate() {
        let maxContentId = await this.getMaxContentId("Question");

        this.questions.find({ publishId: { "$exists": false } }, { contentId : 1 }, (err, docs) => {
            docs.map((doc) => {
                doc.contentId = !maxContentId ? 'Q-1': `${maxContentId.split("-")[0]}-${(parseInt(maxContentId.split("-")[1]) + 1)}`;
                maxContentId = doc.contentId;
                doc.save(err => {
                    if(err) {
                        this.loggerInstance.error(`Error in content id updation ${err}`);
                    }
                });
            });
        });
    }

    async materialContentIdUpdate() {
        let maxContentId = await this.getMaxContentId("StudyMaterial");
        this.studyMaterial.find({ contentId: { "$exists": false }, publishId: { "$exists": false } }, (err, docs) => {
            docs.map(doc => {
                doc.contentId = !maxContentId ? 'M-1': `${maxContentId.split("-")[0]}-${(parseInt(maxContentId.split("-")[1]) + 1)}`;
                maxContentId = doc.contentId;
                doc.save(err => {
                    if(err) {
                        this.loggerInstance.error(`Error in content id updation ${err}`);
                    }
                });
            });
        });
    }

    async testContentIdUpdate() {
        let maxContentId = await this.getMaxContentId("Tests");
        this.tests.find({ contentId: { "$exists": false }, publishId: { "$exists": false } }, (err, docs) => {
            docs.map((doc, index) => {
                doc.contentId = !maxContentId ? 'T-1': `${maxContentId.split("-")[0]}-${(parseInt(maxContentId.split("-")[1]) + 1)}`;
                maxContentId = doc.contentId;
                doc.save(err => {
                    if(err) {
                        this.loggerInstance.error(`Error in content id updation ${err}`);
                    }
                });
            });
        });
    }

    async videoContentIdUpdate() {
        let maxContentId = await this.getMaxContentId("Video");
        this.videos.find({ contentId: { "$exists": false }, publishId: { "$exists": false } }, (err, docs) => {
            docs.map(doc => {
                doc.contentId = !maxContentId ? 'V-1': `${maxContentId.split("-")[0]}-${(parseInt(maxContentId.split("-")[1]) + 1)}`;
                maxContentId = doc.contentId;
                doc.save(err => {
                    if(err) {
                        this.loggerInstance.error(`Error in content id updation ${err}`);
                    }
                });
            });
        });
    }

    getMaxContentId(collType) {
        return new Promise((resolve, reject) => {
            mongoose.models[collType].find({}).sort({_id:-1}).limit(1).exec((err, doc) => {
                const lastId = doc[0] ? doc[0].contentId : undefined;
                err ? reject(err) : resolve(lastId);
            });
        });
    }

    mcqOperation() {
        this.questions.find({ questionCode: { $in: [ 0, 8 ] } } , { questionType: 1, questionCode: 1}, (err, docs) => {
           docs.map(doc => {
              /*doc.content.correctAnswer.data.length > 1 ? (doc.questionType = "MMCQ", doc.questionCode = 8) : (doc.questionType = "SMCQ", doc.questionCode = 0);*/
            doc.questionType = doc.questionCode === 0 ? "SMCQ" : "MMCQ";
            doc.save();
           });
        });
    }

    getTestObj(uniqueId, name) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.tests.findOneAndUpdate({ 'uploadDetail.uniqueId': uniqueId },{'$set':{'name':name,'displayName':name}}, function (err, test) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        console.log(uniqueId);
                        resolve(test);
                    }
                })

            })(this)
        })
    }
    getCourseItem(testId){
        return new Promise((resolve,reject)=>{
            ((that)=>{
                that.courseItem.find({'$or':[{'details.schedule.paperDetail.id':testId},
                                            {'details.tests.paperDetail.id':testId}]}).lean().exec(function(err,courseItemList){
                    if(err){
                        reject(err);
                    }
                    else{
                        resolve(courseItemList);
                    }
                })
            })(this)
        })
    }
    updateCourseItem(courseItemObj){
        return new Promise((resolve,reject)=>{
            ((that)=>{
                that.courseItem.findOneAndUpdate({_id:courseItemObj._id},courseItemObj,function(err,data){
                    if(err){
                        reject(err);
                    }
                    else{
                        console.log(courseItemObj._id);
                        resolve(data);
                    }
                })
            })(this)
        })
    }
    async paperNameChange() {
        for (let paperObj of paperName.PaperList) {
            let test = await this.getTestObj(paperObj.uniqueId, paperObj.name);
            if (test) {
                let courseItemList = await this.getCourseItem(test._id);
                for (let courseItemObj of courseItemList) {
                    courseItemObj.userId = null;
                    if (courseItemObj.details.schedule) {
                        courseItemObj.details.schedule = courseItemObj.details.schedule.map((sTest) => {
                            if (sTest.paperDetail.id.equals(test._id)) {
                                sTest.displayName = paperObj.name
                                sTest.paperDetail.name = paperObj.name
                            }
                            return sTest;
                        })
                    }
                    else if (courseItemObj.details.tests) {
                        courseItemObj.details.tests = courseItemObj.details.tests.map((cTest) => {
                            if (cTest.paperDetail.id.equals(test._id)) {
                                cTest.displayName = paperObj.name
                                cTest.paperDetail.name = paperObj.name
                            }
                            return cTest;
                        })
                    }
                    let farziStatus = await this.updateCourseItem(courseItemObj)
                }
            }
        }
    }
    async findingMissingTestCourse() {
        const testWithCourseItems = await this.getMissingTestAndCourseItems();
        const testNameMap = new Map();
        const testUidMap = new Map();
        const courseItemsSet = new Set();
        testWithCourseItems.map(row => {
            courseItemsSet.add(mongoose.Types.ObjectId(row._id));
            row.allTests.map((v, i) => {
                testNameMap.set(v, row.testNames[i]);
                testUidMap.set(v, row.uniqueIds[i]);
            });
        });
        const courseNamesByCourseItem = await this.getCourseNamesByItems([...courseItemsSet]);
        courseNamesByCourseItem.map(c => {
            c.allTest = testWithCourseItems.filter(t => t._id.toString() === c.item.toString())[0].allTests;
            console.log(JSON.stringify(c.allTest));

            c.allTest = c.allTest.reduce((acc, test) => { acc.push({"name": testNameMap.get(test), "uid": testUidMap.get(test) }); return acc}, []);
        });

        let finalMapTestWise = [];
        courseNamesByCourseItem.map(data => {
            data.allTest.map(d => {
                !finalMapTestWise.find(y => y.name === d.name) ? finalMapTestWise.push({ name : d.name }) : '';
                let dataObj = finalMapTestWise.find(y => y.name === d.name);
                !dataObj.courses ? dataObj.courses = []: '';
                dataObj.courses.push({uid: d.uid, courses: data.name});
            })
        });

        console.log(" finalMapTestWise : ", JSON.stringify(finalMapTestWise));
    }

    getCourseNamesByItems(courseItems) {
            return this.course.aggregate([
            { "$unwind": "$courseItems"},
            {
                "$match": {
                    "courseItems.id": {
                        $in: courseItems
                    }
                }
            },
            {
                "$project": {
                    "name": 1,
                    "item": "$courseItems.id"
                }
            }
        ])
    }

    getMissingTestAndCourseItems() {
        return this.courseItem.aggregate([
            {
                "$match": {
                    "details.tests.1" : { "$exists": true}
                }
            },
            {
                "$project": {
                    "testsId": "$details.tests.paperDetail.id"
                }
            },
            {
                "$unwind": "$testsId"
            },
            {
                "$lookup": {
                    "from": "tests",
                    "localField": "testsId",
                    "foreignField": "_id",
                    "as": "testData"
                }
            },
            {
                "$match": {
                    "testData.uploadDetail.uniqueId": {
                        "$in": [
                            "CT-JA-555","CT-JA-556","CT-JA-557","CT-JA-558","CT-JA-559","CT-JA-560","CT-JA-561","CT-JA-562",
                            "CT-JA-563","CT-JA-564","CT-JA-565","CT-JA-566","CT-JA-567","CT-JA-568","CT-JA-569","CT-JA-570",
                            "CT-JA-571","CT-JA-572","CT-JA-573","CT-JA-574","CT-JA-575","CT-JA-576","CT-JA-577","CT-JA-578",
                            "CT-JA-579","CT-JA-580","CT-JA-581","CT-JA-582","CT-JA-583","CT-JA-584","CT-JA-585","CT-JA-586",
                            "CT-JA-587","CT-JA-588","CT-JA-589","CT-JA-590","CT-JA-591","CT-JA-592","CT-JA-593","CT-JA-594",
                            "CT-JA-595", "CT-BS-341","CT-BS-342","CT-BS-347","CT-BS-348","CT-BS-349","CT-BS-454","CT-BS-498","CT-BS-503","CT-BS-504"
                        ]
                    }
                }
            },
            {
                "$project": {
                    "test":  { $arrayElemAt: [ "$testData", 0 ] },
                    "courseitem": "$_id",

                }
            },
            {
                "$project": {
                    "testName":  "$test.name",
                    "testId":  "$test._id",
                    "courseitem": 1,
                    "uniqueIds" : "$test.uploadDetail.uniqueId",
                    "_id": 0
                }
            },
            {
                "$group": {
                    "_id": "$courseitem",
                    "allTests" : { "$addToSet": "$testId"},
                    "testNames" : { "$addToSet": "$testName"},
                    "uniqueIds" : { "$addToSet": "$uniqueIds"}
                }
            }
        ]);
    }

    getQuestionList(count){
        return new Promise((resolve,reject)=>{
            ((that)=>{
                that.questions.find({}).skip(count*1000).limit(1000).lean().exec(function(err,questionList){
                    if(err){
                        reject(err)
                    }
                    else{
                        resolve(questionList)
                    }
                })

            })(this)
        })
    }
    updateQuestionObject(question) {
        return new Promise((resolve, reject) => {
            question["difficultyLevel"] = [];
            question["difficultyType"] = [];
            question.userId = null;
            let difficultyLevelArray = ["easy", "medium", "difficult"];
            let difficultyTypeArray = ["conceptual", "theoretical", "ultimate"];
            if (question.level.length !== 0) {
                difficultyLevelArray.map((dLevel)=>{
                    if(question.level.toLowerCase().includes(dLevel)){
                        question.difficultyLevel.push(dLevel)
                    }
                });
                difficultyTypeArray.map((dType)=>{
                    if(question.level.toLowerCase().includes(dType)){
                        question.difficultyType.push(dType)
                    }
                });
                ((that) => {
                    that.questions.findOneAndUpdate({ _id: question._id }, question, function (err, data) {
                        if (err) {
                            reject(err)
                        }
                        else {
                            resolve(data)
                        }
                    })
                })(this)
            }
            else{
                console.log("Question doesn't have level");
                resolve()
            }
        })
    }

    getQuestionCount(){
        return new Promise((resolve,reject)=>{
            ((that)=>{
                that.questions.find().count().exec(function(err,count){
                    err ? reject(err):resolve(count)
                })
            })(this)
        })
    }
    async updateLevel(){
        ((that)=>{
            return new Promise(async function(resolve,reject){
                let questionCount = await that.getQuestionCount();
                let counter = questionCount/1000;
                for(let count=0;count<=counter;count++){
                    let questionList = await that.getQuestionList(count);
                    for(let question of questionList){
                        console.log(question._id);
                        let farziQuestionUpdateStatus = await that.updateQuestionObject(question)
                    }
                }
                console.log("All Question Updated");
                resolve();
            })
        })(this)
    }

    removeWrongAnswers() {
        this.questions.find({}, 'content', (err, docs) => {
           docs.map(doc => {
               doc.content.length > 0 && doc.content.map(con => {
                   let optionSet = new Set();
                   let corrAns = con.correctAnswer.data;
                   con.optionsContent.map(op => optionSet.add(op.id));
                   if(con.correctAnswer && con.correctAnswer.data && con.correctAnswer.data.length > 0)
                    corrAns = con.correctAnswer.data.filter(ans => optionSet.has(ans.value));

                   if(con.correctAnswer.data.length !== corrAns.length) {
                       con.correctAnswer.data = corrAns;
                       doc.save((err) => err ? console.log("err : ", err): console.log("done for ques"));
                   } else
                       console.log("no need");
               });
           });
        });
    }

    async migrateToNewRoles() {
        return new Promise(async (resolve, reject) => {
            try {
                /*
                ** Client and center for myPAT
                */
               let client = await this.client.findOne({
                   name: 'myPat'
               });
               client = client || new this.client({
                    name: 'myPat',
                    address: 'N 161 A, Saira Tower, 2nd Floor Gulmohar Commercial Complex, New Delhi – 110049',
                    subjects: [
                        "Mathematics",
                        "LOGICAL REASONING",
                        "Biology",
                        "Physics",
                        "Chemistry",
                        "English",
                        "Social Science",
                        "MAT"
                    ]
                });
                const newClient = await client.save();
                let orgCenter = await this.orgCenter.findOne({
                    name: 'MyPAT HQ',
                    clientId: newClient._id
                });
                orgCenter = orgCenter || new this.orgCenter({
                    name: 'MyPAT HQ',
                    code: 'mypat',
                    address: 'Kalusarai, Sarvapriya Vihar',
                    clientId: newClient._id
                });
                const newOrgCenter = await orgCenter.save();
                /*
                ** Role for myPAT internal users
                */
                const newRole = new this.roles({
                    role: 'contenthead',
                    description: 'Head of the content for mypat',
                    allowAll: true,
                    featureLevelPermissions: [
                        {
                            "featureType": "CONTENT",
                            "accessAllowed": [
                                "CREATE",
                                "UPDATE",
                                "VIEW",
                                "EDIT",
                                "VALIDATE",
                                "PUBLISH"
                            ]
                        },
                        {
                            "featureType": "LANGUAGE",
                            "accessAllowed": [
                                "CREATE",
                                "UPDATE",
                                "VIEW",
                                "EDIT",
                                "VALIDATE",
                                "PUBLISH"
                            ]
                        },
                        {
                            "featureType": "TAG",
                            "accessAllowed": [
                                "CREATE",
                                "UPDATE",
                                "VIEW",
                                "EDIT",
                                "VALIDATE",
                                "PUBLISH"
                            ]
                        },
                        {
                            "featureType": "CLIENT",
                            "accessAllowed": [
                                "VIEW"
                            ]
                        },
                        {
                            "featureType": "GRADE",
                            "accessAllowed": [
                                "CREATE",
                                "UPDATE",
                                "VIEW",
                                "EDIT",
                                "VALIDATE",
                                "PUBLISH"
                            ]
                        },
                        {
                            "featureType": "TESTTYPE",
                            "accessAllowed": [
                                "CREATE",
                                "UPDATE",
                                "VIEW",
                                "EDIT",
                                "VALIDATE",
                                "PUBLISH"
                            ]
                        },
                        {
                            "featureType": "USER",
                            "accessAllowed": [
                                "VIEW",
                                "VALIDATE"
                            ]
                        }
                    ],
                    contentPermissions: [
                        {
                            "featureType": "CONTENT",
                            "orgPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ],
                            "centerPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "SHARE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ],
                            "subjectPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "SHARE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ]
                        },
                        {
                            "featureType": "CONTENTSETTING",
                            "orgPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ],
                            "centerPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "SHARE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ],
                            "subjectPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "SHARE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ]
                        },
                        {
                            "featureType": "COURSE",
                            "orgPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ],
                            "centerPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "SHARE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ],
                            "subjectPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "SHARE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ]
                        },
                        {
                            "featureType": "PACKAGE",
                            "orgPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ],
                            "centerPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "SHARE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ],
                            "subjectPermissions": [
                                {
                                    "type": [
                                        "CREATE",
                                        "UPDATE",
                                        "DELETE",
                                        "SHARE",
                                        "VIEW",
                                        "PUBLISH",
                                        "EDIT",
                                        "VALIDATE"
                                    ],
                                    "level": "ALL"
                                }
                            ]
                        }
                    ]
                });
                await newRole.save();
                console.log(`Content Head role for mypat created with id ${newRole._id}`);
                const allUsers = await this.User.find();
                await Promise.all(allUsers.map(async user => {
                    user.role = newRole._id;
                    user.clientId = newClient._id;
                    user.centers = [newOrgCenter.code];
                    await user.save();
                    console.log(`${user._id} Migrated to new Role`)
                }));
                console.log("All users migrated to new Roles and ACL Data");
                
                const mypatMasterUser = await this.User.findOne({
                    "email": "vishal.srivastava@edfora.com"
                }, { 'email' : 1 });
                if (!mypatMasterUser) {
                    return reject('User with Mr. Vishal\`s email not found');
                }
                const {
                    _id, email
                } = mypatMasterUser;
                const userData = {
                    id: _id,
                    email
                };
                console.log("Following Data will be inserted in all content", userData);
                /* Insertion of ACL Metadata in Content begins */
                const allContents = [
                    this.questions
                    , this.tests
                    , this.audios
                    , this.videos
                    , this.studyMaterial
                    , this.formula
                ];
                await Promise.all(allContents.map(async content => {
                    const length = await content.count();
                    console.log(`We have a total of ${length} count`);
                    const limit = 100;
                    let skips = 0;
                    while (skips <= length) {
                        const allData = await content.find().skip(skips).limit(limit);
                        await Promise.all(allData.map(async doc => {
                            const subjects = await this.subjects.find({
                                _id: {$in: doc.subjects.map(s => s.subjectId)}
                            }, { name: 1 });
                            doc.aclMetaData = {
                                createdBy: userData,
                                updatedBy: userData,
                                clientId: newClient._id,
                                allowedTo: [],
                                subjects: subjects.map(s => s.name.toLowerCase()),
                                centers: [newOrgCenter.code]
                            }
                            await doc.save();
                        }));
                        skips += 100;
                        console.log(`************ ${skips} documents have been processed`);
                    }
                }));
                return resolve();
            } catch (error) {
                console.log(error);
                return reject(error);
            }
        });
    }

    async createFIITJEERolesAndOrg() {
        return new Promise(async (resolve, reject) => {
            try {
                /*
                ** Client and center for FIITJEE
                */
                let client = await this.client.findOne({
                    name: 'fiitjee'
                });
                client = client || new this.client({
                    name: 'fiitjee',
                    address: 'FIITJEE HOUSE, 29-A, KALU SARAI SARVAPRIYA VIHAR NEW DELHI - 110016',
                    subjects: [
                        "physics",
                        "chemistry",
                        "maths"
                    ]
                });
                const newClient = await client.save();
                console.log(`FIITJEE Org Created with Org ID ${newClient._id}`);
                /*
                ** Role for FIITJEE users
                ** teacher, centerhead, hod, nationalhead
                */
                const allAccesses = [
                    "CREATE",
                    "UPDATE",
                    "VIEW",
                    "EDIT",
                    "VALIDATE",
                    "PUBLISH"
                ];
                const permissionLevels = {
                    all: [{
                        "type": allAccesses,
                        "level": "ALL"
                    }],
                    partial: [{
                        "type": allAccesses,
                        "level": "PARTIAL"
                    }]
                };
                const roles = [{
                    name: 'teacher',
                    role: {
                        clientId: newClient._id,
                        role: 'teacher',
                        description: 'Subject Teacher for FIITJEE',
                        allowAll: false,
                        featureLevelPermissions: [
                            {
                                "featureType": "CONTENT",
                                "accessAllowed": allAccesses
                            }
                        ],
                        contentPermissions: [
                            {
                                "featureType": "CONTENT",
                                "orgPermissions": permissionLevels.partial,
                                "centerPermissions": permissionLevels.partial,
                                "subjectPermissions": permissionLevels.partial
                            }
                        ]
                    }
                }, {
                    name: 'centerhead',
                    role: {
                        clientId: newClient._id,
                        role: 'centerhead',
                        description: 'Center Head for FIITJEE',
                        allowAll: false,
                        featureLevelPermissions: [
                            {
                                "featureType": "CONTENT",
                                "accessAllowed": allAccesses
                            }
                        ],
                        contentPermissions: [
                            {
                                "featureType": "CONTENT",
                                "orgPermissions": permissionLevels.partial,
                                "centerPermissions": permissionLevels.partial,
                                "subjectPermissions": permissionLevels.all
                            }
                        ]
                    }
                }, {
                    name: 'hod',
                    role: {
                        clientId: newClient._id,
                        role: 'hod',
                        description: 'HOD for FIITJEE',
                        allowAll: false,
                        featureLevelPermissions: [
                            {
                                "featureType": "CONTENT",
                                "accessAllowed": allAccesses
                            }
                        ],
                        contentPermissions: [
                            {
                                "featureType": "CONTENT",
                                "orgPermissions": permissionLevels.partial,
                                "centerPermissions": permissionLevels.all,
                                "subjectPermissions": permissionLevels.partial
                            }
                        ]
                    }
                }, {
                    name: 'nationalhead',
                    role: {
                        clientId: newClient._id,
                        role: 'nationalhead',
                        description: 'National Head for FIITJEE',
                        allowAll: false,
                        featureLevelPermissions: [
                            {
                                "featureType": "CONTENT",
                                "accessAllowed": allAccesses
                            }
                        ],
                        contentPermissions: [
                            {
                                "featureType": "CONTENT",
                                "orgPermissions": permissionLevels.partial,
                                "centerPermissions": permissionLevels.all,
                                "subjectPermissions": permissionLevels.all
                            }
                        ]
                    }
                }];
                await Promise.all(roles.map(async r => {
                    let fiitjeeRole = await this.roles.findOne({
                        clientId: newClient._id,
                        role: r.name
                    });
                    fiitjeeRole = fiitjeeRole || new this.roles(r.role);
                    await fiitjeeRole.save();
                    console.log(`Role ${r.name} created for FIITJEE`);
                }));
                return resolve();
            } catch (error) {
                console.log(error);
                return reject(error);
            }
        });
    }

}