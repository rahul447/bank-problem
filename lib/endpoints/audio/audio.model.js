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
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdateBy: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    acl: {
        contentLevel: {
            mineOnly: { type: Boolean, default: true },
            shareWithUser: [
                {
                    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
                    accessAllowed: [{type: String, enum: values.validAccessTypes}]
                }
            ]
        },
        subjects: {
            allSubjects: { type: Boolean, default: false },
            subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
        },
        orgLevel: {
            allOrg: { type: Boolean, default: true },
            accessAllowed: [{ type: String, enum: values.validAccessTypes }],
            centerDetails: [
                {
                    centerId: { type: mongoose.Schema.Types.ObjectId, ref: "OrgCenter" },
                    accessAllowed: [{ type: String, enum: values.validAccessTypes }]
                }
            ]
        }
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

AudioSchema.index({ draftId: 1 }, {sparse: true});
AudioSchema.index({ "subjects.subjectId": 1 }, {sparse: true});
AudioSchema.index({ "subjects.chapters.chapterId": 1 }, {sparse: true});
AudioSchema.index({ "subjects.chapters.concepts.conceptId": 1 }, {sparse: true});

AudioSchema.index({ updatedAt: -1 });

AudioSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

AudioSchema.pre('save', async function(next) {
    const exists = await this.checkUpdateOrInsert(this._id);
    if(!exists && !this.publishId && !this.contentId) {
        const lastContentId = await this.getMaxContentId();

        this.contentId = !lastContentId ? 'A-1': `${lastContentId.split("-")[0]}-${(parseInt(lastContentId.split("-")[1]) + 1)}`;
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
        mongoose.models['Audio'].find({}).sort({_id:-1}).limit(1).exec((err, doc) => {
            const lastId = doc[0] ? doc[0].contentId : undefined;
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

    let status = {'conceptId': true, 'title': true, 'audios': true};
    let audio = this;
    const schemaFields = Object.keys(AudioSchema.paths);
    return new Promise((resolve) => {
        for (let key in audio) {
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

        if (key === 'conceptId' && (!audio[key] || audio[key].length === 0)) {
            status.conceptId = false;
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
        .then((status) => {
            if(status.length === 0) {
                next();
            } else {
                next(new Error(`published because audios has values for (${status}) missing `));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });
    } else
        next();
});

module.exports = mongoose.model('Audio', AudioSchema);