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
var StudyMaterialSchema = new Schema({
    content: [{
        locale: String,
        content: String,
        title: String,
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
                        }
                    ]
                }
            ]
        }
    ],
    contentId: String
});

StudyMaterialSchema.index({ updatedAt: -1 });
StudyMaterialSchema.index({ draftId: 1 }, {sparse: true});
StudyMaterialSchema.index({ "subjects.subjectId": 1 }, {sparse: true});
StudyMaterialSchema.index({ "subjects.chapters.chapterId": 1 }, {sparse: true});
StudyMaterialSchema.index({ "subjects.chapters.concepts.conceptId": 1 }, {sparse: true});
StudyMaterialSchema.index({ "status": 1 });

StudyMaterialSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

StudyMaterialSchema.pre('save', async function(next) {
    const exists = await this.checkUpdateOrInsert(this._id);
    if(!exists && !this.publishId && !this.contentId) {
        const lastContentId = await this.getMaxContentId();
        this.contentId = !lastContentId ? 'M1': lastContentId.slice(0, 1) + (parseInt(lastContentId.slice(1)) + 1);
        next();
    } else
        next();
});


StudyMaterialSchema.methods.checkUpdateOrInsert = (docId) => {
    return new Promise((resolve, reject) => {
        mongoose.models['StudyMaterial'].count({_id: mongoose.Types.ObjectId(docId)}).exec()
            .then((count) => {
                resolve(count);
            }).catch(err => {
            reject(err);
        });
    });
};

StudyMaterialSchema.methods.getMaxContentId = () => {
    return new Promise((resolve, reject) => {
        mongoose.models['StudyMaterial'].find({}).sort({_id:-1}).limit(1).exec((err, doc) => {
            const lastId = doc[0] ? doc[0].contentId : undefined;
            err ? reject(err) : resolve(lastId);
        });
    });
};

StudyMaterialSchema.methods.findStatusById = (id) => {
    return new Promise((resolve, reject) => {
        mongoose.models['StudyMaterial'].find({_id: mongoose.Types.ObjectId(id)}, (err, doc) => {
            err ? reject(err) : resolve(doc[0].status);
        });
    });
};

StudyMaterialSchema.plugin(mongoosePaginate);

StudyMaterialSchema.methods.checkValidity = function() {

    let status = {'conceptId': true, 'title': true, 'content': true};
    let material = this;
    const schemaFields = Object.keys(StudyMaterialSchema.paths);
    return new Promise((resolve) => {
        for (let key in material) {
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

        if (key === 'conceptId' && (!material[key] || material[key].length === 0)) {
            status.conceptId = false;
        }

        if (key === 'content') {
            material[key].map((contentVal) => {
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


StudyMaterialSchema.pre('save', async function(next) {
    if(this.status === "PUBLISHED" && await this.findStatusById(this._id, this.status) !== this.status) {
        this.checkValidity()
        .then((status) => {
            if(status.length === 0) {
                next();
            } else {
                next(new Error(` Cant published because material has values for (${status}) missing `));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });
    } else
        next();
});



module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema, 'studyMaterials');



