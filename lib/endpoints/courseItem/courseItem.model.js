'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

/**
 * CourseItem Schema
 */

var CourseItemSchema = new Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "Client"
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "User"
    },
    name: String,
    itemType: String,
    details: {
        sampletests:[],
        schedule:[],
        tests:[],
        levels: [String]
    },
    migrationObject:{},
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt:{
        type: Date,
        default: Date.now
    },
    deleted: { type: Boolean, default: false }
});

CourseItemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('courseItem', CourseItemSchema, 'courseitems');

/*

    Example of detail object:-

    details: {
                level: {
                    levelType: subject //this will have restricted options
                    levelItems: [
                        {
                            name:"Physics",
                            masterIDs: []//If directly relates to any in master Subject list
                            associatedContent:[
                                {
                                    contentType: //one of Content type
                                    displayName: 
                                    contentId:
                                    //Other if needed
                                }
                            ],
                            level: {
                                levelType: chapter //can be subsubject/unit also if more hierarchy
                                levelItems: [
                                    {
                                        name: "Mechanics",
                                        masterIDs: [] //If directly relates to master Chapter list
                                        associatedContent: [...],
                                        level: {
                                            levelType: concept 
                                            levelItems: [
                                                {
                                                    name: "First Law of motion",
                                                    masterIDs: [] //compulsory association with master concept
                                                    associatedContent: [...]
                                                    //Leaf node. no further levels
                                                }

                                            ]
                                        }
                                    }
                                ]
                            }
                            
                        }
                    ]
                }
            }
*/
