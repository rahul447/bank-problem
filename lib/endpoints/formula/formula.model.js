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
    contentId: { type: String },
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

FormulaSchema.methods.checkValidity = function() {

    let status = {'content': true, 'title': true, 'conceptId': true, 'concepts': true};
    let formula = this;
    const schemaFields = Array.from(Object.keys(FormulaSchema.paths)
        .reduce((acc, curr) => {
            acc.add(curr.split(".")[0]);
            return acc;
        }, new Set()));

    return new Promise((resolve) => {
        for (let key in formula) {
            (schemaFields.includes(key)) && validate(key);
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

        if (key === 'conceptId' && (!formula[key] || formula[key].length === 0)) {
            status.conceptId = false;
        }

        if(key === 'subjects' && (!formula["subjects"] || formula["subjects"].length === 0)) {
            status.concepts = false;
        }

        if (key === 'content') {
            formula[key].map((contentVal) => {
                if (!contentVal.title || contentVal.title.length === 0) {
                    status.title = false;
                }
                if (!contentVal.content || contentVal.content.length === 0) {
                    status.content = false;
                }
            });
        }
    }
};


FormulaSchema.pre('save', async function(next) {
    if(!config.skipHook && (this.status === "PUBLISHED" && (await this.findStatusById(this._id, this.status) !== this.status || this.fromDraft))) {
        this.checkValidity()
        .then((invalid) => {
            if(invalid.length === 0) {
                next();
            } else {
                next(new Error(JSON.stringify({invalid, contentId: this.contentId})));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });
    } else
        next();
});
module.exports = mongoose.model('Formula', FormulaSchema, 'formulae');



