'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');
import values from "../../../config/values";
/**
 * Rules Schema
 */
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
    contentId: String,
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
    }
});

FormulaSchema.index({ updatedAt: -1 });
FormulaSchema.index({ draftId: 1 }, {sparse: true});
FormulaSchema.index({ "subjects.subjectId": 1 }, {sparse: true});
FormulaSchema.index({ "subjects.chapters.chapterId": 1 }, {sparse: true});
FormulaSchema.index({ "subjects.chapters.concepts.conceptId": 1 }, {sparse: true});
FormulaSchema.index({ "status": 1 });

FormulaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

FormulaSchema.pre('save', async function(next) {
    const exists = await this.checkUpdateOrInsert(this._id);
    if(!exists && !this.publishId && !this.contentId) {
        const lastContentId = await this.getMaxContentId();
        this.contentId = !lastContentId ? 'F-1': `${lastContentId.split("-")[0]}-${(parseInt(lastContentId.split("-")[1]) + 1)}`;
        next();
    } else
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
        mongoose.models['Formula'].find({}).sort({_id:-1}).limit(1).exec((err, doc) => {
            const lastId = doc[0] ? doc[0].contentId : undefined;
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

    let status = {'derivation': true, 'content': true, 'title': true, 'conceptId': true};
    let formula = this;
    const schemaFields = Array.from(Object.keys(FormulaSchema.paths)
        .reduce((acc, curr) => {
            acc.add(curr.split(".")[0]);
            return acc;
        }, new Set()));

    return new Promise((resolve) => {
        for (let key in formula) {
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

        if (key === 'conceptId' && (!formula[key] || formula[key].length === 0)) {
            status.conceptId = false;
        }

        if (key === 'content') {
            formula[key].map((contentVal) => {
                if (!contentVal.title || contentVal.title.length === 0) {
                    status.title = false;
                }
                if (!contentVal.content || contentVal.content.length === 0) {
                    status.content = false;
                }

                if (!contentVal.derivation || contentVal.derivation.length === 0) {
                    status.derivation = false;
                }
            });
        }
    }
};


FormulaSchema.pre('save', async function(next) {
    if(this.status === "PUBLISHED" && await this.findStatusById(this._id, this.status) !== this.status) {
        this.checkValidity()
        .then((status) => {
            if(status.length === 0) {
                next();
            } else {
                next(new Error(`published because formula has values for (${status}) missing `));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });
    } else
        next();
});
module.exports = mongoose.model('Formula', FormulaSchema, 'formulae');



