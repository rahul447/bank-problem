"use strict";
import classes from "./class.model";
import courses from "../course/course.model";
import { ResponseController } from "../../util/response.controller";

export class ClassController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.classModelInstance = classes;
        this.courseModelInstance = courses;
    }

    classList(req, res){
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