var bcrypt = require('bcrypt');
'use strict';
//111111111111111111111111111111;
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * Course Schema
 */

var CourseSchema = new Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
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
    publishedOn: Date,
    status: String,
    courseItems: [
        {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'courseItem' },
            itemType: String,
            itemName: String
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    migrationObject:{}

});

module.exports = mongoose.model('Course', CourseSchema,'courses');