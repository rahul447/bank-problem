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
StudyMaterialSchema.plugin(mongoosePaginate);

StudyMaterialSchema.methods.checkValidity = function() {

    let status = [];
    let material = this;
    console.log("this checkValidity : ", this);
    return new Promise((resolve) => {
        for (let key in question) {
            validate(key);
        }
        resolve(status);
    });

    function validate(key) {

        if (key === 'conceptId' && material[key].length === 0) {
            status.push(" conceptId ");
        }

        if (key === 'content') {
            material[key].map((contentVal) => {
                if (contentVal.title.length === 0) {
                    status.push(" title ");
                }
                if (contentVal.content.length === 0) {
                    status.push(" content ");
                }
            });
        }
    }
};


StudyMaterialSchema.pre('save', function(next) {
    console.log("this save : ", this);
    if(this.status === "PUBLISHED") {
        next();
        /*this.checkValidity()
        .then((status) => {
            console.log("status : ", status);
            if(status.length === 0) {
                next();
            } else {
                next(new Error(`Error because material has values for (${status}) missing `));
            }
        }).catch(err => {
            next(new Error(`Error ${err}`));
        });*/
    } else
        next();
});



module.exports = mongoose.model('StudyMaterial', StudyMaterialSchema, 'studyMaterials');



