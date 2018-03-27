var bcrypt = require('bcrypt');
'use strict';
import values from "../../../config/values";
/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
   // ObjectId = Schema.ObjectId,
    Schema = mongoose.Schema;

/**
 * Package Schema
 */

var PackageSchema = new Schema({
    name: String,
    sku: String, //internal code name
    expiryDate:{
        type: Date,
        default: null
    },
    code: {
        type: Number,
        default: 0
    },
    url: {
        type: String,
        default: null
    },
    thumbUrl: {
        type: String,
        default: null
    },
    targetYear:[],
    recommendationString:String,
    availableForB2C:{type:Boolean,default:true},
    objectiveString:String,
    FAQ:[{
        type:{ type: mongoose.Schema.Types.ObjectId},
        question:String,
        answer:String,
        sequence:String
    }],
    status: {
        type: String,
        default: values.contentStatus.default,
        enum: values.contentStatus.values
    },
    price: Number,
    discount: Number,
    courseDetails: [
        {
            courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
            courseType : {
                "id" : { type: mongoose.Schema.Types.ObjectId, ref: 'courseType' },
                "name" : String
            },
            courseName: String,
            includedItems: [
                {
                    itemId: {type:mongoose.Schema.Types.ObjectId,ref:'courseItem'},
                    itemType: String,
                    filter: String, //all/partial //All items included or partial
                    
                    //Depending upon type, we will have the following data if type is partial. IF more items Type are added in course in future, we will change it also
                    partialDataDetails: {
                        

                    }// testIDs: [<array of Ids>] or scheduleIDs: [<array of Ids>]
                    
                }
            ]
        }
    ],
    metatags:{

        title:String,
        description:String


    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    } 
});

module.exports = mongoose.model('Package', PackageSchema,'packages');