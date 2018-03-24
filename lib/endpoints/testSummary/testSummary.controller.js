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
                            positiveMarks: questionMarksMap[question._id].positiveMarks,
                            negativeMarks: questionMarksMap[question._id].negativeMarks
                        }
                        newQuestion ? newQuestion.concepts.push(newConcept) : questionList.push({
                            question: questionSummary,
                            concepts: [newConcept]
                        });
                    });
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
            let courses = await this.courseModelInstance
                .find({'courseType.id': req.body.courseType})
                .select('_id');
            let courseIds = courses.map(course => course._id);
            let query = {};
            query.courseId = { $in: courseIds };
            const {
                limit, offset, $in, $nin
            } = req.body;
            const page = parseInt(offset, 10) || 1;
            const pageSize = parseInt(limit, 10) || 10;
            const skips = pageSize * (page - 1);
            query.subjects = { $size: 1 };
            query['subjects.0.id'] = req.body.subjectId;
            if ($in) {
                query.testId = { $in : $in };
            }
            if ($nin) {
                query.testId = { $nin: $nin };
            }
            let tests = await this.modelInstance.find(query)
                                .populate('testId').skip(skips).limit(pageSize);
            let respTests = tests.map(test => {
                let respTest = {};
                respTest._id = test.testId._id;
                respTest.name = test.testId.name;
                respTest.description = test.concepts[0].name;
                return respTest;
            });
            return res.json(new ResponseController(200, "Tests listed successfully", respTests));
        } catch (error) {
            this.loggerInstance.error(error);
            return res.json(new ResponseController(500, "Unable to get tests"));
        }
    }
}