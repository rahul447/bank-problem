'use strict';

const mongoose = require('mongoose'), Schema = mongoose.Schema;

const OrgCenterSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    code: {
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
    }
});

OrgCenterSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

OrgCenterSchema.path('code').validate(function (code, done) {
    const self = this;
    this.model('User').count({ '_id': { $ne: self._id }, code: code }, function (err, count) {
        if (err) {
            return done(err);
        }
        done(!count);
    });
}, 'Center code already exists');

module.exports = mongoose.model('OrgCenter', OrgCenterSchema, 'orgcenters');



