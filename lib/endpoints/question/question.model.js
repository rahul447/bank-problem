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
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Client"
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastUpdateBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
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
                    negativeTolerance : { type: Number, default: 0 },
                    positiveTolerance : { type: Number, default: 0 },
                    value : { type: Schema.Types.Mixed }
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
    contentId: String
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
    this.updatedAt = Date.now();
    next();
});



QuestionSchema.pre('save', async function(next) {

    this.content && this.content.map((c) => c.correctAnswer && c.correctAnswer.answerType === 'id' && c.correctAnswer.data && c.correctAnswer.data.map(a => a.value = a.value.replace(/<p>/g, '').replace(/<\/p>/g, '').replace(/  +/g, '')));

    const exists = await this.checkUpdateOrInsert(this._id);
    if(!exists && !this.publishId && !this.contentId) {
        const lastContentId = await this.getMaxContentId();
        this.contentId = !lastContentId ? 'Q-1': `${lastContentId.split("-")[0]}-${(parseInt(lastContentId.split("-")[1]) + 1)}`;
        next();
    } else
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
        mongoose.models['Question'].find({}).sort({_id:-1}).limit(1).exec((err, doc) => {
            const lastId = doc[0] ? doc[0].contentId : undefined;
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

QuestionSchema.methods.checkValidity = function() {

    let status = {'tolerance': true, 'conceptId': true, 'questionContent': true, 'solutionContent': true, 'correctAnswer': true, 'optionsContent': true, 'matrixOptionContent': true};
    let question = this;
    const schemaFields = Object.keys(QuestionSchema.paths);
    return new Promise((resolve) => {
        for (let key in question) {
            schemaFields.includes(key) && validate(key);
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

        if (key === 'conceptId' && (!question[key] || question[key].length === 0)) {
            status.conceptId = false;
        }

        if (key === 'content') {

            question[key].map((contentVal) => {
                if (!contentVal.questionContent || contentVal.questionContent.length === 0) {
                    status.questionContent = false;
                }
                if (!contentVal.solutionContent || contentVal.solutionContent.length === 0) {
                    status.solutionContent = false;
                }

                if (!contentVal.correctAnswer.data || contentVal.correctAnswer.data.length === 0) {
                    status.correctAnswer = false;
                }

                switch (quesType) {
                    case 'SMCQ':
                        if (!contentVal.optionsContent || contentVal.optionsContent.length === 0 ||
                            (contentVal.optionsContent.filter(opt => !opt.value).length < 2)) {
                            status.optionsContent = false;
                        }
                        !contentVal.correctAnswer.data || contentVal.correctAnswer.data.length !== 1 ? status.correctAnswer = false: '';
                        break;
                    case 'MMCQ':
                        if (!contentVal.optionsContent || contentVal.optionsContent.length === 0 ||
                            (contentVal.optionsContent.filter(opt => !opt.value).length < 2)) {
                            status.optionsContent = false;
                        }
                        !contentVal.correctAnswer.data || contentVal.correctAnswer.data.length <= 1 ? status.correctAnswer = false: '';
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
                        if (!contentVal.correctAnswer.data || contentVal.correctAnswer.data.length === 0 ||
                            (!contentVal.correctAnswer.data.every(d =>
                                d.hasOwnProperty("positiveTolerance") &&
                                d.hasOwnProperty("negativeTolerance")))) {
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


QuestionSchema.pre('save', async function(next) {
    if(this.status === "PUBLISHED" && await this.findStatusById(this._id, this.status) !== this.status) {
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
        next();
});


QuestionSchema.pre('save', function(next){
    var format = this.content[0].correctAnswer.data;
    if(['SMCQ', 'MMCQ'].includes(this.questionType)){
        format = format.map((element)=>{
            element.value = element.value.replace(/<[^>]*>/g, '').replace(/\n/g, '');
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
                element.id = element.id.replace(/<[^>]*>/g, '').replace(/\n/g, '');
                return element;
            }
            else{
                console.log(this._id);
                console.log("question Error");
                return element;
            }
        });
    }
    this.content[0].correctAnswer.data = format;
    //console.log(question.content[0].correctAnswer);
    next();
});


module.exports = mongoose.model('Question',QuestionSchema);
