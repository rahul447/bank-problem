
var Class = require('../endpoints/class/class.model.js');

module.exports = {

    /*
        API to fetch all class List.
    */

    classList: function(req, res){
        Class.aggregate([{$match:{status:true}},{"$project":{class:"$name"}}]).exec(function(err, classes){
            if(err){
                return res.json({
                    'status': '500',
                    'message': 'Error retrieving class list'
                });
            }
            else{
                return res.json({
                    'status': '200',
                    'message': 'class list retrieved successfully',
                    'data': classes
                });
            }
        });
    }
}