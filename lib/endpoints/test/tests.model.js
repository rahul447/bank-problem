'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

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
    name: {type:String,default:null},
    testCode: {type:String,default:null},
    settings: {
        totalMarks:{type:Number,default:null},
        duration: {type:Number,default:null},
        language: [],
        noOfAttempts: {type:Number,default:null},
        validity: {
            startDate: {type:Date,default:null},
            endDate: {type:Date,default:null}
        },
        pause: {type:String,default:null},
        reviewAttempts: {type:String,default:null},
        showCorrectAnswers: {type:String,default:null},
        shuffle: {
            sections: {type:String,default:null},
            questions: {type:String,default:null},
            answer: {type:String,default:null}
        },
        isHintShow: {type:String,default:null},
        testType: {type:String,default:null}
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
    tag: [String],//testname as tag
    courseId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    status: {type:String,default:null},
    data: 
    {
        noOfSections: {type:Number,default:null},//section array count
        sections: [
            {
                name: {type:String,default:null},
                sectionSerialNo:{type:Number,default:null},
                subSection: [   
                    {
                        subSectionSerialNo:{type:Number,default:null},
                        isHidden: {type:String,default:false},
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
    }
});

module.exports = mongoose.model('Tests', TestsSchema);