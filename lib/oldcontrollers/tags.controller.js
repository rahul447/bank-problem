/* eslint-disable */
var subjects = require('../endpoints/subject/subject.model.js');
var chapters = require('../endpoints/chapter/chapter.model.js');
var concepts = require('../endpoints/concept/concept.model.js');
var goals = require('../endpoints/courseType/courseType.model.js');
var async=require('async');

var findQuery = {name:1,_id:0};

var getAllTagsName =  function (req, res) {
    async.parallel({
        subject:function(innerCallback1){
            subjects.find({},findQuery).exec(function (err, data) {
                if (err){
                    return innerCallback1(err,null);
                } else {
                    innerCallback1(null,data);
                }
            });
        },
        chapter:function(innerCallback2){
            chapters.find({},findQuery).exec(function (err, data) {
                if (err){
                    return innerCallback2(err,null);
                } else {
                    innerCallback2(null,data);
                }
            });
        },
        concept:function(innerCallback3){
            concepts.find({},findQuery).exec(function (err, data) {
                if (err){
                    return innerCallback3(err,null);
                } else {
                    innerCallback3(null,data);
                }
            });
        },
        goal:function(innerCallback4){
            goals.find({},findQuery).exec(function (err, data) {
                if (err){
                    return innerCallback4(err,null);
                } else {
                    innerCallback4(null,data);
                }
            });
        }
    },function(err, tagTypes){
        if (err) {
            return res.json({
                'code': 500,
                'message': 'Error retrieving Tags',
            });
        }
        else {
            var tagsData = [];
            Object.keys(tagTypes).forEach(function (tagType) {
                tagTypes[tagType].forEach(function(tag){
                    tagsData.push({tag : tag.name, types: tagType});
                })
            })
            return res.json({
                'code': 200,
                'message': 'Tags retrieved',
                'data': tagsData
            });
        }
    })
}

module.exports.getAllTagsName = getAllTagsName