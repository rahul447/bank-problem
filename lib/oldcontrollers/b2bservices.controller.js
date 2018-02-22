/* eslint-disable */
var packageModel = require('../endpoints/package/package.model.js');
var course = require('../endpoints/course/course.model.js');
var courseItem = require('../endpoints/courseItem/courseItem.model.js');
var mongoose = require('mongoose');
var async=require('async');
var _=require('lodash');

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}


// module export
module.exports = {
    
    /*
    Get Package based on packageId
    */
    getPackagesFromListB2b : function(req,res){
        var data = req.body;
        // console.log(data);
        var final_result = [];
        console.log(data.packages);
        async.each(data.packages,function(package1,callback){
            var object = {};
            console.log(package1);
            getPackageForB2b(package1._id,function(err,data){
                if(err){
                    callback(err);
                }
                else{
                    console.log(data);
                    final_result.push(data);
                    callback();
                }
            });
        },
        function(err){
            if(err){
                return res.status(200).json({code:500,data:{},"message":"Some error occured"});                
            }
            else{
                return res.status(200).json({code:200,data:final_result,"message":"success"});
            }
        });
    },

    getPackagesforUserpackage : function(req,res){
        var data = req.body;
        var final_result = [];
        async.each(data.packages,function(package1,callback){
            var object = {};
            console.log(package1);
            getPackageDetailsForUserPackage(package1._id,function(err,result){
                if(err){
                    callback(err);
                }
                else{
                    final_result.push(result);
                    callback();
                }
            });
        },
        function(err){
            if(err){
                return res.status(200).json({code:500,data:{},"message":"Some error occured"});                
            }
            else{
                return res.status(200).json({code:200,data:final_result,"message":"success"});
            }
        });
    }, 

    getAllActivePackageForB2b : function(req,res){
        var data = req.query;
        var final_result = [];
        packageModel.find({},function(err,packages){
            if(err){
                return res.status(200).json({code:500,data:{},"message":"Some error occured"});
            }
            else{
                async.each(packages,function(package1,callback){
                    var object = {};
                    getPackageForB2b(package1._id,function(err,data){
                        if(err){
                            callback(err);
                        }
                        else{
                            final_result.push(data);
                            callback();
                        }
                    });
                },
                function(err){
                    if(err){

                        return res.status(200).json({code:500,data:{},"message":"Some error occured"});                
                    }
                    else{

                        return res.status(200).json({code:200,data:final_result,"message":"success"});
                    }
                });
            }
        });

    }   
};

function getPackageDetailsForUserPackage(id,next){
    var result = {};
    result.packageId = mongoose.Types.ObjectId(id);
    result.procurementDetails = {
        'type' : "",
        'orderId' : null
    } ;
    var packageDetails = {};
    packageModel.findOne({'_id':id},function(err,data){
        if(err){
            console.log("err in package find");
            next(err);
        }
        else if(data){
            packageDetails._id = result.packageId;
            packageDetails.name = data.name;
            packageDetails.price = data.price;
            packageDetails.objectiveString = data.objectiveString;
            packageDetails.sku = data.sku;
            packageDetails.recommendationString = data.recommendationString;
            packageDetails.startDate = null;
            packageDetails.endDate = null;
            packageDetails.totalNo = "";
            packageDetails.isMode = "";
            packageDetails.duration = 0;
            packageDetails.discount = 0;
            packageDetails.description = null;
            packageDetails.availableForB2C=  data.availableForB2C;
            packageDetails.targetYear = data.targetYear;
            packageDetails.expiryDate = data.expiryDate;
            packageDetails.targetExam = [];
            packageDetails.courses = [];
            // get target exam and courses
            async.each(courseDetail,function( eachcourse,callback){
                course.findOne({'_id' : eachcourse.courseId},function(err,course_data){
                    if(err){
                        console.log('error in course find');
                        callback(err);
                    }
                    else if(course_data){
                        var courseObject = {};
                        courseObject.name = course_data.name;
                        courseObject.category = course_data.category;
                        courseObject.subCategory = course_data.subCategory;
                        
                        var targetExamObject = {};
                        targetExamObject.targetYear = course_data.targetYear;
                        targetExamObject.name = course_data.coursrType.name;
                        packageDetails.targetExam.push(targetExamObject);
                        packageDetails.courses.push(courseObject);
                        callback();
                    }
                    else{
                        console.log('course not found');
                        callback();
                    }
                });
            },
            function(err){
                if(err){
                    next(err);
                }
                else{
                    next(null,result);
                }
            });
        }
        else{
            console.log("package not found");
            next(Error('package not found'));
        }
    });
}

function getPackageForB2b(id,next){
    var result = {};
    packageModel.findOne({'_id' : id }, function(err,data){
        if(err){
            console.log("err in package find");
            next(err);
        }
        else if(data){
            result.productId = data._id;
            result.productName = data.name;
            result.examLogo = "";
            result.perUnitMarketPrice = data.price;
            result.totalPapers =  0;
            result.examName = [];
            result.testType = [];
            result.productLink = "http://vtwo-staging.mypat.in/test/allPackage/packageDetails/" + data._id;
            result.validity = data.expiryDate;
            // console.log(data.targetYear);
            // console.log(data._id);
            if(data.targetYear.length !== 0){
                result.targetYear = data.targetYear.reduce(function(a, b) {
                    return Math.max(a, b);
                });
            }
            else{
                result.targetYear = "";
            }
            result.class = [];
            console.log(data.courseDetails);
            getclassandExamDetails(data.courseDetails,function(err,classDetails){
                if(err){
                    next(err);
                }
                else{

                    var uniq_result = [];
                    classDetails.class.forEach(function(item) {
                        if(uniq_result.indexOf(item) < 0) {
                            uniq_result.push(item);
                        }
                    });
                    result.class = uniq_result;
                    result.examName = classDetails.examName;
                    // console.log(classDetails);
                    packageTestsFullAndConcept(id, function(err,testDetails){
                        if(err){
                            next(err);
                        }
                        else{

                            if(testDetails.part > 0){
                                result.testType.push("part");
                                result.totalPapers+= testDetails.part;
                            }
                            if(testDetails.full > 0){
                                result.testType.push("full");
                                result.totalPapers+= testDetails.full;
                            }
                            if(testDetails.combined > 0){
                                result.testType.push("combined");
                                result.totalPapers+= testDetails.combined;
                            }
                            if(testDetails.concept > 0){
                                result.testType.push("concept");
                                result.totalPapers+= testDetails.concept;
                            }
                            next(null,result);
                        }
                    });

                }
            });
        }
        else{
            console.log("package not found");
            next(Error('package not found'));
        }
    });
}

function getclassandExamDetails(courseDetail,next){
    var data = {}
    data.examName = [];
    data.class = [];
    async.each(courseDetail,function( eachcourse,callback){
        data.examName.push(eachcourse.courseType.name);
        course.findOne({'_id' : eachcourse.courseId},function(err,course_data){

            if(err){
                console.log('error in course find');
                callback(err);
            }
            else if(course_data){
                for(var i=0;i<course_data.eligibility.length;i++){
                    data.class.push(course_data.eligibility[i].class.name);   
                }
                callback();
            }
            else{
                console.log('course not found');
                callback();
            }
        });
    },
    function(err){
        if(err){
            next(err);
        }
        else{
            next(null,data);
        }
    });
}

function packageTestsFullAndConcept(packageId, next){
    packageModel.findOne({ '_id': packageId })
    .populate('courseDetails.includedItems.itemId')
    .select('courseDetails')
    .exec(function (err, tests) {
        //console.log(err);
        if (err) {
            next(err);
        }
        var details = {};
        var part = 0, full = 0, combined = 0, concept = 0;
        for (var j = 0; j < tests.courseDetails.length; j++) {
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
        }
        details = {
            'part': part,
            'full': full,
            'concept': concept,
            'combined': combined,
        };
        next(null,details);
    });
}