'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ClientSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    address: String,
    teachersApiUrl: String,
    orgCenters: [
        {
            id: { type: mongoose.Schema.Types.ObjectId, ref: "OrgCenter" },
            name: String
        }
    ],
    courses: [],        // This is to make myPAT courses available to an Org in future
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    subjects: [{
        type: String,
        lowercase: true
    }],
});

ClientSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Client', ClientSchema, 'clients');



