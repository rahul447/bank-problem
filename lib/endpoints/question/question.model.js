'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
   // ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');

import values from "../../../config/values";

/**
 * Question Schema
 */

var QuestionSchema = new Schema({
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values
    },
    passageInfo:{
        totalQuestion:Number,
        thisQuestionNumber:Number
    },
    draftQuestionId: String,
    totalQuestion:Number,
    draftId: { type: mongoose.Schema.Types.ObjectId },
    publishId: { type: mongoose.Schema.Types.ObjectId },
    clientId: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    questionType: String,
    questionCode:Number,    // 0 for SMCQ
                            // 1 FOR MATRIX
                            // 2 FOR TRUE/FALSE
                            // 3 FOR FILL IN THE BLANKS
                            // 4 FOR DESCRIPTIVE
                            // 5 FOR PASSAGE
                            // 6 FOR NUMERIC
                            // 7 FOR INTEGER
                            // 8 FOR MMCQ

    content: [{
        passageQuestion:String,
        locale: String,
        questionContent: String,
        optionsContent: [],
        matrixOptionContent:{optionLeft:[],optionRight:[]},
        solutionContent: String,
        questionHints: String,
        correctAnswer: {
            answerType: String,
            data: []
        }
    }],
    tags: [{
        relation: {
            "name": String,          //tag name
            "id": { type: mongoose.Schema.Types.ObjectId, ref: "contentTag" }
        },
        type: {
            type: String, //date picker, list picker, number, text, type(question, test, video, audio)
            enum: values.tagAssociationTypes
        },
        values: []      // date value, array of list, number, string, objectIds
    }],
    level: String,
    type: String, //analytical and logical
    conceptId:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Concept'}],
    subjectId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject'}],
    chapterId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Chapter'}],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    passageId:String,
    conceptCode:[]
 });

QuestionSchema.plugin(mongoosePaginate);

QuestionSchema.methods.checkValidity = function() {

    let status = {'tolerance': true, 'conceptId': true, 'questionContent': true, 'solutionContent': true, 'correctAnswer': true, 'optionsContent': true, 'matrixOptionContent': true};
    let question = this;
    return new Promise((resolve) => {
        for (let key in question) {
            validate(key);
        }
        let invalid = [];
        for (const k in status) {
            if (!status[k]) {
                invalid.push(k);
            }
        }
        resolve(invalid);
    });

    function validate(key) {
        let quesType;
        if (key === "questionType") {
            quesType = question[key];
        }

        if (key === 'conceptId' && question[key].length === 0) {
            status.conceptId = false;
        }

        if (key === 'content') {

            question[key].map((contentVal) => {
                if (contentVal.questionContent.length === 0) {
                    status.questionContent = false;
                }
                if (contentVal.solutionContent.length === 0) {
                    status.solutionContent = false;
                }

                if (contentVal.correctAnswer.data.length === 0) {
                    status.correctAnswer = false;
                }

                switch (quesType) {
                    case 'MCQ':
                        if (contentVal.optionsContent.length === 0 ||
                            (contentVal.optionsContent.filter(opt => !opt.value).length < 2)) {
                            status.optionsContent = false;
                        }
                        break;
                    case 'Integer':

                        break;
                    case 'Matrix':
                        if ((!contentVal.matrixOptionContent.optionRight || contentVal.matrixOptionContent.optionRight.length < 2) || (!contentVal.matrixOptionContent.optionLeft || contentVal.matrixOptionContent.optionLeft.length < 2)) {
                            status.matrixOptionContent = false;
                        } else if (contentVal.matrixOptionContent.optionLeft.length >
                            contentVal.correctAnswer.data.length) {
                            status.matrixOptionContent = false;
                        }
                        break;
                    case 'Numerical':
                        if (contentVal.correctAnswer.data.length === 0 ||
                            (!contentVal.correctAnswer.data.every(d =>
                                d.hasOwnProperty("tolerance")))) {
                            status.tolerance = false;
                        }
                        break;
                    case 'True-False':

                        break;
                    case 'Blanks':

                        break;
                    case 'Descriptive':

                        break;
                    default:

                }
            });
        }
    }
};


QuestionSchema.pre('save', function(next) {
    next();
    /*if(this.status === "PUBLISHED") {
        this.checkValidity()
        .then((status) => {
            if(status.length === 0) {
                next();
            } else {
                next(new Error(`published because question has values for (${status}) missing `));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });
    } else
        next();*/
});


module.exports = mongoose.model('Question',QuestionSchema);
