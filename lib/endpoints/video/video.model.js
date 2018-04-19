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
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

VideoSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

VideoSchema.plugin(mongoosePaginate);

VideoSchema.methods.checkValidity = function() {

    let status = {'conceptId': true, 'title': true, 'videos': true};
    let video = this;
    return new Promise((resolve) => {
        for (let key in video) {
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
            video[key].map((contentVal) => {
                if (contentVal.title.length === 0) {
                    status.title = false;
                }
                if (contentVal.data.videos.length === 0) {
                    status.videos = false;
                }
            });
        }
    }
};

VideoSchema.pre('save', function(next) {
    if(this.status === "PUBLISHED") {
        next();
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