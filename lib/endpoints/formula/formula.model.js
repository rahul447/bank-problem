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
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }
});

FormulaSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

FormulaSchema.plugin(mongoosePaginate);

FormulaSchema.methods.checkValidity = function() {

    let status = {'derivation': true, 'content': true, 'title': true, 'conceptId': true};
    let formula = this;
    return new Promise((resolve) => {
        for (let key in formula) {
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

        if (key === 'conceptId' && formula[key].length === 0) {
            status.conceptId = false;
        }

        if (key === 'content') {
            formula[key].map((contentVal) => {
                if (contentVal.title.length === 0) {
                    status.title = false;
                }
                if (contentVal.content.length === 0) {
                    status.content = false;
                }

                if (contentVal.derivation.length === 0) {
                    status.derivation = false;
                }
            });
        }
    }
};


FormulaSchema.pre('save', function(next) {
    if(this.status === "PUBLISHED") {
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



