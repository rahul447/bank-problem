var bcrypt = require('bcrypt');
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Concept Schema
 */

var ClassSchema = new Schema({
   
    clientID : {type:mongoose.Schema.Types.ObjectId,default:null},
    userId : {type:mongoose.Schema.Types.ObjectId,default:null},
    name: String,
    status: Boolean,
    createdAt: {
        type: Date,
        default: Date.now
    },
    
    updatedAt: {
        type: Date,
        default: Date.now
    },
    migrationObject:{
        
    }
});

module.exports = mongoose.model('Class', ClassSchema, 'classes');