"use strict";
import classes from "./class.model";

export class ClassController {

    constructor(loggerInstance, config) {
        console.log(" ------in ClassController--------- ");
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.classModelInstance = classes;
    }

    classList(req, res){
        console.log(" in classList 2");
        this.classModelInstance.aggregate([{$match:{status:true}},{"$project":{class:"$name"}}]).exec(function(err, classes){
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