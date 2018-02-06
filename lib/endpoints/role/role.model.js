'use strict';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let RoleSchema = new Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    role: String,
    /*accessLevelControl: [
        {
            component: String,
            endpoints: [{route: String, method: String}]
        }
    ],*/
    allowAll: { type: Boolean, default: true },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
});

module.exports = mongoose.model('Role', RoleSchema);