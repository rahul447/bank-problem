'use strict';

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let UserSchema = new Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    email: String,
    firstName: String,
    lastName: String,
    passwordHash: String,
    passwordSalt: String,
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

UserSchema.virtual('fullName').get(function () {
    return this.firstName + ' ' + this.lastName;
});

module.exports = mongoose.model('User', UserSchema);