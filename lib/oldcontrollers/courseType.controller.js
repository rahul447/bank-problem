var courseType = require('../endpoints/courseType/courseType.model.js');

module.exports = {
    /*

        Get courseTypes/goalTypes based on classId
    
    */

    getCourses: function (req, res) {
      
        courseType.find({'validClass.classId':req.query.classId,hidden:false})
        .select('name')
        .exec(function(err, courses){
            if(err){
              
                return res.json({
                    'code': 500,
                    'message': 'Error in getCourses'
                });
            }
            else{
               // console.log(courses);return 
                return res.json({
                    'code': 200,
                    'message': 'Courses retrieved',
                    'data': courses
                });
            }
        });
    }
}