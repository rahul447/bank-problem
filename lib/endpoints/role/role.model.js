'use strict';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

import values from "../../../config/values";

let RoleSchema = new Schema({
    roleName: String,
    description: String,
    inherits: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
    allowAll: { type: Boolean, default: true },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    featureLevelPermission: [
        {type: String, enum: values.features.endpoint}
    ],
    ContentLevelPermission: [
        {
            contentType: {type: String, enum: values.contentTypes},
            accessAllowed: [{type: String, enum: values.validAccessTypes}]
        }
    ]

});

module.exports = mongoose.model('Role', RoleSchema);