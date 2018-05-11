'use strict';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

import values from "../../../config/values";

let RoleSchema = new Schema({
    role: String,
    description: String,
    clientId: {
        id: { type: mongoose.Schema.Types.ObjectId, ref: "Client" },
        name: String
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

module.exports = mongoose.model('Role', RoleSchema);