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

AudioSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

AudioSchema.plugin(mongoosePaginate);

AudioSchema.methods.checkValidity = function() {

    let status = {'conceptId': true, 'title': true, 'audios': true};
    let audio = this;
    return new Promise((resolve) => {
        for (let key in audio) {
            validate(key);
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

        if (key === 'conceptId' && audio[key].length === 0) {
            status.conceptId = false;
        }
        if (key === 'content') {
            audio[key].map((contentVal) => {
                if (contentVal.title.length === 0) {
                    status.title = false;
                }
                if (contentVal.data.audios.length === 0) {
                    status.audios = false;
                }
            });
        }
    }
};

AudioSchema.pre('save', function(next) {
    if(this.status === "PUBLISHED") {
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