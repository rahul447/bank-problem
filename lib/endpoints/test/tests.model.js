'use strict';

import values from "../../../config/values";
import {getQuestionControllerInstance} from "../question/question.controller";

const config = Object.freeze(require("../../../config/" + process.env.NODE_ENV));

let mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate'),
    questionInstance = getQuestionControllerInstance();

var TestsSchema = new Schema({
    name: {type:String, default:null},
    displayName: { type: String, default: null},
    testCode: {
        type:String,
    },
    settings: {
        totalMarks:{type:Number,default:null},
        duration: {type:Number,default:null},
        customTime: {type:Boolean,default:false},
        language: {
            type: [Schema.Types.Mixed],
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
            default: 'sample',
            enum: ["full", "part", "practice", "combined", "concept","sample", null, "chap"]
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
    uploadDetail:{
        fileLocation:String,
        paperName:String,
        sheetName:String,
        uniqueId:String
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
    oldTags: [],
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values,
        uppercase: true
    },
    draftId: { type: mongoose.Schema.Types.ObjectId },
    publishId: { type: mongoose.Schema.Types.ObjectId },
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
                        }],
                        quesCodeAllowed: {type:Number,default:null},
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
    },
    testMode: {
        type: Number,
        default: 0,
        min: 0,
        max: 4
    },
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
    contentId: { type: String/*, unique: true */},
    oldContentId: String,
    docCounter: Number
});

TestsSchema.index({ updatedAt: -1 });
TestsSchema.index({ draftId: 1 }, {sparse: true});
TestsSchema.index({ "status": 1 });

TestsSchema.pre('save', function(next) {
    !config.skipHook ? this.updatedAt = Date.now(): '';
    next();
});

TestsSchema.pre('save', async function(next) {
    if(!config.skipHook) {
        const exists = await this.checkUpdateOrInsert(this._id);
        if(!exists) {
            const lastContentId = await this.getMaxContentId();
            if(this.publishId) {
                this.contentId = `${this.contentId}-DRAFT`;
            } else {
                this.contentId = !lastContentId ? 'T-1': `T-${lastContentId + 1}`;
                this.docCounter = !lastContentId ? 1 : lastContentId + 1;
            }
        }
    }
    next();
});


TestsSchema.methods.checkUpdateOrInsert = (docId) => {
    return new Promise((resolve, reject) => {
        mongoose.models['Tests'].count({_id: mongoose.Types.ObjectId(docId)}).exec()
            .then((count) => {
                resolve(count);
            }).catch(err => {
            reject(err);
        });
    });

};

TestsSchema.methods.getMaxContentId = () => {
    return new Promise((resolve, reject) => {
        mongoose.models['Tests'].find({}, {docCounter: 1}).sort({docCounter:-1}).limit(1)
        .exec((err, doc) => {
            const lastId = doc[0] ? doc[0].docCounter : undefined;
            err ? reject(err) : resolve(lastId);
        });
    });
};


TestsSchema.methods.findStatusById = (id) => {
    return new Promise((resolve, reject) => {
        mongoose.models['Tests'].find({_id: mongoose.Types.ObjectId(id)}, (err, doc) => {
            err ? reject(err) : resolve(doc[0].status);
        });
    });
};

TestsSchema.index({'name': 'text', 'settings.testType': 'text'});

TestsSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Tests', TestsSchema);