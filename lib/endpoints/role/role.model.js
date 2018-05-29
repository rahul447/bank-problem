'use strict';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

import values from "../../../config/values";

let RoleSchema = new Schema({
    role: String,
    description: String,
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Client"
    },
    allowAll: Boolean,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    featureLevelPermissions: [
        {
            featureType: { type: String, enum: values.featureTypes },
            accessAllowed: [{ type: String, enum: values.validAccessTypes }]
        }
    ]
});

RoleSchema.index({ "role": 1 });

RoleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Role', RoleSchema);