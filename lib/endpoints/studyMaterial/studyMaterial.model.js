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
    updatedAt:{
        type: Date,
        default: Date.now
    }
});

StudyMaterialSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

StudyMaterialSchema.plugin(mongoosePaginate);

StudyMaterialSchema.methods.checkValidity = function() {

    let status = {'conceptId': true, 'title': true, 'content': true};
    let material = this;
    return new Promise((resolve) => {
        for (let key in material) {
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

        if (key === 'conceptId' && material[key].length === 0) {
            status.conceptId = false;
        }

        if (key === 'content') {
            material[key].map((contentVal) => {
                if (contentVal.title.length === 0) {
                    status.title = false;
                }

                if (contentVal.content.length === 0) {
                    status.content = false;
                }
            });
        }

    }
};


StudyMaterialSchema.pre('save', function(next) {
    if(this.status === "PUBLISHED") {
        this.checkValidity()
        .then((status) => {
            if(status.length === 0) {
                next();
            } else {
                next(new Error(`published because material has values for (${status}) missing `));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });
    } else
        next();
});



module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema, 'studyMaterials');



