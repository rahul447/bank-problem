"use strict";
import tests from "./testSummary.model";
import { ResponseController } from "../../util/response.controller";
import { _ } from "lodash";

export class TestSummaryController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = tests;
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
}