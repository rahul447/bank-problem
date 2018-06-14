'use strict';

const mongoose = require('mongoose'), Schema = mongoose.Schema;

const OrgCenterSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    address: String,
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Client"
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    }
});

OrgCenterSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('OrgCenter', OrgCenterSchema, 'orgcenters');



