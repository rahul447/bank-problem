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

module.exports = {
    



    freePackageList:function(req,res){
       
       
        //console.log(req.query['packages']);return 
        var packages=[];
        for(var i=0;i<req.query['packages'].length;i++){
            var id = mongoose.Types.ObjectId(req.query['packages'][i]);
            packages.push(id);
        }
       
        packageModel.find({_id:{'$in':packages}}).exec(function(err,data){
            if(err){
                return res.status(200).json({code:500,message:"Some error occured"})
                
            }else{
                return res.status(200).json({code:200,message:"Success",data:data})
               

            }
        }) 
    },
    /*
    Get Package based on packageId
    */

    getPackage: function (req, res) {
       
        try {
                var classId = mongoose.Types.ObjectId(req.query['class_id']);
                var courseId = mongoose.Types.ObjectId(req.query['courseTypeId']);
        
        }
        catch(err) {
            res.status(200).json({'code':500,"message":"Invalid Request",data:[]});
            
        }
    
    var d = new Date().toISOString().slice(0, -14);
    var courseDate = new Date((new Date()).getFullYear(), 2, 32).toISOString().slice(0, -14);
    var currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString().slice(0, -14);
    var year = (new Date()).getFullYear();
    if (currentDate < courseDate)--year;
   //console.log(yearFinal);return 
      //console.log(typeof year);return 
      course.aggregate([{ $unwind: "$eligibility" },{ $match: { "eligibility.class.id": classId, "eligibility.sessionStartTime": year.toString(),"courseType.id": courseId} }, { $project: { _id: 1, name: 1, targetYear: "$eligibility.sessionEndTime" } }])
      .exec(function(errorCourse,dataCourse){
        // console.log(dataCourse);return 
                if(errorCourse){
                    res.status(200).json({'code':500,"message":"Some error occured",data:[]});
                }else{
                   
                   var idArray=[];
                   if(dataCourse.length>0){

                    for(var i=0;i<dataCourse.length;i++){
                        idArray.push(dataCourse[i]['_id']);
                    }
                   }
                  // console.log(idArray);return 
                   if(idArray.length>0){    
                    
                    var today = new Date();
                  //  console.log(today);return 
                    packageModel.find({"courseDetails.courseId":{$in:idArray},availableForB2C:true,expiryDate:{ $gte : today }},{expiryDate:1,targetYear:1,name:1,sku:1,description:1,price:1,discount:1,courseDetails:1
                    
                        }).sort( { price:1 } )
                        .populate({
                            path: 'courseDetails.courseId',
                           
                          }).populate({
                            path: 'courseDetails.includedItems.itemId',
                           
                          }).lean().exec(function (err, packages){
                           
                            if(err){
                              
                                return res.json({
                                    'status': '404',
                                    'message': 'Error in retrieving packages'
                                });
                            }
                            else{
                               // console.log("Here",packages);return 
                                if(packages.length>0){
                                 
                                    async.each(packages, function(eachpackage,callback1){
                                           // console.log("=======package['courseDetails'] Loop Starts=====",package['courseDetails'][0]['courseId']);return 
                                            var totaltest=0;
                                            var totalConcept=0;
                                            var targetExam=[];
                                            
                                           async.each(eachpackage['courseDetails'], function(course,callback2){
                                                   
                                                    var fulltestCount=0;
                                                    var conceptTestCount=0;
                                                    //console.log("Herer",course['courseId']['courseItems']);return 
                                                 //  console.log("Here",course['courseType']);return 
                                               // console.log(course);return 
                                                if(course['courseId']!=null){
                                                    var courseObj={};
                                                    if(course['courseType']){
                                                        courseObj['_id']=course['courseType']['id'];
                                                        courseObj['name']=course['courseType']['name'];
                                                    }
                                                    
                                                    
                                                    courseObj['targetYear']=course['courseId']['endDate']?course['courseId']['endDate'].getFullYear():"";
                                                    courseObj['courseType']=course['courseId']['courseType']
                                                    
                                                    //package['targetYear']=course['courseId']['targetExamDate']?course['courseId']['targetExamDate'].getFullYear():"";
                                                    targetYear=eachpackage['targetYear']||[].toString();

                                                    if(typeof targetYear === "object")
                                                        targetYear =  Math.max(targetYear);
                                                    else if(typeof targetYear !== "number")
                                                        targetYear =  targetYear.split(',').map(Number);


                                                    //targetYear=Math.max.apply(null, targetYear)
                                                    

                                                    eachpackage['targetYear']=targetYear;
                                                   // console.log(targetExam);
                                                    var indexName=_.findIndex(targetExam, function(o) { return o.name == course['courseType']['name']; });
                                                   
                                                    if(indexName==-1){
                                                    targetExam.push(courseObj);

                                                    eachpackage['targetExam']=targetExam
                                                    }
                                                }
                                                //console.log(courseObj);return 

                                               // console.log("Herer",targetExam);return 
                                                async.each(course['includedItems'], function(item,callback3){

                                                        if(item.itemType=="scheduledTests"){
                                                           
                                                            if(item['filter']=="all"){
                                                               //console.log(item)
                                                             //  console.log(item);return    
                                                                if(item['itemId']!=null){
                                                                    var fulltestCount=item['itemId']['details']['schedule'].length;
                                                                    
                                                                }
                                                               // console.log(fulltestCount);return
                                                            }else{
                                                                var fulltestCount=item['partialDataDetails']['scheduleIDs'].length;
                                                                
                                                            }
                                                            course['fullTest']=fulltestCount;
                                                            
                                                            
                                                            totaltest=totaltest+course['fullTest'];
                                                            eachpackage['totalNo']=totaltest;
                                                           
                                                        }
                                                        else if(item.itemType=="testGroup"){
                                                            if(item['filter']=="all"){
                                                               // console.log(item);return  
                                                                if(item['itemId']!=null){
                                                                    var conceptTestCount=item['itemId']['details']['tests'].length;
                                                                    
                                                                }
                                                               
                                                            }else{
                                                               // var fulltestCount=item['partialDataDetails']['scheduleIDs'].length;
                                                                var conceptTestCount=item['partialDataDetails']['testIDs'].length;
                                                            }
                                                           
                                                            
                                                            course['conceptTestCount']=(conceptTestCount)?conceptTestCount:0;
                                                           
                                                            totalConcept=totalConcept+course['conceptTestCount'];
                                                            
                                                            eachpackage['totalConcept']=totalConcept;
                                                        }
                                                        
                                                        
                                                        callback3();
                                                       
                                                },function(err3){
                                                    if(err3){
                                                        return res.status(200).json({code:500,data:{},"message":"Some error occured"})
                                                        
                                                    }else{
                                                        delete eachpackage['courseDetails'];
                                                        callback2();
                                                        
                                                    }
                
                                                })
                                                    
                                              
                
                
                                            },function(err2){
                
                                                if(err2){
                                                    return res.status(200).json({code:500,data:{},"message":"Some error occured"})
                                                    
                                                }else{
                                                    callback1()
                                                }
                
                                            })
                                            
                                    },function(err1){
                                        if(err1){
                                            return res.status(200).json({code:500,data:{},"message":"Some error occured"})
                                            
                                        }else{
                
                                          
                                          
                                            console.log('All files have been processed successfully');  
                                        
                                            return res.status(200).json({code:200,data:packages,"message":"Success"})
                                        }
                
                                    });
                
                                }else{
                                //   console.log("Herere",packages);return 
                                    return res.json({
                                        'code': 200,
                                        'message': 'Package retrieved successfully',
                                        'data':[]
                                    });
                
                                }
                               
                            }
                        });
                   }else{
                   
                    return res.status(200).json({code:200,message:"Class Id or course Id not exist",data:[]});
                   }
                
                
                }



        })

       
    },
    getAllPackage: function (req, res) {
        
        var d = new Date().toISOString().slice(0, -14);
        var courseDate = new Date((new Date()).getFullYear(), 2, 32).toISOString().slice(0, -14);
        var currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString().slice(0, -14);
        var year = (new Date()).getFullYear();
        if (currentDate < courseDate)--year;
       
        course.aggregate([{ $unwind: "$eligibility" },{ $match: {"eligibility.sessionStartTime": year.toString()} }, { $project: { _id: 1 } }]).exec(function(errorCourse,dataCourse){
           
                if(errorCourse){
                    return res.json({
                        'code': 500,
                        'message': 'Error in retrieving packages'
                    });
                }else{
                 // console.log(dataCourse);return 
                   var idArray=[];
                   if(dataCourse.length>0){

                    for(var i=0;i<dataCourse.length;i++){
                        idArray.push(dataCourse[i]['_id']);
                    }
                   }
                 //  console.log(idArray);return 
                   if(idArray.length>0){
                    var today = new Date();
                    packageModel.find({"courseDetails.courseId":{$in:idArray},availableForB2C:true,expiryDate:{ $gte : today }}).sort( { price:1 } ).populate('courseDetails.courseId')
                        
                        .populate({
                            path: 'courseDetails.includedItems.itemId',
                           
                          }).lean().exec(function (err, packages){
                          
                            if(err){
                              
                                return res.json({
                                    'code': 500,
                                    'message': 'Error in retrieving packages'
                                });
                            }
                            else{
                                
                                if(packages.length>0){
                                    
                                    async.each(packages, function(eachpackage,callback1){
                                            //console.log("=======package['courseDetails'] Loop Starts=====");
                                            var totaltest=0;
                                            var totalConcept=0;
                                            var targetExam=[];
                                            
                                           async.each(eachpackage['courseDetails'], function(course,callback2){
                                                   
                                                    var fulltestCount=0;
                                                    var conceptTestCount=0;
                                                    
                                                 //  console.log("Here",course['courseType']);return 
                                               // console.log(course);return 
                                                if(course['courseId']!=null){
                                                    var courseObj={};
                                                    if(course['courseType']){
                                                        courseObj['_id']=course['courseType']['id'];
                                                        courseObj['name']=course['courseType']['name'];
                                                    }
                                                    
                                                    
                                                    courseObj['targetYear']=course['courseId']['endDate']?course['courseId']['endDate'].getFullYear():"";
                                                    courseObj['courseType']=course['courseId']['courseType']
                                                    
                                                  //  package['targetYear']=course['courseId']['endDate'].getFullYear();
                                                    eachpackage['targetYear']=eachpackage['targetYear'].toString();
                                                    targetExam.push(courseObj);
                                                    eachpackage['targetExam']=targetExam
                                                
                                                }
                                                //console.log(courseObj);return 

                                               // console.log("Herer",targetExam);return 
                                                async.each(course['includedItems'], function(item,callback3){
                                                    // console.log("Here",item.itemType);return 
                                                        if(item.itemType=="scheduledTests"){
                                                            
                                                             if(item['filter']=="all"){
                                                                if(item['itemId']!=null){
                                                                    var fulltestCount=item['itemId']['details']['schedule'].length;
                                                                    
                                                                }else{
                                                                    var fulltestCount=0;
                                                                }
                                                                 
                                                             }else{
                                                                 var fulltestCount=item['partialDataDetails']['scheduleIDs'].length;
                                                                 
                                                             }
                                                             course['fullTest']=fulltestCount;
                                                             totaltest=totaltest+course['fullTest']
                                                             eachpackage['totalNo']=totaltest;
                                                         }
                                                         else if(item.itemType=="testGroup"){
                                                             if(item['filter']=="all"){
                                                                if(item['itemId']!=null){
                                                                 var conceptTestCount=item['itemId']['details']['tests'].length;
                                                                }else{
                                                                    var conceptTestCount=0;
                                                                }
                                                             }else{
                                                                // var fulltestCount=item['partialDataDetails']['scheduleIDs'].length;
                                                                 var conceptTestCount=item['partialDataDetails']['testIDs'].length;
                                                             }
                                                            
                                                             
                                                             course['conceptTestCount']=conceptTestCount;
                                                             totalConcept=totalConcept+course['conceptTestCount']
                                                             eachpackage['totalConcept']=totalConcept;
                                                         }
                                                        
                                                        
                                                        callback3();
                                                       
                                                },function(err3){
                                                    if(err3){
                                                        return res.status(200).json({code:500,data:{},"message":"Some error occured"})
                                                        
                                                    }else{
                                                        delete eachpackage['courseDetails'];
                                                        callback2();
                                                        
                                                    }
                
                                                })
                                                    
                                              
                
                
                                            },function(err2){
                
                                                if(err2){
                                                    return res.status(200).json({code:500,data:{},"message":"Some error occured"})
                                                    
                                                }else{
                                                    callback1()
                                                }
                
                                            })
                                            
                                    },function(err1){
                                        if(err1){
                                            return res.status(200).json({code:500,data:{},"message":"Some error occured"})
                                            
                                        }else{
                
                                          
                                          
                                            console.log('All files have been processed successfully');  
                                        
                                            return res.status(200).json({code:200,data:packages,"message":"Success"})
                                        }
                
                                    });
                
                                }else{
                                    return res.json({
                                        'status': '200',
                                        'message': 'Package retrieved successfully',
                                        'data': eachpackage
                                    });
                
                                }
                               
                            }
                        });
                   }else{


                   }
                
                
                }



        })

       
    },
     /*
    View Package based on packageId
    */
    viewPackage:function(req,res){
       
        
        if(req.query['package_id']){
            
            
            try {
                var packageId = mongoose.Types.ObjectId(req.query['package_id']);
                
                }
                catch(err) {
                    res.status(200).json({'code':500,"message":"Invalid Request",data:{}});
                    
                }
            
            // Here we are finding data from Package Model based on package Id with course Info
            if(req.query['type']){
               
                packageModel.aggregate([{$match:{_id:packageId}},{$unwind:"$courseDetails"},{
                    $group : {
                       _id :"$_id",
                        courseType:{$push:"$courseDetails.courseType.id"}
                     
                      
                   }}]).exec(function(err,packageDetail){
                    
                     if(err){
                       
                         return res.status(200).json({"message":"Some error occured",code:500,data:{}})
                         
                     }else{
                        // console.log(packageDetail['courseDetails'][0]['courseId']); 
                         
                       
                         if(packageDetail!=null){
                            return res.status(200).json({"message":"Success",code:200,data:packageDetail[0]['courseType']})
                            
                            
                         }else{
                             return res.status(200).json({"message":"Invalid Request",code:200,data:{}})
                             
                         }
                     }
     
                 })
            }else{
            packageModel.findOne({_id:packageId}).populate({path:'courseDetails.courseId',model: 'Course'}).lean().exec(function(err,packageDetail){
               
                if(err){
                  
                    return res.status(200).json({"message":"Some error occured",code:500,data:{}})
                    
                }else{
                   // console.log(packageDetail['courseDetails'][0]['courseId']); 
                  
                  
                    if(packageDetail!=null){
                        var packageDetails={};
                        packageModel.populate(packageDetail,[{path:'courseDetails.courseId.courseItems.id',model:'courseItem'}],function(err1,data1){
                           // console.log("Schedukle Test Length",data1['courseDetails'][0]['includedItems'][0]['partialDataDetails']['scheduleIDs'].length); 
                            packageDetails['_id']=data1['_id'];
                            packageDetails['name']=data1['name'];
                            packageDetails['description']=data1['description'];
                            packageDetails['price']=data1['price'];
                            packageDetails['discount']=data1['discount'];
                            packageDetails['FAQ']=data1['FAQ'];
                            packageDetails['metaTags']={};
                            if(data1['metatags']['title']){
                                packageDetails['metaTags']=data1['metatags'];
                            }
                            //packageDetails['goals']=data1['courseDetails'];
                            packageDetails['expiryDate']=data1['expiryDate'];
                            packageDetails['objectiveString']=data1['objectiveString'];
                            packageDetails['sku']=data1['sku'];
                            packageDetails['targetYear']=data1['targetYear'];
                            packageDetails['recommendationString']=data1['recommendationString'];
                            packageDetails['availableForB2C']=data1['availableForB2C'];
                            
                            var targetDetailExam=[];
                            var targetExam=[];
                            var goals=[];

                            // Array of CourseDetails
                            //
                                //console.log(data1['courseDetails']);return 
                           // console.log(data1['courseDetails']);return 
                            async.each(data1['courseDetails'], function(course,callback1){
                                var courseDetail={};
                                var courseTypeDetail={};
                                var goal={};
                               
                                var courseItemsSelection=[];
                                 
                                for(var i=0;i<course['includedItems'].length;i++){
                                    if(course['includedItems'][i]['itemType']=="scheduledTests" || course['includedItems']['itemType']=="scheduleTests"){
                                        courseItemsSelection.push(course['includedItems'][i]['itemType'])
                                    }else if(course['includedItems'][i]['itemType']=="testGroup"){
                                        courseItemsSelection.push(course['includedItems'][i]['itemType'])
                                    }
                                    //console.log(course['includedItems'][i]);return 
                                   
                                } 
                              //  console.log(courseItemsSelection);return 
                            var finalIncludedItems = _.filter(course['courseId']['courseItems'], function(p){
                                return _.includes(courseItemsSelection,p.itemType);
                            });
                            //console.log(finalIncludedItems);return

                            scheduledTestIndex= _.findIndex(course['includedItems'], function(o) { return o.itemType == 'scheduledTests'; });
                            conceptTestIndex= _.findIndex(course['includedItems'], function(o) { return o.itemType == 'testGroup'; });    
                           //console.log(scheduledTestIndex,conceptTestIndex);return 
                            //console.log(scheduledTestIndex);return 
                            //console.log(course['includedItems'][scheduledTestIndex]);return 
                            scheduledtestArray=[];
                            var scheduledtestType=1; //All
                            if(scheduledTestIndex>-1){
                                
                               // console.log(course['includedItems'][scheduledTestIndex]);return
                                if(course['includedItems'][scheduledTestIndex]['filter']=='partial'){
                                    scheduledtestType=0;
                                    scheduledtestArray=course['includedItems'][scheduledTestIndex]['partialDataDetails']['scheduleIDs'];
                                    
                                }
                            }
                        
                            concepttestArray=[];
                            var concepttestType=1; //All
                            if(conceptTestIndex>-1){
                                
                               // console.log(course['includedItems'][scheduledTestIndex]);return
                                if(course['includedItems'][conceptTestIndex]['filter']=='partial'){
                                    concepttestType=0;
                                    concepttestArray=course['includedItems'][conceptTestIndex]['partialDataDetails']['testIDs'];
                                    
                                }
                            }
                           // console.log(course['courseId']);return 
                            if(course['courseId']!=null){
                                    courseDetail['_id']=course['courseId']['courseType']['id'];
                                    goal['_id']=course['courseId']['_id'];
                                    goal['name']=course['courseId']['name'];
                                    goal['category']=course['courseId']['category'];
                                    goal['subCategory']=course['courseId']['subCategory'];
                                    courseTypeDetail['_id']=course['courseId']['courseType']['id'];
                                    courseTypeDetail['name']=course['courseId']['courseType']['name'];
                                    courseDetail['testName']=course['courseId']['courseType']['name'];
                                    if(course['courseId']['endDate']){
                                        courseDetail['year']=course['courseId']['endDate'].getFullYear();
                                        courseTypeDetail['targetYear']=course['courseId']['endDate'].getFullYear();
                                    }else{
                                        courseDetail['year']=course['courseId']['targetYear'];
                                        courseTypeDetail['targetYear']=course['courseId']['targetYear'];
                                    }
                                    //console.log(course['courseId']['courseItems']);return 
                                    courseDetail['total']=0;
                                    courseDetail['full']=0;
                                    courseDetail['part']=0;
                                    courseDetail['combined']=0;
                                    courseDetail['concept']=0;
                                    
                                   // console.log(course['courseId']['courseItems'].length);return 
                                    //Array of CourseItems
                                   // console.log(course['courseId']['courseItems']);return
                                    // List of courseItems in Course Model
                                    if(finalIncludedItems.length>0){
                                           // console.log(course['courseId']['courseItems']);return 
                                        
                                     async.each(finalIncludedItems,function(courseData,callback2){

                                       //
                                        //console.log(courseData['id']['itemType']);return 
                                      //  console.log(courseData['id']['itemType']);return 
                                        if(courseData['id']['itemType']=="scheduledTests" || courseData['id']['itemType']=="scheduleTests"){  //scheduleTests
                                          
                                            //console.log(courseData['id']['details']['schedule']);return 
                                            var filterScheduledArray=[];
                                            
                                            if(scheduledtestType==1){
                                                filterScheduledArray=courseData['id']['details']['schedule'];
                                                
                                            }else{
                                                if(scheduledtestArray.length>0){
                                                    for(var m=0;m<scheduledtestArray.length;m++){
                                                        
                                                        indexfind= _.findIndex(courseData['id']['details']['schedule'], { 'scheduleID': scheduledtestArray[0]});
                                                        if(indexfind>-1){
                                                            filterScheduledArray.push(courseData['id']['details']['schedule'][indexfind])
                                                            
                                                        }
                                                    }
                                                }
                                            }
                                            
                                           
                                            
                                            
                                          
                                            var totalTest=filterScheduledArray.length;
                                           // console.log(totalTest);return
                                            courseDetail['total']=totalTest;
                                          //  console.log(totalTest);return 
                                            var totalFulltest=0;
                                            var totalParttest=0;
                                            var totalCombinedtest=0;
                                           // console.log("Herer");return 
                                            async.each(filterScheduledArray,function(courseItemData,callback3){
                                                    //console.log(courseItemData);return 
                                                    if(courseItemData['paperDetail']['type']=="full" || courseItemData['paperDetail']['type']=="Full Test"){
                                                        totalFulltest++;
                                                    }
                                                    if(courseItemData['paperDetail']['type']=="part" || courseItemData['paperDetail']['type']=="Part Test"){
                                                        totalParttest++;
                                                    }
                                                    if(courseItemData['paperDetail']['type']=="combined" || courseItemData['paperDetail']['type']=="Combined Test"){
                                                        totalCombinedtest++;
                                                    }
                                                    callback3();
                                            },function(err){

                                                if(err){
                                                    res.status(200).json({code:500,message:"Some error occured",data:{}})
                                                }else{
                                                    courseDetail['full']=totalFulltest;
                                                    courseDetail['combined']=totalCombinedtest;
                                                    courseDetail['part']=totalParttest;
                                                    
                                                }

                                            });
                                        }else if(courseData['id']['itemType']=="testGroup"){
                                            
                                            var filterConceptArray=[];
                                           
                                            if(concepttestType==1){
                                                filterConceptArray=courseData['id']['details']['tests'];
                                            }



                                        
                                            if(concepttestType==0){
                                                if(concepttestArray.length>0){
                                                    for(var m=0;m<concepttestArray.length;m++){
                                                      //  console.log("Herer",courseData['id']['details']['test']);return 
                                                        indexfind= _.findIndex(courseData['id']['details']['tests'], { 'scheduleID': scheduledtestArray[0]});
                                                        if(indexfind>-1){
                                                            filterConceptArray.push(courseData['id']['details']['schedule'][indexfind])
                                                            
                                                        }
                                                    }
                                                }
                                            }
                                           // console.log(filterConceptArray.length);return 
                                            totalConceptTest =filterConceptArray.length;    
                                            courseDetail['concept']=totalConceptTest;
                                            
                                        }
                                         
                                        callback2();
                                    },function(errCourseItems){
                                        if(errCourseItems){

                                        }else{
                                        goals.push(goal);
                                        targetDetailExam.push(courseDetail);
                                        targetExam.push(courseTypeDetail);
                                           callback1();
                                         
                                        }


                                    })
                                    }
                                    
                                }else{

                                    return res.status(200).json({code:500,"message":"No CourseId is Assigned to the courseDetail",data:{}})
                                }
                               
                              
                               
                            },
                            function(err1){
                                    if(err1){
                                        return res.status(200).json({code:500,"message":"Internal Error Occured",data:{}})
                                        
                                    }else{

                                        packageDetails['targetDetailExam']=targetDetailExam;
                                        packageDetails['targetExam']=targetExam;
                                        packageDetails['courses']=goals;
                                        packageDetails['courseDetails']=data1['courseDetails'];
                                        return res.status(200).json({code:200,"message":"Success",data:packageDetails});
                                
                                    }
    
    
                            })
                        })
                       
                    }else{
                        return res.status(200).json({"message":"Invalid Request",code:200,data:{}})
                        
                    }
                }

            })
        }

        }else{
            return res.status(200).json({"message":"Invalid Request",code:500,data:{}})
        }

    },
    
    viewSchedule:function(req,res){
        
           //console.log("Herer",req.query);return 
         if(req.query['package_id']){
            // console.log("Herer");return 
               
                try {
                    var packageId = mongoose.Types.ObjectId(req.query['package_id']);
                    
                    }
                    catch(err) {
                        res.status(200).json({'code':500,"message":"Invalid Request",data:[]});
                        
                    }
                    
                packageModel.findOne({_id:packageId}).populate({path:'courseDetails.courseId',populate: {
                    path: 'courseItems.id',
                    model: 'courseItem'
                  }}).
               
                populate({
                    path: 'courseDetails.includedItems.itemId',
                   
                  }).
                
                lean().exec(function(err,packageDetail){
                //console.log(packageDetail);return 
                 if(err){
                     //console.log("Error",err);return 
                     return res.status(200).json({"message":"Some error occured",code:500,data:{}})
                     
                 }else{
                    // console.log(packageDetail['courseDetails'][0]['courseId']); 
                     
                     if(packageDetail!=null){
                       // console.log(packageDetail['courseDetails'][0]['includedItems']);return 
                         //package.populate(packageDetail,[{path:'courseDetails.courseId.courseItems.id',model:'courseItem'}],function(err1,data1){
                        //to check package i
                             
                             
                             // Array of CourseDetails
                             test=[];
                               // console.log(packageDetail['courseDetails']);return 
                             async.each(packageDetail['courseDetails'], function(course,callback1){
                                var courseDetails={};
                               
                                var scheduledTestIndex=_.findIndex(course['includedItems'], { 'itemType': 'scheduledTests'});
                                //console.log(scheduledTestIndex);return 
                                if(scheduledTestIndex>-1){

                                   // console.log(course['includedItems'][scheduledTestIndex]);return 
                                    if(course['includedItems'][scheduledTestIndex]['filter']=="partial"){
                                        schedulePartialCourse=course['includedItems'][scheduledTestIndex]['partialDataDetails']['scheduleIDs'];
                                       
                                        //console.log(course['courseId']['courseItems']);return 
                                      //  scheduledIndex=_.findByValues(course['courseId']['courseItems'], "itemType", ['scheduledTests','scheduleTests']);
                                        //var scheduledIndex=_.findIndex(course['courseId']['courseItems'], {'itemType': 'scheduledTests'});
                                        var scheduledArray = _.filter(course['courseId']['courseItems'], function(p){
                                            return _.includes(['scheduledTests','scheduleTests'],p.itemType);
                                        });
                                        var totalCourseItem=scheduledArray[0]['id']['details'];
                                       
                                         scheduleTestFinal= _.filter(totalCourseItem['schedule'], function(p){
                                            return _.includes(schedulePartialCourse,p.scheduleID);
                                        });
                                       
                                      //  console.log(scheduleTestFinal);return 
                                        //for(var m=0; m<)
                                    }else{
                                        var scheduledArray = _.filter(course['courseId']['courseItems'], function(p){
                                            return _.includes(['scheduledTests','scheduleTests'],p.itemType);
                                        });
                                        var scheduleTestFinal=scheduledArray[0]['id']['details']['schedule'];
                                       
                                    }

                                }
                                //console.log(course);return 
                                courseDetails['_id']=course['courseType']['id'];
                                courseDetails['goalId']=course['courseId']['_id'];
                                courseDetails['testName']=course['courseType']['name'];

                                //check if course is expired or not
                                 if(course['courseId']['endDate'].getTime() < Date.now()){
                                    courseDetails['expired']=true;
                                 }
                                 else{
                                    courseDetails['expired']=false;
                                 }
                                 
                                
                                 if(course['courseId']!=null){
                                    
                                    
 
                                     //Array of CourseItems
                                    
                                     if(course['courseId']['courseItems'].length>0){
                                      
                                        details=[];
                                        async.each(course['courseId']['courseItems'],function(courseData,callback2){
 
                                           //console.log(course['includedItems']);return 
                                         if(courseData['id']['itemType']=="scheduledTests" || courseData['id']['itemType']=="scheduleTests"){

                                           // console.log(courseData['id']['details']['schedule']);return 
                                             async.each(scheduleTestFinal,function(courseItemData,callback3){
                                                    
                                                    var schedule={};
                                                    if(courseItemData['paperDetail']['id']!="" ||courseItemData['paperDetail']['id']!=null){
                                                        schedule['testAvailable']=true
                                                    }else{
                                                        schedule['testAvailable']=false
                                                    }
                                                    schedule['_id']=courseItemData['scheduleID'];
                                                    schedule['name']=courseItemData['displayName'];
                                                    schedule['duration']=(courseItemData['duration'])?courseItemData['duration']:0;
                                                    schedule['testCode']=courseItemData['codeName'];
                                                    schedule['testType']=(courseItemData['paperDetail']['type'])?courseItemData['paperDetail']['type']:1;
                                                    schedule['available_date']=courseItemData['scheduleDate'];
                                                    schedule['testId']=(courseItemData['paperDetail']['id'])?courseItemData['paperDetail']['id']:"";
                                                    schedule['syllabus']=courseItemData['paperDetail']['syllabus']['text'];
                                                    if(courseDetails['expired']==true){
                                                        schedule['expired']=true;
                                                    }
                                                    else{
                                                        schedule['expired']=false;                                                       
                                                    }
                                                    details.push(schedule);
                                                  
                                                     callback3();
                                             },
                                             function(err){
 
                                                 if(err){
                                                     res.status(200).json({code:500,message:"Some error occured",data:{}})
                                                 }else{
                                                     
                                                    courseDetails['details']=details;
                                                    test.push(courseDetails);
                                                    
                                                  
                                                    
                                                    

                             
                                                   
                                                  
                                                    
                                                 }
                                                
                                             });
                                         }else{

                                         }
                                          
                                         callback2();
                                     },function(errCourseItems){
                                         if(errCourseItems){
                                            console.log("Gerere");
                                         }else{
                                             
                                         
                                          
                                           callback1();   
                                          
                                         }
 
                                         
                                     })
                                     }else{
                                        return res.status(200).json({code:500,"message":"No CourseId is Assigned to the courseDetail",data:{}})
                                        
                                     }
                                     
                                 }else{
                                     return res.status(200).json({code:500,"message":"No CourseId is Assigned to the courseDetail",data:{}})
                                 }
                                
                               
                                
                             },
                             function(err1){
                                     if(err1){
                                         return res.status(200).json({code:500,"message":"Internal Error Occured",data:{}})
                                         
                                     }else{
                                        console.log("Final Callback callback1");

                                        // packageDetails['targetDetailExam']=targetDetailExam;
                                       // console.log("Herer",packageDetail['name']);return 
                                         return res.status(200).json({code:200,"message":"Success",data:test,packageName:packageDetail['name']});
                                         
                                     }
     
     
                             })
                        // })
                        
                     }else{
                         return res.status(200).json({"message":"Invalid Request",code:200,data:{}})
                         
                     }
                 }
 
             })
 
         }else{
             return res.status(200).json({"message":"Invalid Request",code:500,data:{}})
         }
 
    },
}