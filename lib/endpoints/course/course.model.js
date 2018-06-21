'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;
import Client from "../client/client.model";

/**
 * Course Schema
 */

var CourseSchema = new Schema({
    language: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Language"},
        name: String
    },
    targetExamDate: Date,
    name: String,
    description: String,
    category: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
        name: String
    },
    subCategory: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'subCategory' },
        name: String
    },
    courseType: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'courseType' },
        name: String
    },
    eligibility: [
        {
            class: {
                id: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
                name : String,
            },
            sessionInterval: String, //yearly/monthly //to support SAT courses in future
            sessionStartTime: String,
            sessionEndTime: String  
        }
    ],
    duration: Number,
    isMode: String,
    startDate: Date,
    endDate: Date,
    targetYear:Number,
    publishedOn: Date,
    status: String,
    courseItems: [
        {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'courseItem' },
            itemType: String,
            itemName: String
        }
    ],
    price: { type: Number, default: 0 },
    courseImage: { type: String, default: null },
    coupons: [{
        name: {
            type: String,
            default: null
        },
        percentage: {
            type: Number,
            min: 0,
            max: 100
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    migrationObject:{},
    aclMetaData: {
        createdBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        updatedBy: {
            id: { type: mongoose.Schema.Types.ObjectId,  default: null,  ref: "User" },
            email: { type: String }
        },
        clientId: { type: mongoose.Schema.Types.ObjectId, default: null, ref: "Client" }
    }
});

CourseSchema.index({ "category.id": 1 });
CourseSchema.index({ "subCategory.id": 1 });
CourseSchema.index({ "courseType.id": 1 });
CourseSchema.index({ "courseImage": 1 });
CourseSchema.index({ "courseItems.id": 1 });


CourseSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

CourseSchema.pre('save', function (next) {
    if (this.clientId) {
        Client.findById(this.clientId)
            .then(client => {
                if (client.courses && !client.courses.includes(this._id)){
                    client.courses.push(this._id);
                }
                client.save();
            })
    }
    next();
});

module.exports = mongoose.model('Course', CourseSchema,'courses');