/* eslint-disable */
var course = require('../endpoints/course/course.model.js');
var classModel = require('../endpoints/class/class.model.js');

var CourseItems = require('../endpoints/courseItem/courseItem.model.js');
var mongoose = require('mongoose');
var _ = require('lodash');
var courseSyllabus = require('../endpoints/courseSyllabus/courseSyllabus.model');
var testModel = require('../endpoints/test/tests.model.js')
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
function checkClass(classId,cb){
    classModel.find({}).exec(function(err1,allClass){

        if(err1){
            cb(err1,null);
        }else{
          // console.log(typeof classId);return 
           var classType= _.find(allClass, function(o) { return o._id ==classId.toString(); });
          
            var dateDay=(new Date()).getDate();
           var year = (new Date()).getFullYear();
           var month = (new Date()).getMonth()+1;
           var dateCheck = dateDay+"/"+month+"/"+year;
           var dateFrom = "01/04/"+year;
           var dateTo = "30/06/"+year;
          
           //var dateCheck = "02/02/2018";
           var d1 = dateFrom.split("/");
           var d2 = dateTo.split("/");
           var c = dateCheck.split("/");
           
           var from = new Date(d1[2], parseInt(d1[1])-1, d1[0]);  // -1 because months are from 0 to 11
           var to   = new Date(d2[2], parseInt(d2[1])-1, d2[0]);
           var check = new Date(c[2], parseInt(c[1])-1, c[0]);
           
           
           var targetYear=[];
           var customObj={};
           if (month < 4) {
            year = year - 1;
            }
           if(classType['name']=="12th" && (check > from && check < to)){
                customObj['classId']=classType['_id'];
                var currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString().slice(0, -14);
                if(check > from && check < to){
                    firstYear=year.toString();
                    targetYear.push(firstYear);
                    year=year-1;
                    secondYear=year.toString();
                    targetYear.push(secondYear);
                }else{
                    targetYear.push(year);
                }
                
                //console.log(targetYear);return 
               
           }else if(classType['name']=="12th +" && (check > from && check < to)){
                var classType= _.find(allClass, function(o) { return o.name =="12th"; });
                customObj['classId']=classType['_id'];
                if(check > from && check < to){
                    firstYear=year.toString();
                    targetYear.push(firstYear);
                    year=year-1;
                    secondYear=year.toString();
                    targetYear.push(secondYear);
                }else{
                    targetYear.push(year);
                }
                
                
           }else{
            customObj['classId']=classType['_id'];
                targetYear.push(year.toString())
           }
           customObj['sessionStartYear']=targetYear
          
           cb(null,customObj);
        }


    })

}

function onlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
}

function checkUnique(array) { 
    
    uniqueArray=[]
    for(var i=0;i<array.length;i++){
        if(array[i]=="000000000000000000000000"){
            uniqueArray.push(array[i]);

        }else{
            var index=_.indexOf(uniqueArray, array[i]);
            if(index==-1){
                uniqueArray.push(array[i]);
            }
        }

    }
    return uniqueArray
}

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
                   // console.log(sampleTest[0].id);return 
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
                                //console.log(courseItems['details']['sampletests'][0]);return 
                                courseItems.details.sampletests.forEach(function (element) {
                                    //console.log(element.paperDetail.syllabus.codeName);return 
                                    arr.push({
                                        'id': element.paperDetail.id,
                                        'name': element.displayName,
                                        'type': 'Sample Test',
                                        'duration': element.duration,
                                        'syllabus': {
                                            'name': element.paperDetail.name,
                                            'type': element.paperDetail.type,
                                            'text': element.paperDetail.syllabus.text,
                                            'testCode':(element.codeName)?element.codeName:""
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
       
       
        
        //eligibility.sessionEndTime": endyear.toString()
        // if (currentDate < courseDate)--year;
        // console.log(currentDate + "  " + courseDate + " " + typeof year);
        checkClass(classId,function(err3,data3){
           
            if(err3){
                return res.json({
                    'status': '500',
                    'message': 'Error in retrieving all goals'
                });
            }else{
                
                course.aggregate([{ $unwind: "$eligibility" }, 
                { 
                    $match: { "eligibility.class.id": data3['classId'],
                 "eligibility.sessionStartTime":{$in: data3['sessionStartYear']},
                 endDate: {
                    $gt: new Date(),
                    }
                 } }, { $project: { _id: 1, name: 1, targetYear: "$targetYear", courseType: 1,endDate:1 }
                 }])
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
                        //console.log(courses);return    
                        return res.json({
                            'status': '200',
                            'data': courses,
                            'message': 'All goals retrieved based on classId'
                        });
                    }
                });
            }
           
            
        });return 
       
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
                if (courses != null && courses.targetExamDate != null) {
                    diffDays = Math.round(Math.abs((courses.targetExamDate.getTime() - Date.now()) / (oneDay)));
                }
                else if (courses != null && courses.endDate != null) {
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
                            console.log( tests.courseItems[i].id.details.schedule[j].scheduleDate);
                            console.log(typeof tests.courseItems[i].id.details.schedule[j].scheduleDate);
                          //  console.log(tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString());                            
                           // console.log(typeof tests.courseItems[i].id.details.schedule[j].scheduleDate.toISOString());
                           console.log(date1 );
                            console.log(typeof date1 );
                           // tests.courseItems[i].id.details.schedule[j].scheduleDate= tests.courseItems[i].id.details.schedule[j].scheduleDate.setHours(0,0,0,0);
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
            .lean()
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
                //console.log(tests);
                var typeOfCourse;
                //console.log(tests.courseDetails[0].courseId + " " + req.query.goalId);
                for (var i = 0; i < tests.courseDetails.length; i++) {
                    if (tests.courseDetails[i].courseId != req.query.goalId) continue;
                    //console.log(tests.courseDetails[i].includedItems);
                    typeOfCourse = tests.courseDetails[i].courseType.name;
                    //console.log(typeOfCourse);
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
                            else{
                                //console.log("Herer I am",tests.courseDetails[i].includedItems[j].partialDataDetails.scheduleIDs);return 
                                if(tests.courseDetails[i].includedItems[j].partialDataDetails.scheduleIDs.length==1){
                                    console.log("Here I am");
                                    tests.courseDetails[i].includedItems[j].partialDataDetails.scheduleIDs=tests.courseDetails[i].includedItems[j].partialDataDetails.scheduleIDs[0].split(',');
                                    
                                    
                                }
                                console.log("Herer I ams",tests.courseDetails[i].includedItems[j].partialDataDetails.scheduleIDs);
                                tasks.push({
                                    'filter': tests.courseDetails[i].includedItems[j].filter,
                                    'id': tests.courseDetails[i].includedItems[j].itemId,
                                    'category': tests.courseDetails[i].includedItems[j].itemType,
                                    'data': tests.courseDetails[i].includedItems[j].partialDataDetails.scheduleIDs
                                });
                            }
                        }
                    }
                }
                console.log(tasks);
                //tasks[0].data.push('441');
                var array = [];
                if(tasks.length!=0){
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
                                    'class': item.details.schedule[k].class,
                                    'testDate': item.details.schedule[k].scheduleDate,
                                    'testTime': item.details.schedule[k].scheduleTime,
                                    'availability': item.details.schedule[k].status,
                                    '_id': item.details.schedule[k].paperDetail.id,
                                    'courseType': typeOfCourse,
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
                       
                            for (var k = 0; k < item.details.schedule.length; k++) {
                                
                            // console.log( item.details.schedule[k].scheduleID);
                            //     // console.log(task.data.includes(item.details.schedule[k].scheduleID));
                            //     console.log("Here",task); 
                                if (task.data.includes(item.details.schedule[k].scheduleID) && item.details.schedule[k].paperDetail.type === req.query.testType) {
                                    //console.log(item.details.schedule[i]);
                                    array.push({
                                        'testType': item.details.schedule[k].paperDetail.type,
                                        'duration': item.details.schedule[k].duration,
                                        'class': item.details.schedule[k].class,
                                        'testDate': item.details.schedule[k].scheduleDate,
                                        'testTime': item.details.schedule[k].scheduleTime,
                                        'availability': item.details.schedule[k].status,
                                        'courseType': typeOfCourse,
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
                    else{
                        return res.json({
                            'status': '200',
                            'data': array,
                            'message': 'Success'
                        });
                    }
                });
            }
            else{
                return res.json({
                    'status': '200',
                    'message': 'No tests found for the packageId',
                    'data': []
                });
            }

            });
    },

    /*
      API to fetch sample tests based on goalIds
    */

    goalIdBasedSampleTests: function (req, res) {
        console.log(req.query);   
        course.find({ '_id': { '$in': req.query.goals }})
            .select('courseItems')
            .exec(function (err, tests) {
                console.log(req.query.goals);
                if (!tests) {
                    return res.status(200).json({
                        code: 200,
                        message: 'No tests found',
                        data: []
                    });
                }
                var array = [];
                console.log(tests);
                async.forEach(tests, function (element, callback) {
                    var sampleTest = _.filter(element.courseItems, ['itemType', 'sampleTests']);
                    console.log(sampleTest);
                    CourseItems.findOne({ _id: sampleTest[0].id })
                        .select('details.sampletests').exec(function (err, courseItems) {
                            if (err) {
                                console.log(err);
                                return res.json({
                                    'status': 500,
                                    'message': 'Error in retrieving trial test'
                                });
                            }

                            else if (courseItems) {
                                console.log(courseItems.details.sampletests);
                                for (var i = 0; i < courseItems.details.sampletests.length;i++) {
                                    var element = courseItems.details.sampletests[i];
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
                            }
                            callback();

                        });
                }, function (err, data) {
                    if (err) {
                        console.log(err);
                    }
                    else return res.status(200).json({
                        code: 200,
                        data: array,
                        message: 'Success'
                    });
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
               // console.log(tests);return 
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
                                 //console.log("Here I am",tests.courseDetails[j].includedItems[k]['itemId']['details']['schedule']);return 
                                for (var ptr = 0; ptr < tests.courseDetails[j].includedItems[k].itemId.details.schedule.length; ptr++) {
                                    
                                    if(tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.length==1){
                                        // tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs = 
                                        //console.log(typeof tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs[0]);return 
                                       
                                        var testd=tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs[0];
                                       
                                        tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs=testd.split(',')
                                    }
                                    //console.log(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr]['scheduleID'])
                                    //console.log(tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs);return 
                                    if (!tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.includes(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr]['scheduleID'])) continue;
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

    multiplePackageTestsUponGoal: function (req, res) {
        console.log('asfdasdfasdfasdfasf');
        var part = [], full = [], combined = [], concept = []
        async.eachSeries(req.query.packageId, function (packageId, callback) {
            packageModel.findOne({ '_id': packageId }).populate('courseDetails.includedItems.itemId').select('courseDetails').exec(function (err, tests) {
                if (err) {
                    callback(err)
                }
                for (var j = 0; j < tests.courseDetails.length; j++) {
                    if (tests.courseDetails[j].courseId != req.query.goalId) continue;
                    for (var k = 0; k < tests.courseDetails[j].includedItems.length; k++) {
                        if (tests.courseDetails[j].includedItems[k].itemId == null) continue;
                        if (tests.courseDetails[j].includedItems[k].itemType == 'testGroup') {
                            if (tests.courseDetails[j].includedItems[k].filter == 'partial') {
                                for (var newPtr = 0; newPtr < tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.length; newPtr++) {
                                    concept.push(tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs[newPtr].paperDetail.id.toString());
                                }
                            }
                            else {
                                for (var newPtr = 0; newPtr < tests.courseDetails[j].includedItems[k].itemId.details.tests.length; newPtr++) {
                                    concept.push(tests.courseDetails[j].includedItems[k].itemId.details.tests[newPtr].paperDetail.id.toString());
                                }
                            }
                        }
                        else {
                            if (tests.courseDetails[j].includedItems[k].filter == 'all') {
                                for (var ptr = 0; ptr < tests.courseDetails[j].includedItems[k].itemId.details.schedule.length; ptr++) {
                                    if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'full')
                                        full.push(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.id.toString());
                                    else if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'part')
                                        part.push(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.id.toString());
                                    else{
                                        combined.push(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.id.toString());
                                        console.log(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.id.toString());
                                    }
                                }
                            }
                            else {
                                for (var ptr = 0; ptr < tests.courseDetails[j].includedItems[k].itemId.details.schedule.length; ptr++) {
                                    if (tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.length == 1) {
                                        var testd = tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs[0];
                                        tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs = testd.split(',')
                                    }
                                    if (!tests.courseDetails[j].includedItems[k].partialDataDetails.scheduleIDs.includes(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr]['scheduleID'])) continue;
                                    if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'full')
                                        full.push(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.id.toString());
                                    else if (tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.type == 'part')
                                        part.push(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.id.toString());
                                    else
                                        combined.push(tests.courseDetails[j].includedItems[k].itemId.details.schedule[ptr].paperDetail.id.toString());
                                }
                            }
                        }
                    }
                }
                callback()
            });
        }, function (err) {
            if (err) {
                return res.json({ 'status': '500', 'message': 'Error in package wale tests' });
            }
            else {
                var dataObj = {};
                //console.log(part)
                // var uniquePart = part.filter(onlyUnique);
               
                // var uniqueFull = full.filter(onlyUnique);
                // var uniqueCombined = combined.filter(onlyUnique);
                var uniquePart = checkUnique(part);
                var uniqueFull = checkUnique(full);
                var uniqueCombined =checkUnique(combined);
                var uniqueConcept = checkUnique(concept);
                dataObj.part = uniquePart.length;
                dataObj.full = uniqueFull.length;
                dataObj.concept = uniqueConcept.length;
                dataObj.combined = uniqueCombined.length;
                return res.json({ 'status': '200', 'message': 'Tests successfully retrieved', 'data': dataObj });
            }
        })
    },

    /*
      API to index documents in elastic search
    */

    indexCourseSyllabus: function (req, res) {
        //console.log('111111111');
        var temp = req.body;
        client.index({
            index: 'cms-hierarchy-staging-v2',
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
    elasticConceptTestRetrieve: function (req, res) {
        var mustArr = [], data = [];
        mustArr.push({ match: { "packageId": req.query.packageId } });
        mustArr.push({ match: { "goalId": req.query.goalId } });
        if (req.query.name !== "All")
            mustArr.push({ match: { "subjects": req.query.name } });

        if (req.query.limit == '0') {
            var searchObj = {
                index: 'cms-staging-concept-tests-v2',
                type: 'Tests',
                size: 9000,
                // from: req.query.skip,
                body: {
                    query: {
                        bool: {
                            must: mustArr
                        }
                    },
                }
            };
        }
        else{
        var searchObj={
            index: 'cms-staging-concept-tests-v2',
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
        };
    }

        client.search(searchObj, function (error, response, status) {
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
                    object._id = hit._source.id;
                    object.syllabus = hit._source.syllabus;
                    object.class = hit._source.class;
                    data.push(object);
                    count += 1;
                });
                data1 = {}
                data1.totalCount = count;
                data1.activities = data;
                res.status(200).json({
                    'data': data,
                    'code': 200,
                    'message': 'Success'
                });
            }
        });
    },

    elasticCourseretrieve: function (req, res) {
        var flag = 0;
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
                    flag = 1
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
                                        index: 'cms-hierarchy-staging-v2',
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
                                        testModel.findOne({ _id: test.paperDetail.id }, function (err, data) {
                                            if (err) {
                                                callback1(err)
                                            }
                                            else if (!data) {
                                                callback1()
                                            }
                                            else {
                                                if (test.published !== false){
                                                    array.push({
                                                        'duration': test.duration,
                                                        'class': test.class,
                                                        'availability': test.status,
                                                        'displayName': test.displayName,
                                                        'scheduleId': test.testId,
                                                        '_id': test.paperDetail.id,
                                                        'syllabus': syll,
                                                        'chapters': chapters,
                                                        'subjects': subjects
                                                    });
                                                }
                                                //console.log(array);
                                                callback1();
                                            }
                                        })
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
                if (flag === 0){
                    return res.json({
                        'status': '500',
                        'message': 'Error in controller'
                    })
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
    },

    getCourseNames: function(req, res){

        course.aggregate([
            {
                $group: {
                    _id : { name: '$name', "id": "$_id"}
                }
            }
        ], function(err, data){
            if(err) {
                console.log("err", err);
                return res.status(err.statusCode).json({code:err.statusCode,message:err.message});
            }
            return res.status(200).json({code:200,message:"Success",data:data});
        });
    }
}
