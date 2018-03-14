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
    status: String,
    draftQuestionId: String,
    totalQuestion:Number,
    draftId: { type: mongoose.Schema.Types.ObjectId },
    publishId: { type: mongoose.Schema.Types.ObjectId },
    clientId: String,
    passageId:String,
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
 });

QuestionSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Question',QuestionSchema);
