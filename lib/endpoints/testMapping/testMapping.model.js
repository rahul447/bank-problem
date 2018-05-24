'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    //ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * subSubject Schema
 */


 var testMappingSchema = new Schema({
   updatedTestId:{type:mongoose.Schema.Types.ObjectId},
   removedTestIds:[{type:mongoose.Schema.Types.ObjectId}]
});

module.exports = mongoose.model('testMapping', testMappingSchema);