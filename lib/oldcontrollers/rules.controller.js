/* eslint-disable */
var Rules = require('../endpoints/rules/rules.model.js');
var mongoose=require('mongoose');
module.exports = {

    /*
        API to fetch all class List.
    */

    getRules: function(req,res){
        var id=mongoose.Types.ObjectId(req.body._id);
        Rules.find({'_id':id},function(err,data){
            if(err){
                return res.json({
                    'status': '404',
                    'message': "not able to find rules",
                    "error": err
                });
            }
            else{
                return res.json({
                    'status': '200',
                    'message': " finding rules",
                    "data": data
                });
            }
        })
        
    },
    saveRules: function(req,res){
        var data= new Rules(req.body);
        data.save(function(err,data){
            if(err){
                return res.json({
                    'status': '404',
                    'message': "not able to save rules",
                    "error": err
                });
            }
            else{
                return res.json({
                    'status': '200',
                    'message': "rules saved...",
                    "error": data
                });
            }
        });
    }
}