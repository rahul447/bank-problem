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
        default:'DRAFT',
        enum: ['DRAFT', 'PUBLISHED', 'DELETED']
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
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
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

VideoSchema.plugin(mongoosePaginate);

VideoSchema.methods.checkValidity = function() {

    let status = [];
    let video = this;
    console.log("this checkValidity : ", this);
    return new Promise((resolve) => {
        for (let key in video) {
            validate(key);
        }
        resolve(status);
    });

    function validate(key) {

        if (key === 'conceptId' && audio[key].length === 0) {
            status.push(" conceptId ");
        }
        if (key === 'content') {
            video[key].map((contentVal) => {
                if (contentVal.title.length === 0) {
                    status.push(" title ");
                }
                if (contentVal.data.videos.length === 0) {
                    status.push(" videos ");
                }
            });
        }
    }
};

VideoSchema.pre('save', function(next) {
    console.log("this save : ", this);
    if(this.status === "PUBLISHED") {
        next();
        /*this.checkValidity()
        .then((status) => {
            console.log("status : ", status);
            if(status.length === 0) {
                next();
            } else {
                next(new Error(`Error because videos has values for (${status}) missing `));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });*/
    } else
        next();
});

module.exports = mongoose.model('Video', VideoSchema);