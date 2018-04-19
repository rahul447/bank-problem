var _ = require('lodash');
var request = require('request');
var async = require('async');
var goal = require('./course.model');
var packageModel = require('./package.model');
var client = require('./elastic-connection');
var mongoose = require('mongoose');

var config=require("../../../config/start");
var url = 'mongodb://' + config.database.userName + ":" + config.database.password + "@" + config.database.host + ":" + config.database.port + "/" + config.database.databaseName;
mongoose.connect(url, function (err) {
    if (err) {
        console.log('Error connecting to mongodb');
        process.exit();
    }
    packageModel.find({}).select('_id').exec(function (err, packages) {
        if (err) {
            console.log('Error in retrieving packages');
            process.exit();
        }
        goal.find({}).select('_id').exec(function (err, goals) {
            if (err) {
                console.log('Error in retrieving packages');
                process.exit();
            }
            //console.log('-----------------------------------');
            var tasks = [];
            for (var i = 0; i < packages.length; i++) {
                for (var j = 0; j < goals.length; j++) {
                    if (packages[i]._id.toString() === '5a155f542ffc3941a4d7fb23' && goals[j]._id.toString() === '5a1550ac2ffc3941a4d7e25b')
                         console.log('yaaaaaaaaaaay');
                    tasks.push({
                        'goalId': goals[j]._id.toString(),
                        'packageId': packages[i]._id.toString()
                    });
                }
            }
            console.log(tasks.length);
            var results = [];
            var tasks1 = [{ 'packageId': '5a155f542ffc3941a4d7fb23', 'goalId': '5a1550ac2ffc3941a4d7e25b' }]
            console.log(typeof tasks[0].packageId)
            async.eachLimit(tasks,100, function (task, callback) {
                var urlToBeHit = 'http://localhost:' + config['process.env.PORT'] + '/courseTestsOld'
                request.get({ 'url': urlToBeHit, 'qs': { 'packageId': task.packageId, 'goalId': task.goalId } }, function (err, resp, body) {
                   if (!body){
                          console.log( task.packageId, task.goalId)
                     return  callback();
                            }
                         console.log('****************************')
                    body = JSON.parse(body);
                    console.log(body.data)
                   console.log('**************************')
                    if (body.data) {
                        for (var i = 0; i < body.data.length; i++) {
                            results.push({
                                'duration': body.data[i].duration,
                                'availability': body.data[i].availability,
                                'displayName': body.data[i].displayName,
                                'scheduleId': body.data[i].scheduleId,
                                '_id': body.data[i]._id.toString(),
                                'syllabus': body.data[i].syllabus,
                                'chapters': body.data[i].chapters,
                                'subjects': body.data[i].subjects,
                                'packageId': task.packageId,
                                'goalId': task.goalId,
                                'class': body.data[i].class
                            });
                        }
                        console.log(results.length)
                        return callback();
                    }
                    else {
                        return  callback();
                    }
                });
            }, function (err, data) {
                if (err) {
                    console.log('Error in making request to CMS');
                    process.exit();
                }
console.log("##################################")
                console.log(results);
console.log("##################################")
                async.eachSeries(results, function (result, next) {
                    client.index({
                        index: 'cms-staging-concept-tests-v2',
                        type: 'Tests',
                        body: {
                            'duration': result.duration,
                            'availability': result.availability,
                            'displayName': result.displayName,
                            'scheduleId': result.scheduleId,
                            'id': result._id,
                            'syllabus': result.syllabus,
                            'chapters': result.chapters,
                            'subjects': result.subjects,
                            'packageId': result.packageId,
                            'goalId': result.goalId,
                            'class': result.class
                        }
                    }, function (err, resp, status) {
                        console.log('asdfasfdasasdfasdfasdfasdfasdfasdfdf');
                        if (err)
                            next(err);
                        else {
                             console.log('lala');
                            next();
                        }
                    });
                }, function (err) {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        console.log('asfasfasfdadfs')
                    }
                });
            });
        });
    });
});

