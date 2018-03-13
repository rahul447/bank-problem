'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');
import values from "../../../config/values";

/**
 * Tests Schema
 */

var TestsSchema = new Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    name: {type:String, /*required: [true, 'Name is mandatory!'],*/ default:null},
    displayName: { type: String, /*required: [true, 'Display Name is mandatory!'],*/ default: null},
    testCode: {
        type:String,
        // required: [true, 'Test Code is mandatory!'],
        // validate: {
        //     isAsync: true,
        //     validator: function(value, next) {
        //         this.model('Tests').findOne({testCode: value})
        //             .then(test => next(!test))
        //             .catch(() => next(false));
        //     },
        //     message: 'A test already exists with this test code!'
        // }
    },
    settings: {
        totalMarks:{type:Number,default:null},
        duration: {type:Number,default:null},
        language: {
            type: [Schema.Types.Mixed],
            // validate: {
            //     validator: value => value.length > 0,
            //     message: 'Minimum one language is mandatory!'
            // }
        },
        noOfAttempts: {type:Number,default:0},
        validity: {
            startDate: {type:Date,default:null},
            endDate: {type:Date,default:null}
        },
        pause: {type:Boolean,default:false},
        reviewAttempts: {type:Boolean,default:false},
        showCorrectAnswers: {type:Boolean,default:false},
        shuffle: {
            sections: {type:Boolean,default:false},
            questions: {type:Boolean,default:false},
            answer: {type:Boolean,default:false}
        },
        isHintShow: {type:String,default:null},
        testType: {
            type:String,
            lowercase: true,
            default: null,
            enum: ["full", "part", "practice", "combined", "concept", null]
        }
    },
    syllabus: 
    {
        text: {type:String,default:null},
        details: [
            {
                subject: {
                    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
                    name: {type:String,default:null}
                },
                grade: {
                    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Grade' },
                    name: {type:String,default:null}
                },
                chapter: [
                    {
                        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Chapter' },
                        name: {type:String,default:null}
                    }
                ]
            }
        ]
    },
    publishedAt: {type:Date,default:null},
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
    courseId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    status: {
        type: String,
        default:'DRAFT',
        enum: ['DRAFT', 'PUBLISHED', 'DELETED']
    },
    data: 
    {
        noOfSections: {type:Number,default:null},//section array count
        sections: [
            {
                name: {type:String,default:null},
                sectionSerialNo:{type:Number,default:null},
                isHidden: {type:Boolean, default:false},
                subSection: [   
                    {
                        subSectionSerialNo:{type:Number,default:null},
                        isHidden: {type:Boolean,default:false},
                        name: {type:String,default:null},
                        noOfQuestions: {type:Number,default:null},
                        totalMarks: {type:Number,default:null},
                        partialMarks: {type:Number,default:null},
                        positiveMarks: {type:Number,default:null},
                        negativeMarks: {type:Number,default:null},
                        questions: [{  questionSerialNo:{type:Number,default:null},
                            qId:{type: mongoose.Schema.Types.ObjectId, ref: 'Question',default:null}
                        }]
                    }
                ]
            }
        ]
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

TestsSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Tests', TestsSchema);