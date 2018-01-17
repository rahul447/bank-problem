
var course = require('../endpoints/course/course.model.js');
var CourseItems = require('../endpoints/courseItem/courseItem.model.js');
var mongoose = require('mongoose');
var _ = require('lodash');
var courseSyllabus = require('../endpoints/courseSyllabus/courseSyllabus.model');
var packageModel = require('../endpoints/package/package.model');
var async = require('async');
var client = require('../../config/elastic-connection');

var analysis = [];


// function search(task, callback) {
//     //console.log('1111111111111111111111111--------------------------');
//     client.search({
//         index: 'mypat',
//         type: 'courseHierarchy',
//         body: {
//             query: {
//                 match: {
//                     'conceptId': task.name
//                 }
//             }
//         }
//     }, function (error, response, status) {
//         console.log(task.name);
//         console.log(response.hits.hits[0]._source.chapter);
//         if (error || response.hits.hits == null) {
//             module.exports.courseTests(task.req, task.res);
//             //console.log('333333333333333333333333');
//         }
//         else {
//             var pos = _.findIndex(task.syll, ['chapter', response.hits.hits[0]._source.chapter]);
//             //console.log(pos + " " + task.name);
//             //console.log(response.hits);
//             if (pos == -1) {
//                 var element = { 'chapterName': response.hits.hits[0]._source.chapter, 'conceptArray': [response.hits.hits[0]._source.concept] };
//                 task.syll.push(element);
//             }
//             else
//                 task.syll[pos].conceptArray.push(response.hits.hits[0]._source.concept);
//             console.log('--------------------------------------------');
//             console.log(task.syll);
//         }
//         //callback();
//     });
// }


module.exports = {


    determine: function (task, callback) {
        courseSyllabus.findOne({ '_id': task._id })
            .select('ancestors name')
            .exec(function (err, concept) {
                if (err) {
                    callback(err);
                }
                //console.log(concept);
                courseSyllabus.find({ '_id': { '$in': concept.ancestors } })
                    .select('name type')
                    .exec(function (err, elders) {
                        if (err) {
                            callback(err);
                        }
                        //console.log(elders);
                        var take = false;
                        // for (var k = 0; k < elders.length; k++) {
                        //     if (elders[k].type === 'subject' && elders[k].name === task.name)
                        //         take = true;
                        //         //console.log(k + " " + elders.name + " " + task.name);
                        // }
                        if (_.some(elders, { type: 'subject', name: task.name }))
                            take = true;
                        //console.log(take);
                        if (take) {
                            for (var i = 0; i < elders.length; i++) {
                                if (elders[i].type === 'subject') continue;
                                var found = false;
                                for (var j = 0; j < analysis.length; j++) {
                                    if (analysis[j].chapterName == elders[i].name) {
                                        analysis[j].conceptArray.push(concept.name);
                                        found = true;
                                    }
                                }
                                if (!found) {
                                    var element = { 'chapterName': elders[i].name, 'conceptArray': [concept.name] };
                                    analysis.push(element);
                                }
                            }
                        }
                        //console.log(analysis);
                        callback();
                    });
            });
    },

    /*
      API to get trial test
    */

    getTrialTest: function (req, res) {
        course.findOne({ '_id': req.query.goalId })
            .select('courseItems')
            .exec(function (err, tests) {
                if (tests) {

                    var arr = []
                    var sampleTest = _.filter(tests.courseItems, ['itemType', 'sampleTests']);

                    CourseItems.findOne({ _id: sampleTest[0].id })
                        .select('details.sampletests').exec(function (err, courseItems) {
                            if (err) {
                                console.log(err);
                                return res.json({
                                    'status': '500',
                                    'message': 'Error in retrieving trial test'
                                });
                            }
                            else if (courseItems) {

                                courseItems.details.sampletests.forEach(function (element) {
                                    arr.push({
                                        'id': element.paperDetail.id,
                                        'name': element.displayName,
                                        'type': 'Sample Test',
                                        'duration': element.duration,
                                        'syllabus': {
                                            'name': element.paperDetail.name,
                                            'type': element.paperDetail.type,
                                            'text': element.paperDetail.syllabus.text
                                        }
                                    });
                                }
                                    , this);
                                console.log("before sort", arr);
                                arr = _.sortBy(arr, ['name']);
                                console.log("after sort", arr);

                                return res.json({
                                    'status': '200',
                                    'message': 'Trial Tests retrieved succesfully',
                                    'data': arr
                                });
                            }
                            else {
                                return res.json({
                                    'status': '200',
                                    'message': 'Trial Tests retrieved succesfully',
                                    'data': []
                                });
                            }
                        });
                }
                else {
                    return res.json({
                        'status': '200',
                        'message': 'Trial Tests Not Available',
                        'data': []
                    });
                }
            });


    },

    /*
        API to extract subjects based on goalId
    */

    courseSubjects: function (req, res) {
        courseSyllabus.find({ 'courseId': req.query.goalId, 'type': 'subject' })
            .select('name')
            .exec(function (err, subjects) {
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in retrieving course subjects'
                    });
                }
                else {
                    return res.json({
                        'status': '200',
                        'message': 'Subjects retrieved successfully',
                        'data': subjects
                    });
                }
            });
    },

    /*
        API to fetch all goals based on classId.
    */

    allGoals: function (req, res) {
        var classId = mongoose.Types.ObjectId(req.query.classId);
       
        //console.log('1111111111111111111111');
        //var d = new Date().toISOString().slice(0, -14);
        // var courseDate = new Date((new Date()).getFullYear(), 02, 32).toISOString().slice(0, -14);
        var currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString().slice(0, -14);
        var year = (new Date()).getFullYear();
        var endyear = (new Date()).getFullYear();
        var month = (new Date()).getMonth();
        if(month<4){
            year=year-1;
        }
        
        
        //eligibility.sessionEndTime": endyear.toString()
        // if (currentDate < courseDate)--year;
        // console.log(currentDate + "  " + courseDate + " " + typeof year);
        course.aggregate([{ $unwind: "$eligibility" }, { $match: { "eligibility.class.id": classId, "eligibility.sessionStartTime": year.toString()} }, { $project: { _id: 1, name: 1, targetYear: "$eligibility.sessionEndTime",courseType:1 } }])
            .exec(function (err, courses) {
                //console.log(courses);          
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in retrieving all goals'
                    });
                }
                else {
                    //console.log("goal list");
                    //console.log(courses);        
                    return res.json({
                        'status': '200',
                        'data': courses,
                        'message': 'All goals retrieved based on classId'
                    });
                }
            });
    },

    /*
        API to fetch all goals based on classId and goalId.
    */

    classGoals: function (req, res) {
        course.aggregate([{ $unwind: "$eligibility" }, { $match: { "eligibility.class.id": req.query.classId, _id: req.query.goalId } }, { $project: { _id: 1, name: 1, targetYear: "$eligibility.sessionEndTime" } }])
            .exec(function (err, courses) {
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in retrieving class goals'
                    });
                }
                else {
                    return res.json({
                        'status': '200',
                        'data': courses,
                        'message': 'All class goals retrieved'
                    });
                }
            });
    },

    /*
        API to fetch days left from today to the date of the goal
 
    */

    totalDays: function (req, res) {
        course.findOne({ '_id': req.query.goalId })
            .exec(function (err, courses) {
                var oneDay = 24 * 60 * 60 * 1000;
                if (err) {
                    return res.json({
                        'message': 'Error in totalDays controller',
                        'status': '500'
                    });
                }
                var diffDays = 0;
                if (courses != null && courses.targetExamDate != null ) {
                    diffDays = Math.round(Math.abs((courses.targetExamDate.getTime() - Date.now()) / (oneDay)));
                }
                else if(courses != null && courses.endDate != null ){
                    diffDays = Math.round(Math.abs((courses.endDate.getTime() - Date.now()) / (oneDay)));
                    
                }
                //console.log(diffDays);
                return res.json({
                    'message': 'Total days fetched',
                    'status': '200',
                    'data': diffDays
                });
            });
    },

    /*
        API to get total count of concept test, part test and full test based on goalId
    */

    totalTests: function (req, res) {
        var date1 = req.query.startDate;
        var date2 = req.query.endDate;
        course.findOne({ '_id': req.query.goalId })
            .populate('courseItems.id')
            .select('courseItems.id')
            .exec(function (err, tests) {
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in totalTests'
                    });
                }
                var part = 0, full = 0, concept = 0;
                for (var i = 0; i < tests.courseItems.length; i++) {
                    if (tests.courseItems[i].id.details.tests != null)
                        concept += tests.courseItems[i].id.details.tests.length;
                    if (tests.courseItems[i].id.details.schedule != null) {
                        //console.log(tests.courseItems[i].id.details.schedule[0].scheduleDate);
                        for (var j = 0; j < tests.courseItems[i].id.details.schedule.length; j++) {
                            if ((tests.courseItems[i].id.details.schedule[j].paperDetail.type).toLowerCase() === 'full'
                                && ((tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString() >= date1) &&
                                    tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString() <= date2))++full;
                            else if ((tests.courseItems[i].id.details.schedule[j].paperDetail.type).toLowerCase() === 'part'
                                && ((tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString() >= date1) &&
                                    tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString() <= date2))++part;
                        }
                    }
                }
                return res.json({
                    'status': '200',
                    'message': 'total Tests retrieved',
                    'data': {
                        'concept': concept,
                        'part': part,
                        'full': full
                    }
                });
            });
    },

    /*
     API to get count of part/full test between start and end time.
    */

    testsBetweenStartDateEndDate: function (req, res) {
        course.findOne({ '_id': req.query.goalId })
            .populate('courseItems.id')
            .select('courseItems.id')
            .exec(function (err, tests) {
                //console.log(tests.courseItems);
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in totalTestsBetween controller'
                    });
                }
                var cnt = 0;
                var date1 = req.query.startDate;
                var date2 = req.query.endDate;
                //console.log(date1 + " " + date2);
                for (var i = 0; i < tests.courseItems.length; i++) {
                    //console.log(tests.courseItems[i].id.details.schedule);
                    if (tests.courseItems[i].id.details.schedule != null)
                        for (var j = 0; j < tests.courseItems[i].id.details.schedule.length; j++) {
                            //console.log(typeof tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString());
                            // console.log(typeof date1 );

                            if (tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString() >= date1
                                && tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString() <= date2
                                && ((tests.courseItems[i].id.details.schedule[j].paperDetail.type).toLowerCase() == 'part'
                                    || (tests.courseItems[i].id.details.schedule[j].paperDetail.type).toLowerCase() == 'full'))++cnt;
                        }
                }
                return res.json({
                    'status': '200',
                    'message': 'Total tests between start and date successfully recieved',
                    'totalPartFullTest': cnt
                });
            });
    },

    /*
        API to get count of total full tests for a given packageId
    */
    packageTestsFullAndConcept: function (req, res) {
        packageModel.findOne({ '_id': req.query.packageId })
            .populate('courseDetails.includedItems.itemId')
            .select('courseDetails')
            .exec(function (err, tests) {
                //console.log(err);
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in retrieving tests'
                    });
                }
                var details = [];
                for (var j = 0; j < tests.courseDetails.length; j++) {
                    var part = 0, full = 0, combined = 0, concept = 0;
                    for (var k = 0; k < tests.courseDetails[j].includedItems.length; k++) {
                        if (tests.courseDetails[j].includedItems[k].itemId == null) continue;
                        if (tests.courseDetails[j].includedItems[k].itemType == 'testGroup') {
                            if (tests.courseDetails[j].includedItems[k].filter == 'partial')
                                concept += tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.length;
                            else {
                                concept += tests.courseDetails[j].includedItems[k].itemId.details.tests.length;
                            }
                        }
                        else {
                            if (tests.courseDetails[j].includedItems[k].filter == 'all') {
                                for (var ptr = 0; ptr < tests.courseDetails[j].includedItems[k].itemId.details.schedule.length; ptr++) {
                                    if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'full')++full;
                                    else if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'part')++part;
                                    else ++combined;
                                }
                            }
                            else {
                                for (var ptr = 0; ptr < tests.courseDetails[j].includedItems[k].itemId.details.schedule.length; ptr++) {
                                    if (!tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.includes(tests.courseDetails[j].includedItems[k].itemId.id)) continue;
                                    if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'full')++full;
                                    else if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'part')++part;
                                    else ++combined;
                                }
                            }
                        }
                    }
                    details.push({
                        'part': part,
                        'full': full,
                        'concept': concept,
                        'combined': combined,
                        'courseName': tests.courseDetails[j].courseName,
                        'courseId': tests.courseDetails[j].courseId
                    });
                }

                return res.json({
                    'status': '200',
                    'message': 'Tests successfully retrieved',
                    'data': details
                });
            });
    },

    /*
      API to fetch part and full tests based on packageId and goalId
    */

    courseTestsPartFull: function (req, res) {
        packageModel.findOne({ '_id': req.query.packageId })
            .select('courseDetails')
            .exec(function (err, tests) {
                //console.log(tests.courseDetails);
                console.log('-----------------------------');
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in courseTests controller'
                    });
                }
                var tasks = [];
                if (tests == null) {
                    return res.json({
                        'status': '200',
                        'message': 'No tests found for the packageId',
                        'data': []
                    });
                }
                //console.log(tests.courseDetails[0].courseId + " " + req.query.goalId);
                for (var i = 0; i < tests.courseDetails.length; i++) {
                    if (tests.courseDetails[i].courseId != req.query.goalId) continue;
                    //console.log(tests.courseDetails[i].includedItems);
                    for (var j = 0; j < tests.courseDetails[i].includedItems.length; j++) {
                        //console.log(tests.courseDetails[i].includedItems[j].itemType + " " + 'scheduledTests');
                        if (tests.courseDetails[i].includedItems[j].itemType === 'scheduledTests' || tests.courseDetails[i].includedItems[j].itemType === 'sampleTests') {
                            //console.log(tests.courseDetails[i].includedItems[j]);
                            if (tests.courseDetails[i].includedItems[j].filter === 'all') {
                                tasks.push({
                                    'filter': tests.courseDetails[i].includedItems[j].filter,
                                    'id': tests.courseDetails[i].includedItems[j].itemId,
                                    'category': tests.courseDetails[i].includedItems[j].itemType
                                });
                            }
                            else
                                tasks.push({
                                    'filter': tests.courseDetails[i].includedItems[j].filter,
                                    'id': tests.courseDetails[i].includedItems[j].itemId,
                                    'category': tests.courseDetails[i].includedItems[j].itemType,
                                    'data': tests.courseDetails[i].includedItems[j].partialDataDetails.scheduleIDs
                                });
                        }
                    }
                }
                console.log(tasks);
                //tasks[0].data.push('441');
                var array = [];
                async.forEach(tasks, function (task, callback) {
                    //console.log(task);
                    if (task.filter === 'all') {
                        CourseItems.findOne({ '_id': task.id }, function (err, item) {
                            //console.log(item);
                            for (var k = 0; k < item.details.schedule.length; k++) {
                                //console.log(item.details.schedule[k]);
                                // console.log(item.details.schedule[k].paperDetail.type + " " + req.query.testType);
                                if (item.details.schedule[k].paperDetail.type !== req.query.testType) continue;
                                array.push({
                                    'testType': item.details.schedule[k].paperDetail.type,
                                    'duration': item.details.schedule[k].duration,
                                    'testDate': item.details.schedule[k].scheduleDate,
                                    'testTime': item.details.schedule[k].scheduleTime,
                                    'availability': item.details.schedule[k].status,
                                    '_id': item.details.schedule[k].paperDetail.id,
                                    'scheduleId': item.details.schedule[k].scheduleID,
                                    'codeName': item.details.schedule[k].codeName,
                                    'displayName': item.details.schedule[k].displayName,
                                    'syllabus': item.details.schedule[k].paperDetail.syllabus.text
                                });
                                //console.log(array);
                            }
                            //console.log(array);
                            callback();
                        });

                    }
                    else {
                        CourseItems.findOne({ '_id': task.id }, function (err, item) {
                            //console.log(item.details.schedule);
                            for (var k = 0; k < item.details.schedule.length; k++) {
                                // console.log(item.details.schedule[k].scheduleID + " " + task.data);
                                // console.log(task.data.includes(item.details.schedule[k].scheduleID));
                                if (task.data.includes(item.details.schedule[k].scheduleID) && item.details.schedule[k].paperDetail.type === req.query.type) {
                                    //console.log(item.details.schedule[i]);
                                    array.push({
                                        'testType': item.details.schedule[k].paperDetail.type,
                                        'duration': item.details.schedule[k].duration,
                                        'testDate': item.details.schedule[k].scheduleDate,
                                        'testTime': item.details.schedule[k].scheduleTime,
                                        'availability': item.details.schedule[k].status,
                                        '_id': item.details.schedule[k].paperDetail.id,
                                        'codeName': item.details.schedule[k].codeName,
                                        'scheduleId': item.details.schedule[k].scheduleID,
                                        'displayName': item.details.schedule[k].displayName,
                                        'syllabus': item.details.schedule[k].paperDetail.syllabus.text
                                    });
                                }
                            }
                            //console.log(array);
                            callback();
                        });
                    }
                }, function (err) {
                    //console.log(array.length);
                    if (err) {
                        return res.json({
                            'status': '200',
                            'message': 'Error'
                        });
                    }

                    else {
                        course.findOne({ '_id': req.query.goalId })
                            .select('courseItems')
                            .exec(function (err, tests) {

                                //var arr = []
                                var sampleTest = _.filter(tests.courseItems, ['itemType', 'sampleTests']);

                                CourseItems.findOne({ _id: sampleTest[0].id })
                                    .select('details.sampletests').exec(function (err, courseItems) {
                                        if (err) {
                                            console.log(err);
                                            return res.json({
                                                'status': '500',
                                                'message': 'Error in retrieving trial test'
                                            });
                                        }
                                        else if (courseItems) {

                                            courseItems.details.sampletests.forEach(function (element) {
                                                array.push({
                                                    '_id': element.paperDetail.id,
                                                    'displayName': element.displayName,
                                                    'testType': 'Sample Test',
                                                    'duration': element.duration,
                                                    'scheduleId': element.sampleTestId,
                                                    'syllabus': element.paperDetail.syllabus.text,
                                                    'codeName': element.codeName,
                                                    'status': element.status
                                                });
                                            }
                                                , this);
                                            return res.json({
                                                'status': '200',
                                                'data': array,
                                                'message': 'Success'
                                            });
                                        }
                                        else {
                                            return res.json({
                                                'status': '200',
                                                'data': array,
                                                'message': 'Success'
                                            });
                                        }
                                    });
                            });



                    }
                });

            });
    },

    /*
      API to fetch total concept tests based on goalId and packageId
    */

    courseTests: function (req, res) {
        //console.log("222222222222222222222----------------------1111111111111111111111111111111");
        var packageId = mongoose.Types.ObjectId(req.query.packageId);
        var goalId = mongoose.Types.ObjectId(req.query.goalId);
        packageModel.aggregate([{ $match: { _id: packageId } },
        { $unwind: "$courseDetails" },

        { $match: { "courseDetails.courseId": goalId } },
        { $unwind: "$courseDetails.includedItems" },
        { $match: { "courseDetails.includedItems.itemType": "testGroup" } },

        {
            $lookup:
                {
                    from: 'courseitems',
                    localField: 'courseDetails.includedItems.itemId',
                    foreignField: '_id',
                    as: 'courseItems'
                }
        },


        { $unwind: "$courseItems" },

        { $unwind: "$courseItems.details.tests" },


        { $unwind: "$courseItems.details.tests.courseConcepts" },
        {
            $lookup:
                {
                    from: 'coursesyllabuses',
                    localField: 'courseItems.details.tests.courseConcepts.id',
                    foreignField: '_id',
                    as: 'syllabus'
                }
        },
        { $unwind: "$syllabus" },
        {
            $group: {
                _id: "$courseItems.details.tests.testId",

                testInfo: { $first: "$courseItems.details.tests" },
                courseConcept: { $push: "$courseItems.details.tests.courseConcepts" },
                syllabus: { $push: "$syllabus" },

            }
        }
        ]).exec(function (err, tests) {
            if (err) {
                return res.json({
                    'status': '200',
                    'message': 'Error in retrieving concept tests'
                });
            }
            //console.log(tests);
            var array = [];
            for (var i = 0; i < tests.length; i++) {
                var syll = [];
                for (var j = 0; j < tests[i].syllabus.length; j++) {
                    var pos = _.findIndex(syll, ['chapterName', tests[i].syllabus[j].parent.name]);
                    if (pos == -1) {
                        var element = { 'chapterName': tests[i].syllabus[j].parent.name, 'conceptArray': [tests[i].syllabus[j].name] };
                        syll.push(element);
                    }
                    else
                        syll[pos].conceptArray.push(tests[i].syllabus[j].name);
                }
                // var arrObj = [];
                // var obj = JSON.stringify(tests[i].testInfo.details, function (key, value) {
                //     arrObj.push(value);
                // });
                array.push({
                    'duration': tests[i].testInfo.duration,
                    'availability': tests[i].testInfo.status,
                    'displayName': tests[i].testInfo.displayName,
                    '_id': tests[i].testInfo.paperDetail.id,
                    'scheduleId': tests[i].testInfo.testId,
                    'syllabus': syll
                });
            }
            var dataObj = {};
            dataObj.array = array;
            dataObj.count = tests.length;
            return res.json({
                'status': '200',
                'message': 'Concept tests retrieved successfully',
                'data': array
            });
        });
    },

    /*
      API to fetch all count of tests based on packageId and goalId
    */

    packageTestsUponGoal: function (req, res) {
        //   console.log('11111111111111');
        packageModel.findOne({ '_id': req.query.packageId })
            .populate('courseDetails.includedItems.itemId')
            .select('courseDetails')
            .exec(function (err, tests) {
                //console.log(err);
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': 'Error in package wale tests'
                    });
                }
                var part = 0, full = 0, combined = 0, concept = 0;
                //console.log(tests);
                //console.log(tests.courseDetails[0].includedItems);
                // for (var i = 0; i < tests.length; i++) {
                for (var j = 0; j < tests.courseDetails.length; j++) {
                    if (tests.courseDetails[j].courseId != req.query.goalId) continue;
                    //console.log('111111')
                    for (var k = 0; k < tests.courseDetails[j].includedItems.length; k++) {
                        if (tests.courseDetails[j].includedItems[k].itemId == null) continue;
                        //console.log(tests.courseDetails[j].includedItems[k].itemId.details);
                        if (tests.courseDetails[j].includedItems[k].itemType == 'testGroup') {
                            if (tests.courseDetails[j].includedItems[k].filter == 'partial')
                                concept += tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.length;
                            else {
                                concept += tests.courseDetails[j].includedItems[k].itemId.details.tests.length;
                            }
                        }
                        else {
                            if (tests.courseDetails[j].includedItems[k].filter == 'all') {
                                for (var ptr = 0; ptr < tests.courseDetails[j].includedItems[k].itemId.details.schedule.length; ptr++) {
                                    if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'full')++full;
                                    else if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'part')++part;
                                    else ++combined;
                                }
                            }
                            else {
                                for (var ptr = 0; ptr < tests.courseDetails[j].includedItems[k].itemId.details.schedule.length; ptr++) {
                                    if (!tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.includes(tests.courseDetails[j].includedItems[k].itemId.id)) continue;
                                    if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'full')++full;
                                    else if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'part')++part;
                                    else ++combined;
                                }
                            }
                        }
                    }
                }
                //}
                var dataObj = {};
                dataObj.part = part;
                dataObj.full = full;
                dataObj.concept = concept;
                dataObj.combined = combined;
                return res.json({
                    'status': '200',
                    'message': 'Tests successfully retrieved',
                    'data': dataObj
                });
            });
    },

    /*
      API to index documents in elastic search
    */

    indexCourseSyllabus: function (req, res) {
        //console.log('111111111');
        var temp = req.body;
        client.index({
            index: 'cms-course-hierarchy',
            type: 'courseHierarchy',
            body: {
                "concept": temp.concept,
                "conceptId": temp.conceptId,
                "subject": temp.subject,
                "subjectId": temp.subjectId,
                "chapter": temp.chapter,
                "chapterId": temp.chapterId
            }
        }, function (err, resp, status) {
            //console.log(err);
            if (err) {
                return res.json({
                    'status': '500',
                    'message': 'Error in indexing the document in elastic search'
                });
            }
            else {
                return res.json({
                    'status': '200',
                    'message': 'Successfully indexed in elastic search',
                    'data': resp
                });
            }
        });
    },

    /*
     To retrieve concept tests based on goalId, and packageId with syllabus retrieved from 
     elastic search
    */
    elasticConceptTestRetrieve: function(req, res){
        var mustArr = [], data = [];
        mustArr.push({ match: { "packageId": req.query.packageId } });
        mustArr.push({ match: { "goalId": req.query.goalId } });
        if (req.body.name !== "")
            mustArr.push({ match: { "subjects": req.query.subject } });
        client.search({
            index: 'cms-test',
            type: 'Tests',
            size: req.query.limit,
            from: req.query.skip,
            body: {
                query: {
                    bool: {
                        must: mustArr
                    }
                },
            }
        }, function (error, response, status) {
            if (error) {
                console.log(error);
                module.exports.elasticCourseretrieve(req, res);
            }
            else {
                console.log(response);
                count = 0;
                response.hits.hits.forEach(function (hit) {
                    object = {}
                    object.duration = hit._source.duration;
                    object.availability = hit._source.availability;
                    object.displayName = hit._source.displayName;
                    object.scheduleId = hit._source.scheduleId;
                    object._id = hit._source._id;
                    object.syllabus = hit._source.syllabus;
                    data.push(object);
                    count += 1;
                });
                data1 = {}
                data1.totalCount = count;
                data1.activities = data;
                res.status(200).json({
                    'data': data1,
                    'code': 200,
                    'message': 'Success'
                });
            }
        });
    },

    elasticCourseretrieve: function (req, res) {
        packageModel.findOne({ '_id': req.query.packageId })
            .populate('courseDetails.includedItems.itemId')
            .select('courseDetails')
            .exec(function (err, tests) {
                console.log('1111111111111111111111111111111');
                if (err) {
                    return res.json({
                        'status': '500',
                        'message': err
                    });
                }
                var array = [];
                //var flag = false;
                if (tests == null) {
                    return res.json({
                        'data': null
                    });
                }
                for (var i = 0; i < tests.courseDetails.length; i++) {
                    if (tests.courseDetails[i].courseId != req.query.goalId) continue;
                    //console.log(tests.courseDetails[i].includedItems);
                    var outerTasks = tests.courseDetails[i].includedItems;
                    //for (var j = 0; j < tests.courseDetails[i].includedItems.length; j++) {
                    async.eachSeries(outerTasks, function (outertask, callback2) {
                        if (outertask.itemId == null || outertask.itemType == 'scheduledTests') callback2();
                        // if(tests.courseDetails[i].includedItems[j].itemId.details == null)continue;
                        else {
                            //console.log(tests.courseDetails[i].includedItems[j].itemId.details.tests);
                            var totalTasks = outertask.itemId.details.tests;
                            //flag = true;
                            //for (var k = 0; k < tests.courseDetails[i].includedItems[j].itemId.details.tests.length; k++) {
                            async.eachSeries(totalTasks, function (test, callback1) {
                                var syll = [];
                                var chapters = [];
                                var subjects = [];
                                var tasks = [];
                                //console.log(test.subject);
                                //if (!test.subjects.includes(req.query.name)) callback1();
                                //console.log(test);
                                //console.log(tests.courseDetails[i].includedItems[j].itemId.details.tests);
                                //else {
                                for (var ptr = 0; ptr < test.courseConcepts.length; ptr++) {
                                    tasks.push({
                                        // 'req': req,
                                        // 'res': res,
                                        'name': test.courseConcepts[ptr].id
                                    });
                                    //search(req, res, tests.courseDetails[i].includedItems[j].itemId.details.tests[k].courseConcepts[ptr].name, syll);
                                }
                                //console.log(tasks.length);
                                async.forEach(tasks, function (task, callback) {
                                    client.search({
                                        index: 'cms-course-hierarchy',
                                        type: 'courseHierarchy',
                                        body: {
                                            query: {
                                                match: {
                                                    'conceptId': task.name
                                                }
                                            }
                                        }
                                    }, function (error, response, status) {
                                        //console.log(task.name);
                                        //console.log(response.hits);
                                        if (error || response.hits.hits == null) {
                                            module.exports.courseTests(req, res);
                                            //console.log(error);
                                        }
                                        else if (response.hits.hits.length > 0) {
                                            var pos = _.findIndex(syll, ['chapterName', response.hits.hits[0]._source.chapter]);
                                            var pos2 = _.indexOf(chapters, response.hits.hits[0]._source.chapter)
                                            var pos3 = _.indexOf(subjects, response.hits.hits[0]._source.subject)
                                            if (pos == -1) {
                                                var element = { 'chapterName': response.hits.hits[0]._source.chapter, 'conceptArray': [response.hits.hits[0]._source.concept] };
                                                syll.push(element);
                                            }
                                            else
                                                syll[pos].conceptArray.push(response.hits.hits[0]._source.concept);
                                            if (pos2 == -1) {
                                                chapters.push(response.hits.hits[0]._source.chapter);
                                            }
                                            if (pos3 == -1) {
                                                subjects.push(response.hits.hits[0]._source.subject);
                                            }
                                        
                                        }
                                        callback();
                                    });
                                }, function (err) {
                                    if (err) {
                                        callback1(err);
                                    }
                                    else {
                                        array.push({
                                            'duration': test.duration,
                                            'availability': test.status,
                                            'displayName': test.displayName,
                                            'scheduleId': test.testId,
                                            '_id': test.paperDetail.id,
                                            'syllabus': syll,
                                            'chapters': chapters,
                                            'subjects': subjects
                                        });
                                        //console.log(array);
                                        callback1();
                                    }
                                });
                                // console.log(array);
                                //   }
                            }, function (err) {
                                if (err) {
                                    callback2(err);
                                }
                                else callback2();
                            });
                        }
                    }, function (err) {
                        console.log(array.length);
                        if (err) {
                            return res.json({
                                'status': '500',
                                'message': 'Error in controller'
                            });
                        }
                        else return res.json({
                            'status': '200',
                            'message': 'Success',
                            'data': array
                        });

                    });
                }
            });
    },

    /*
      API to create Index
    */
    createIndex: function (req, res) {
        client.indices.create({
            index: 'mypat',
            body: {
                settings: {
                    analysis: {
                        tokenizer: {
                            ngram_tokenizer: {
                                type: 'nGram',
                                min_gram: 3,
                                max_gram: 3,
                                token_chars: ['letter', 'digit']
                            }
                        },
                        analyzer: {
                            ngram_tokenizer_analyzer: {
                                type: 'custom',
                                tokenizer: 'ngram_tokenizer',
                                filter: [
                                    'lowercase'
                                ]
                            }
                        }
                    }
                },
                mappings: {
                    doc: {
                        properties: {
                            chapter: {
                                type: 'string',
                                analyzer: 'ngram_tokenizer_analyzer'
                            },
                            concept: {
                                type: 'string',
                                analyzer: 'ngram_tokenizer_analyzer'
                            },
                            subject: {
                                type: 'string',
                                analyzer: 'ngram_tokenizer_analyzer'
                            }
                        }
                    }
                }
            }
        }, function (err, resp, status) {
            if (err) {
                console.log(err);
                res.status(500).json({
                    'data': [],
                    'code': '500',
                    'message': 'Error in creating index'
                });
            }
            else {
                res.status(200).json({
                    'data': resp,
                    'code': '200',
                    'message': 'Successfully created index'
                });
            }
        });
    },

    /* 
      API to count total documents indexed in mypat index, courseHierarchy type
    */
    totalCount: function (req, res) {
        client.count({ index: 'mypat', type: 'courseHierarchy' }, function (err, resp, status) {
            console.log(resp);
        });
    },

    /*
      API to retrieve course syllabus based on query field
    */
    retrieveCourseSyllabus: function (req, res) {
        //console.log('1111111111111111111111111--------------------------');
        client.search({
            index: 'mypat',
            type: 'courseHierarchy',
            body: {
                query: {
                    multi_match: {
                        query: req.query.searchString,
                        fields: ['chapter', 'concept', 'subject']
                    }
                }
            }
        }, function (error, response, status) {
            if (error) {
                console.log(error);
            }
            else {
                return res.json({
                    'status': '200',
                    'message': 'Successfully retrieved data',
                    'data': response
                });
            }
        });
    },


    saveCourse: function (req, res) {
        var courseItem = new CourseItems(req.body);
        courseItem.save(function (err) {
            if (!err) {
                return res.json({
                    'status': "200",
                    'message': "no error"
                })
            }
            else {
                console.log(err);
                return res.json({
                    'status': "400",
                    'message': "error"
                })
            }
        })
    }
}
