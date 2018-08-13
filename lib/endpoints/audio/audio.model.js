'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');
import values from "../../../config/values";

var AudioSchema = new Schema({
    content: [{
        locale: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },
            name: String
        },
        title: String,
        description: String,
        data: {
            audios: [{
                fileS3Location: String,
            }]
        }
    }],
    via: {
        type: String,
        enum: ['UPLOADAUDIO', 'ADDURL', 'EMBEDCODE']
    },
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
    updatedAt: {
        type: Date,
        default: Date.now
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
    contentId: { type: String },
    oldContentId: String,
    docCounter: Number
});

AudioSchema.index({ draftId: 1 }, {sparse: true});
AudioSchema.index({ "subjects.subjectId": 1 }, {sparse: true});
AudioSchema.index({ "subjects.chapters.chapterId": 1 }, {sparse: true});
AudioSchema.index({ "subjects.chapters.concepts.conceptId": 1 }, {sparse: true});
AudioSchema.index({ updatedAt: -1 });
AudioSchema.index({ "status": 1 });

AudioSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

AudioSchema.pre('save', async function(next) {
    const exists = await this.checkUpdateOrInsert(this._id);

    if(!exists) {
        const lastContentId = await this.getMaxContentId();
        if(this.publishId) {
            this.contentId = `${this.contentId}-DRAFT`;
        } else {
            this.contentId = !lastContentId ? 'A-1': `A-${lastContentId + 1}`;
            this.docCounter = !lastContentId ? 1 : lastContentId + 1;
        }
        next();
    } else
        next();
});

AudioSchema.methods.checkUpdateOrInsert = (docId) => {
    return new Promise((resolve, reject) => {

        mongoose.models['Audio'].count({_id: mongoose.Types.ObjectId(docId)}).exec()
            .then((count) => {
                resolve(count);
            }).catch(err => {
            reject(err);
        });
    });

};

AudioSchema.methods.getMaxContentId = () => {
    return new Promise((resolve, reject) => {
        mongoose.models['Audio'].find({}, {docCounter: 1}).sort({docCounter:-1}).limit(1)
        .exec((err, doc) => {
            const lastId = doc[0] ? doc[0].docCounter : undefined;
            err ? reject(err) : resolve(lastId);
        });
    });
};

AudioSchema.methods.findStatusById = (id) => {
    return new Promise((resolve, reject) => {
        mongoose.models['Audio'].find({_id: mongoose.Types.ObjectId(id)}, (err, doc) => {
            err ? reject(err) : resolve(doc[0].status);
        });
    });
};


AudioSchema.plugin(mongoosePaginate);

AudioSchema.methods.checkValidity = function() {

    let status = {'conceptId': true, 'title': true, 'audios': true, 'concepts': true};
    let audio = this;
    const schemaFields = Array.from(Object.keys(AudioSchema.paths)
        .reduce((acc, curr) => {
            acc.add(curr.split(".")[0]);
            return acc;
        }, new Set()));

    return new Promise((resolve) => {
        for (let key in audio) {
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

        if (key === 'conceptId' && (!audio[key] || audio[key].length === 0)) {
            status.conceptId = false;
        }

        if(key === 'subjects' && (!audio["subjects"] || audio["subjects"].length === 0)) {
            status.concepts = false;
        }

        if (key === 'content') {
            audio[key].map((contentVal) => {
                if (!contentVal.title || contentVal.title.length === 0) {
                    status.title = false;
                }
                if (!contentVal.data.audios || contentVal.data.audios.length === 0) {
                    status.audios = false;
                }
            });
        }
    }
};

AudioSchema.pre('save', async function(next) {
    if(this.status === "PUBLISHED" && await this.findStatusById(this._id, this.status) !== this.status) {
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

module.exports = mongoose.model('Audio', AudioSchema);