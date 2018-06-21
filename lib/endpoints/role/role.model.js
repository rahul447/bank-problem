'use strict';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

import values from "../../../config/values";

const permissionSchema = new Schema({
    type: [{ type: String, enum: values.validAccessTypes }],
    level: [{ type: String, enum: values.permissionType }]
});

let RoleSchema = new Schema({
    role: String,
    description: String,
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
    ],
    contentPermissions: [
        {
            featureType: { type: String, enum: values.featureTypes },
            orgPermissions: [permissionSchema],
            centerPermissions: [permissionSchema],
            subjectPermissions: [permissionSchema]
        }
    ]
});

RoleSchema.index({ "role": 1 });

RoleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Role', RoleSchema);