var bcrypt = require('bcrypt');
'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * Rules Schema
 */
var RulesSchema = new Schema({
    name: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    }, 
    noOfSections: Number,
    sections: [
        {
            name: {type:String,default:null},
            isHidden: {type:Boolean, default:false},
            subSection: [{
                isHidden: {type:Boolean,default:false},
                name: {type:String,default:null},
                noOfQuestions: {type:Number,default:null},
                totalMarks: {type:Number,default:null},
                partialMarks: {type:Number,default:null},
                positiveMarks: {type:Number,default:null},
                negativeMarks: {type:Number,default:null}
            }]
        }
    ]
});


module.exports = mongoose.model('Rules', RulesSchema, 'rules');



