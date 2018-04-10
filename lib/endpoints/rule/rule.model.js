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
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Client"
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
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

RulesSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


module.exports = mongoose.model('Rules', RulesSchema, 'rules');



