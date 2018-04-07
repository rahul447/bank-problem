"use strict";
import tests from "./testSummary.model";
import courses from "../course/course.model";
import { ResponseController } from "../../util/response.controller";

export class TestSummaryController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = tests;
        this.courseModelInstance = courses;
    }

    getTestQuestionsWithConcepts(req, res) {
        let testId = req.params.testId;
        this.modelInstance.findOne({ testId: testId})
            .populate('concepts.questions testId')
            .then(testSummary => {
                if (!testSummary) {
                    return res.json(new ResponseController(404, "Test summary not found"));
                }
                let syllabus = testSummary.testId.syllabus.text;
                let questionMarksMap = this.getQuestionMarksMap(testSummary.testId.data);
                let questionList = [];
                testSummary.concepts.map(concept => {
                    concept.questions.map(question => {
                        let newQuestion = questionList.find(item => {
                            return item.question._id === question._id;
                        });
                        let newConcept = {
                            id: concept.id,
                            name: concept.name
                        };
                        let questionSummary = {
                            id: question._id,
                            question: question.content[0].questionContent,
                            type: question.questionType,
                            choices: question.content[0].optionsContent,
                            matrixOptions: question.content[0].matrixOptionContent,
                            correctAnswer: question.content[0].correctAnswer,
                            solution: question.content[0].solutionContent,
                            positiveMarks: questionMarksMap[question._id].positiveMarks,
                            negativeMarks: questionMarksMap[question._id].negativeMarks
                        }
                        newQuestion ? newQuestion.concepts.push(newConcept) : questionList.push({
                            question: questionSummary,
                            concepts: [newConcept]
                        });
                    });
                });
                questionList = questionList.map(question => {
                    let obj = question.question;
                    obj.description = question.concepts.map(concept => concept.name).join(', ');
                    return obj;
                });
                return res.json(new ResponseController(200, "Test summary retrieved", {
                    syllabus: syllabus,
                    questionList: questionList
                }));
            })
            .catch(err => {
                this.loggerInstance.error("Error in retrieving test summary", err);
                return res.json(new ResponseController(500, "Error in retrieving test summary"));
            })
    }

    getQuestionMarksMap (testData) {
        let questionMarksMap = {};
        testData.sections.map(section => {
            section.subSection.map(subSection => {
                let marksObj = {
                    positiveMarks: subSection.positiveMarks,
                    negativeMarks: subSection.negativeMarks
                }
                subSection.questions.map(question => {
                    questionMarksMap[question.qId] = marksObj;
                });
            })
        });
        return questionMarksMap;
    }

    async getTestsWithSyllabus (req, res) {
        try {
            // let courses = await this.courseModelInstance
            //     .find({'courseType.id': req.body.courseType})
            //     .select('_id');
            // let courseIds = courses.map(course => course._id);
            let query = {};
            if (req.body.courseId){
                query.courseId = req.body.courseId;
            }
            const {
                limit, offset, $in, $nin
            } = req.body;
            const page = parseInt(offset, 10) || 1;
            const pageSize = parseInt(limit, 10) || 10;
            const skips = pageSize * (page - 1);
            // query.testType = req.body.testType || 'concept';
            query.subjects = {$size: 1};
            query['subjects.id'] = {$in: req.body.subjectId};
            if ($in) {
                query.testId = { $in : $in };
            }
            if ($nin) {
                query.testId = { $nin: $nin };
            }
            console.log(req.body.sort);
            let tests = await this.modelInstance.find(query)
                                .populate('testId').skip(skips).limit(pageSize).sort(req.body.sort);
            let respTests = tests.map(test => {
                let respTest = {};
                respTest._id = test.testId._id;
                respTest.name = test.testId.name;
                respTest.courseId = test.courseId;
                respTest.testType = test.testId.settings.testType;
                respTest.description = test.concepts[0].name;
                respTest.testCode = test.testCode;
                return respTest;
            });
            return res.json(new ResponseController(200, "Tests listed successfully", respTests));
        } catch (error) {
            this.loggerInstance.error(error);
            return res.json(new ResponseController(500, "Unable to get tests"));
        }
    }

    async getTestConcepts(req, res) {
        try {
            let testSummary = await this.modelInstance.findOne({ testId: req.params.id }).populate('testId');
            const syllabus = testSummary.concepts.map(concept => concept.name).join(', ');
            const testType = testSummary.testId.settings.testType;
            const duration = testSummary.testId.settings.duration;
            const originalSyllabus = testSummary.testId.syllabus.text;
            const subject = testSummary.subjects[0].name;
            return res.json(new ResponseController(200, "Test concept names retrieved", {
                syllabus,
                testType,
                duration,
                originalSyllabus,
                subject
            }));
        } catch (error) {
            this.loggerInstance.error("Error in retrieving test summary", error);
            return res.json(new ResponseController(500, "Error in retrieving test summary"));
        }
    }
}