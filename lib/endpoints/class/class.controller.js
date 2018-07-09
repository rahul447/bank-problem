"use strict";
import classes from "./class.model";
import courses from "../course/course.model";
import { ResponseController } from "../../util/response.controller";
import loggerInstance from "../../util/apiLogger";

let ClassControllerInstance,
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

class ClassController {

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

export function getClassControllerInstance() {
    ClassControllerInstance = ClassControllerInstance || new ClassController(loggerInstance, config);
    return ClassControllerInstance;
}