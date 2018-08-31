'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');
import values from "../../../config/values";
const {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));


var FormulaSchema = new Schema({
    content: [{
        locale: String,
        content: String,
        title: String,
        nomenclature: String,
        derivation: String
    }],
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values
    },
    draftId: { type: mongoose.Schema.Types.ObjectId },
    publishId: { type: mongoose.Schema.Types.ObjectId },
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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
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
    contentId: { type: String/*, unique: true*/ },
    oldContentId: String,
    docCounter: Number
});

FormulaSchema.index({ updatedAt: -1 });
FormulaSchema.index({ draftId: 1 }, {sparse: true});
FormulaSchema.index({ "subjects.subjectId": 1 }, {sparse: true});
FormulaSchema.index({ "subjects.chapters.chapterId": 1 }, {sparse: true});
FormulaSchema.index({ "subjects.chapters.concepts.conceptId": 1 }, {sparse: true});
FormulaSchema.index({ "status": 1 });

FormulaSchema.pre('save', function(next) {
    if(!config.skipHook) {
        this.updatedAt = Date.now();
    }
    next();
});

FormulaSchema.pre('save', async function(next) {
    if(!config.skipHook) {
        const exists = await this.checkUpdateOrInsert(this._id);
        if(!exists) {
            const lastContentId = await this.getMaxContentId();
            if(this.publishId) {
                this.contentId = `${this.contentId}-DRAFT`;
            } else {
                this.contentId = !lastContentId ? 'F-1': `F-${lastContentId + 1}`;
                this.docCounter = !lastContentId ? 1 : lastContentId + 1;
            }
        }
    }
    next();
});


FormulaSchema.methods.checkUpdateOrInsert = (docId) => {
    return new Promise((resolve, reject) => {

        mongoose.models['Formula'].count({_id: mongoose.Types.ObjectId(docId)}).exec()
        .then((count) => {
            resolve(count);
        }).catch(err => {
           reject(err);
        });
    });

};

FormulaSchema.methods.getMaxContentId = () => {
    return new Promise((resolve, reject) => {
        mongoose.models['Formula'].find({}, {docCounter: 1}).sort({docCounter:-1}).limit(1)
        .exec((err, doc) => {
            const lastId = doc[0] ? doc[0].docCounter : undefined;
            err ? reject(err) : resolve(lastId);
        });
    });
};

FormulaSchema.methods.findStatusById = (id) => {
    return new Promise((resolve, reject) => {
        mongoose.models['Formula'].find({_id: mongoose.Types.ObjectId(id)}, (err, doc) => {
            err ? reject(err) : resolve(doc[0].status);
        });
    });
};

FormulaSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Formula', FormulaSchema, 'formulae');



