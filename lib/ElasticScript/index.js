var mongoose = require('mongoose');
var _ = require('lodash');
var request = require('request');
var async = require('async');
var courseSyllabus = require('./courseSyllabus.model');
var config=require("../../config/start");
var url = 'mongodb://' + config.database.userName + ":" + config.database.password + "@" + config.database.host + ":" + config.database.port + "/" + config.database.databaseName;
mongoose.connect(url, function (err) {
    courseSyllabus.find({ 'type': 'concept' })
        .populate('ancestors')
        .exec(function (err, docs) {
            //console.log(err);
            if (err) {
                return;
            }
            //console.log(docs[0]);
            async.eachSeries(docs, function(doc, callback){
                var subject = '', chapter = '', concept = doc.name;
                var subjectId = '', chapterId = '', conceptId = doc._id.toString();
                for (var j = 0; j < doc.ancestors.length; j++) {
                    if (doc.ancestors[j].type == 'chapter') {
                        chapterId = doc.ancestors[j]._id.toString();
                        chapter = doc.ancestors[j].name;
                    }
                    if (doc.ancestors[j].type == 'subject') {
                        subjectId = doc.ancestors[j]._id.toString();
                        subject = doc.ancestors[j].name;
                    }
                }
                var options = {
                    url: 'http://localhost:' + config['process.env.PORT'] + '/indexCourseSyllabus',
                    method: 'POST',
                    form: {
                        'subject': subject, 'chapter': chapter, 'concept': concept,
                        'conceptId': conceptId, 'chapterId': chapterId, 'subjectId': subjectId
                    }
                };
                //console.log()
                request(options, function (err, resp, body) {
                    if (err) {
                    }
                    else {
                        console.log(body);
                    }
                    callback();
                });

            }, function(err, data){
                if(err){
                }
                else 
                    console.log(data);
            });
        });
});

