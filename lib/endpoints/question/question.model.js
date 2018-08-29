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
    contentId: { type: String, unique: true },
    oldContentId: String,
    docCounter: Number
 });

QuestionSchema.index({ "tags.relation.name": 1 });
QuestionSchema.index({ "tags.values": 1 });
QuestionSchema.index({ draftId: 1 }, {sparse: true});
QuestionSchema.index({ "subjects.subjectId": 1 }, {sparse: true});
QuestionSchema.index({ "subjects.chapters.chapterId": 1 }, {sparse: true});
QuestionSchema.index({ "subjects.chapters.concepts.conceptId": 1 }, {sparse: true});
QuestionSchema.index({ "questionType": 1 });
QuestionSchema.index({ "passageId": 1 });
QuestionSchema.index({ "status": 1 });



QuestionSchema.pre('save', function(next) {
    if(!config.skipHook) {
        this.updatedAt = Date.now();
    }
    next();
});


QuestionSchema.pre('save', async function(next) {
    if(!config.skipHook) {
        this.content ? this.content = this.content.map((c) => {
            c.correctAnswer && c.correctAnswer.answerType === 'id' && c.correctAnswer.data &&
            c.correctAnswer.data.map(a => {
                a.value && typeof a.value === 'string' ? a.value = a.value.replace(/<p>/g, '')
                    .replace(/<\/p>/g, '').replace(/  +/g, ''): '';
                return a;
            });
            return c;
        }) : '';
    }
    next();
});



QuestionSchema.pre('save', async function(next) {
    if(!config.skipHook) {
        const exists = await this.checkUpdateOrInsert(this._id);
        if(!exists) {
            const lastContentId = await this.getMaxContentId();
            if(this.publishId) {
                this.contentId = `${this.contentId}-DRAFT`;
            } else {
                this.contentId = !lastContentId ? 'Q-1': `Q-${lastContentId + 1}`;
                this.docCounter = !lastContentId ? 1 : lastContentId + 1;
            }
        }
    }
    next();
});


QuestionSchema.methods.checkUpdateOrInsert = (docId) => {
    return new Promise((resolve, reject) => {
        mongoose.models['Question'].count({_id: mongoose.Types.ObjectId(docId)}).exec()
            .then((count) => {
                resolve(count);
            }).catch(err => {
            reject(err);
        });
    });

};

QuestionSchema.methods.getMaxContentId = () => {
    return new Promise((resolve, reject) => {
        mongoose.models['Question'].find({}, {docCounter: 1}).sort({docCounter:-1}).limit(1)
        .exec((err, doc) => {
            const lastId = doc[0] ? doc[0].docCounter : undefined;
            err ? reject(err) : resolve(lastId);
        });
    });
};

QuestionSchema.methods.findStatusById = (id) => {
    return new Promise((resolve, reject) => {
        mongoose.models['Question'].find({_id: mongoose.Types.ObjectId(id)}, (err, doc) => {
            err ? reject(err) : resolve(doc[0].status);
        });
    });
};

QuestionSchema.plugin(mongoosePaginate);

QuestionSchema.pre('save', function(next){
    if(!config.skipHook && (this.content && this.content[0] && this.content[0].correctAnswer && this.content[0].correctAnswer.data)) {
        var format = this.content[0].correctAnswer.data;
        if(['SMCQ', 'MMCQ'].includes(this.questionType)){
            format = format.map((element)=>{
                if(typeof(element.value) =='string') {
                    element.value = element.value.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                }
                return element;
            });
        }
        else if(this.questionType=='Integer'){
            format = format.map((element)=>{
                if(typeof(element.value) =='string'){
                    element.value = parseInt(element.value.replace(/<[^>]*>/g, '').replace(/\n/g, ''));
                }
                return element;
            });
        }
        else if(this.questionType=='Numerical'){
            format = format.map((element)=>{
                element.value = element.value.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                return element;
            });
        }
        else{
            format = format.map((element)=>{
                if(Array.isArray(element.value)){
                    element.value = element.value.map((val)=>{
                        return val.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                    });
                    element.id = element.id && element.id.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                    return element;
                }
                else{
                    return element;
                }
            });
        }
        this.content[0].correctAnswer.data = format;
        //console.log(question.content[0].correctAnswer);
    }
    next();
});


module.exports = mongoose.model('Question',QuestionSchema);
