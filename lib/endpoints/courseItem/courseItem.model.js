'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const values = require('../../../config/values');

/**
 * CourseItem Schema
 */

var CourseItemSchema = new Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Client"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    name: String,
    itemType: {
        type: String,
        enum: values.courseItemTypes,
        required: true
    },
    details: {
        sampletests:[
                {
                paperDetail: {
                    syllabus: {},
                    id: { type: mongoose.Schema.Types.ObjectId, ref: "Tests" },
                    name: String,
                    type: { type: String, enum: values.testTypes }
                },
                testType: { type: String, enum: values.testTypes },
                duration: String,
                status: { type: String, enum: values.testStatus },
                codeName: String,
                displayName: String,
                sampleTestId: String,
                scheduleDate: Date,
                scheduleEndDate: Date
            }
        ],
        schedule:[
            {
                paperDetail: {
                    syllabus: {},
                    id: { type: mongoose.Schema.Types.ObjectId, ref: "Tests" },
                    name: String,
                    type: { type: String, enum: values.testTypes }
                },
                testType: { type: String, enum: values.testTypes },
                duration: String,
                status: { type: String, enum: values.testStatus },
                codeName: String,
                displayName: String,
                scheduleID: String,
                scheduleDate: Date,
                scheduleEndDate: Date
            }
        ],
        tests:[
            {
                paperDetail: {
                    syllabus: {},
                    id: { type: mongoose.Schema.Types.ObjectId, ref: "Tests" },
                    name: String,
                    type: { type: String, enum: values.testTypes }
                },
                testType: { type: String, enum: values.testTypes },
                duration: String,
                status: { type: String, enum: values.testStatus },
                codeName: String,
                displayName: String,
                testId: String,
                scheduleDate: Date,
                scheduleEndDate: Date,
                courseConcepts: [],
                subjects: [],
                class: Number
            }
        ],
        levels: [String]
    },
    migrationObject:{},
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    deleted: { type: Boolean, default: false }
});


CourseItemSchema.index({ "name": 1 });


CourseItemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('courseItem', CourseItemSchema, 'courseitems');

/*

    Example of detail object:-

    details: {
                level: {
                    levelType: subject //this will have restricted options
                    levelItems: [
                        {
                            name:"Physics",
                            masterIDs: []//If directly relates to any in master Subject list
                            associatedContent:[
                                {
                                    contentType: //one of Content type
                                    displayName: 
                                    contentId:
                                    //Other if needed
                                }
                            ],
                            level: {
                                levelType: chapter //can be subsubject/unit also if more hierarchy
                                levelItems: [
                                    {
                                        name: "Mechanics",
                                        masterIDs: [] //If directly relates to master Chapter list
                                        associatedContent: [...],
                                        level: {
                                            levelType: concept 
                                            levelItems: [
                                                {
                                                    name: "First Law of motion",
                                                    masterIDs: [] //compulsory association with master concept
                                                    associatedContent: [...]
                                                    //Leaf node. no further levels
                                                }

                                            ]
                                        }
                                    }
                                ]
                            }
                            
                        }
                    ]
                }
            }
*/
