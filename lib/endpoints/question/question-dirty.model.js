'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
   // ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');
const {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

import values from "../../../config/values";

/**
 * Question Schema
 */

var QuestionDirtySchema = new Schema({
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
            data: [
                {
                    value : { type: Schema.Types.Mixed },
                    weightage : { type: Schema.Types.Mixed },
                    positiveTolerance: Number,
                    negativeTolerance: Number,
                    id: String
                }
            ]
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
    difficultyLevel:[],
    difficultyType:[],
    conceptId:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Concept'}],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    passageId:String,
    conceptCode:[],
    subjects: [
        {
            subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
            chapters: [
                {
                    chapterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
                    concepts: [
                        {
                            conceptId: { type: mongoose.Schema.Types.ObjectId, ref: 'Concept' },
                            conceptCode: String,
                        }
                    ]
                }
            ]
        }
    ],
    aclMetaData: {
        createdBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        updatedBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        clientId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "Client" },
        allowedTo: [
            {
                user: {
                    id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
                    email: { type: String }
                },
                allPermissionAllowed: { type: Boolean },
                accessAllowed: [{ type: String, enum: values.validAccessTypes }]
            }
        ],
        subjects: [{ type: String }],
        centers: [{ type: String }]
    },
    contentId: { type: String },
    oldContentId: String,
    docCounter: Number
 });


module.exports = mongoose.model('QuestionDirty',QuestionDirtySchema, 'questions-dirty');
