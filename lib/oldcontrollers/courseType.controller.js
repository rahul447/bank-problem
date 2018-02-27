/* eslint-disable */
var courseType = require('../endpoints/courseType/courseType.model.js');
var course = require('../endpoints/course/course.model.js');
var Concepts = require('../endpoints/concept/concept.model.js');
var mongoose = require('mongoose');
module.exports = {
    /*

        Get courseTypes/goalTypes based on classId
    
    */
    fetchCourseType:function(req,res){
        
        var goals=[];
        for(var i=0;i<req.query['goals'].length;i++){
           
            var id = mongoose.Types.ObjectId(req.query['goals'][i]);
            goals.push(id)
        }
       
        course.find({"_id":{$in:goals}},{courseType:1}).exec(function(err,data){

            if(err){
                return res.status(200).json({
                    'code': 500,
                    'message': 'Error in getCourses'
                });
            }else{
                
                return res.status(200).json({code:200,data:data});
            }

        })


    },
    getCourses: function (req, res) {
      
        courseType.find({'validClass.classId':req.query.classId,hidden:false})
        .select('name')
        .select('displayName')
        .lean()
        .exec(function(err, courses){
            if(err){
              
                return res.json({
                    'code': 500,
                    'message': 'Error in getCourses'
                });
            }
            else{
                
                var course=[];
                for(var i=0;i<courses.length;i++){
                    var courseDetail={};
                    courseDetail['_id']=courses[i]['_id'];
                    courseDetail['name']=(courses[i]['displayName'])?courses[i]['displayName']:courses[i]['name']
                    course.push(courseDetail);
                }
                return res.json({
                    'code': 200,
                    'message': 'Courses retrieved',
                    'data': course
                });
            }
        });
    },
    /**
     * Get concepts
     */
    getConcept: function(req,res){
        //Concepts.find({'conceptCode':{'$in':req.body.codeArray}},{'conceptCode':1}).lean()
        Concepts.aggregate([{'$match':{'$or':[ {'conceptCode': { '$in': req.body.codeArray } },
        { 'migrationObject.columnIdValueID': { '$in': req.body.idArray } } ]}},
    { '$project': {'conceptCode':1,'conceptId': '$migrationObject.columnIdValueID' } }]).exec(function(err,concepts){
            if(err){
                console.log(err);
                  return res.json({
                      'code': 500,
                      'message': 'Error in getConcepts'
                  });
              }
              else{ 
                  return res.json({
                      'code': 200,
                      'message': 'Courses retrieved',
                      'data': concepts
                  });
              }
        })
    }
}