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

    async getClassCourses(req, res) {
        try {
            let {
                name
            } = req.params;
            name = name === '13' ? '12' : name;
            let classInt = parseInt(name);

            /* Can/Should be changed or made more dynamic, currently only for 2019 */
            let targetYear = 2019 + 12 - classInt;

            targetYear = targetYear.toString();
            name += 'th';
            let classObj = await this.classModelInstance.findOne({ name }).select('_id');
            if (!classObj) {
                this.loggerInstance.debug("Did not find that class");
                return res.json(new ResponseController(404, "Did not find that class"));
            }
            let courses = await this.courseModelInstance.find({
                targetYear,
                'eligibility.class.id': classObj._id
            }).select('_id name');
            return res.json(new ResponseController(200, "Successfully retrieved course list for a class", courses));
        } catch (error) {
            this.loggerInstance.debug(error, "Error finding class");
            return res.json(new ResponseController(500, "Error finding class"));
        }

    }
}