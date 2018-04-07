'use strict';

const mongoose = require('mongoose'), Schema = mongoose.Schema;

const OrgCenterSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    address: String,
    orgDetails: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
        name: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

module.exports = mongoose.model('OrgCenter', OrgCenterSchema, 'orgcenters');



