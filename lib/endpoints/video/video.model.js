'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongoosePaginate = require('mongoose-paginate');
import values from "../../../config/values";

/**
 * Video Schema
 */

var VideoSchema = new Schema({
    content: [{
        locale: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "Language" },
            name: String
        },
        title: String,
        description: String,
        data: {
            videos: [{
                fileS3Location: String,
                thumNailS3Location: String,
                duration: String,
            }]
        }
    }],
    via: {
        type: String,
        enum: ['UPLOADVIDEO', 'ADDURL', 'EMBEDCODE']
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

VideoSchema.index({ updatedAt: -1 });
VideoSchema.index({ draftId: 1 }, {sparse: true});
VideoSchema.index({ "status": 1 });

VideoSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

VideoSchema.plugin(mongoosePaginate);

VideoSchema.methods.checkValidity = function() {

    let status = {'conceptId': true, 'title': true, 'videos': true};
    let video = this;
    const schemaFields = Object.keys(VideoSchema.paths);
    return new Promise((resolve) => {
        for (let key in video) {
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

        if (key === 'conceptId' && (!video[key] || video[key].length === 0)) {
            status.conceptId = false;
        }
        if (key === 'content') {
            video[key].map((contentVal) => {
                if (!contentVal.title || contentVal.title.length === 0) {
                    status.title = false;
                }
                if (!contentVal.data.videos || contentVal.data.videos.length === 0) {
                    status.videos = false;
                }
            });
        }
    }
};

VideoSchema.pre('save', async function(next) {
    const exists = await this.checkUpdateOrInsert(this._id);
    if(!exists && !this.publishId && !this.contentId) {
        const lastContentId = await this.getMaxContentId();
        this.contentId = !lastContentId ? 'V-1': `${lastContentId.split("-")[0]}-${(parseInt(lastContentId.split("-")[1]) + 1)}`;
        next();
    } else
        next();
});


VideoSchema.methods.checkUpdateOrInsert = (docId) => {
    return new Promise((resolve, reject) => {
        mongoose.models['Video'].count({_id: mongoose.Types.ObjectId(docId)}).exec()
            .then((count) => {
                resolve(count);
            }).catch(err => {
            reject(err);
        });
    });

};

VideoSchema.methods.getMaxContentId = () => {
    return new Promise((resolve, reject) => {
        mongoose.models['Video'].find({}).sort({_id:-1}).limit(1).exec((err, doc) => {
            const lastId = doc[0] ? doc[0].contentId : undefined;
            err ? reject(err) : resolve(lastId);
        });
    });
};

VideoSchema.methods.findStatusById = (id) => {
    return new Promise((resolve, reject) => {
        mongoose.models['Video'].find({_id: mongoose.Types.ObjectId(id)}, (err, doc) => {
            err ? reject(err) : resolve(doc[0].status);
        });
    });
};

VideoSchema.pre('save', async function(next) {
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

module.exports = mongoose.model('Video', VideoSchema);