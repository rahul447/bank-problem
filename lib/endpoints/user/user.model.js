'use strict';

import values from "../../../config/values";

let mongoose = require('mongoose'),
    Schema = mongoose.Schema;
import crypto from 'crypto';

let UserSchema = new Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Client"
    },
    centers: [{
        type: String,
        lowercase: true
    }],
    subjects: [{
        type: String,
        lowercase: true
    }],
    email: String,
    passwordHash: String,
    passwordSalt: String,
    token: String,
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    migrationObject:{},
    defaultShare: [
        {
            centerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "OrgCenter"
            },
            roleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Role' }],
            subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
            contentTypes: [{ type: String, enum: values.featureTypes }],
        }
    ]
});

UserSchema.index({ email: -1 });

UserSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

UserSchema.virtual('fullName').get(function () {
    return this.firstName + ' ' + this.lastName;
});


UserSchema
    .virtual('password')
    .set(function (password) {
        if (password.length < 6) {
            this.invalidate('password', 'Password must be at least 6 characters.');
        }
        this._password = password;
        this.passwordSalt = this.makeSalt();
        this.passwordHash = this.encryptPassword(password);
    })
    .get(function () {
        return this._password;
    });

UserSchema.methods = {
    /**
     * Authenticate - check if the passwords are the same
     *
     * @param {String} plainText
     * @return {Boolean}
     * @api public
     */
    authenticate: function (plainText) {
        return this.encryptPassword(plainText) === this.passwordHash;
    },

    /**
     * Make salt
     *
     * @return {String}
     * @api public
     */
    makeSalt: function () {
        return crypto.randomBytes(16).toString('base64');
    },

    /**
     * Encrypt password
     *
     * @param {String} password
     * @return {String}
     * @api public
     */
    encryptPassword: function (password) {
        if (!password || !this.passwordSalt) return '';
        var salt = new Buffer(this.passwordSalt, 'base64');
        return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha1').toString('base64');
    },

    toJSON: function () {
        var obj = this.toObject()
        delete obj.passwordHash;
        delete obj.passwordSalt;
        return obj
    }
};

module.exports = mongoose.model('User', UserSchema);