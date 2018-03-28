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

}