'use strict';

import loggerInstance from "../../util/apiLogger";
import values from "../../../config/values";
import {QuestionController} from "../question/question.controller";
import {ResponseController} from "../../util/response.controller";

let {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate'),
    questionInstance = new QuestionController(loggerInstance, config);

var TestsSchema = new Schema({
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
    lastUpdateBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
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
            enum: ["full", "part", "practice", "combined", "concept","sample", null]
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
    courseId: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
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
    contentId: String
});

/*TestsSchema.index({ updatedAt: -1 });*/

TestsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

TestsSchema.pre('save', async function(next) {
    const exists = await this.checkUpdateOrInsert(this._id);
    if(!exists && !this.publishId && !this.contentId) {
        const lastContentId = await this.getMaxContentId();
        this.contentId = !lastContentId ? 'T-1': `${lastContentId.split("-")[0]}-${(parseInt(lastContentId.split("-")[1]) + 1)}`;
        next();
    } else
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
        mongoose.models['Tests'].find({}).sort({_id:-1}).limit(1).exec((err, doc) => {
            const lastId = doc[0] ? doc[0].contentId : undefined;
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

TestsSchema.methods.checkValidity = function() {

    let status = {'name': true, 'displayName': true, 'testCode': true, 'testType': true, 'duration': true, 'language': true, 'Rules': true, 'DuplicateSection': true, 'DuplicatesubSectionName': true, 'QuestionNotEqual': true, 'DuplicateQuestion': true};
    let test = this, sectionNameSet = new Set(), subSectionNameSet = new Set(), quesSet = new Set(),
        promises = [];
    const schemaFields = Object.keys(TestsSchema.paths);
    return new Promise((resolve) => {
        for (let key in test) {
            schemaFields.includes(key) && validate(key);
        }
        Promise.all(promises).then(() => {
            let invalid = [];
            for (const k in status) {
                if (!status[k]) {
                    invalid.push(k);
                }
            }
            resolve(invalid);
        });
    });

    function validate(key) {
        if(key === 'name' || key === 'displayName' || key === 'testCode') {
            if (!test[key] || test[key].length === 0) {
                status[key] = false;
            }
        }
        if(key === 'settings') {
            if (!test[key].testType || test[key].testType.length === 0) {
                status.testType = false;
            }

            if (!test[key].duration || test[key].duration.length === 0) {
                status.duration = false;
            }

            if (test[key].language || test[key].language.length === 0) {
                status.language = false;
            }
        }
        if (key === 'data') {
            test[key].map((data) => {
                if (!data.sections || data.sections.length === 0) {
                    status.Rules = false;
                }

                data.sections.map(sec => {
                    if(sectionNameSet.size > 0 && sectionNameSet.has(sec.name)) {
                        status.DuplicateSection = false;
                    } else
                        sectionNameSet.add(sec.name);

                    sec.subSection.map(async subSec => {
                        const quesCode = subSec.quesCodeAllowed;
                        status.QuestionCode = await new Promise(async (resolve) => resolve(await this.validateTestQuestions(quesCode, subSec.questions.map(q => mongoose.Types.ObjectId(q.qId)))));
                        if(subSectionNameSet.size > 0 && subSectionNameSet.has(subSec.name)) {
                            status.DuplicatesubSectionName = false;
                        } else
                            subSectionNameSet.add(subSec.name);

                        if(subSec.questions.length !== subSec.noOfQuestions) {
                            status.QuestionNotEqual = false;
                        }

                        subSec.questions.map(ques => {

                            if(quesSet.size > 0 && quesSet.has(ques.qId)) {
                                status.DuplicateQuestion = false;
                            } else
                                quesSet.add(ques.qId);

                            promises.push(new Promise((resolve) =>
                                questionInstance.publishQuestion(ques.qId).then()
                            ));
                        });
                    });
                });
            });
        }
    }
};

TestsSchema.pre('save', async function(next) {
    if(this.status === "PUBLISHED" && await this.findStatusById(this._id, this.status) !== this.status) {
        this.checkValidity()
        .then((status) => {
            if(status.length === 0) {
                next();
            } else {
                next(new Error(`published because videos has values for (${status}) missing `));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });
    } else
        next();
});

module.exports = mongoose.model('Tests', TestsSchema);