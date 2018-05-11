'use strict';

const mongoose = require('mongoose'),
Schema = mongoose.Schema;

const testInfoSchema = new Schema({
    testId:{type:mongoose.Schema.Types.ObjectId},
    conceptMapping:[{
        _id:false,
        conceptId:{type:mongoose.Schema.Types.ObjectId},
        questionId:[{type:mongoose.Schema.Types.ObjectId}]
    }]
});

module.exports = mongoose.model('testInfo', testInfoSchema);



