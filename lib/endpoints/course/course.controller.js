"use strict";

import course from "./course.model";
import mongoose from 'mongoose';
import {ResponseController} from "../../util/response.controller";
import {_} from 'lodash';

export class CourseController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = course;
    }

    getCourse(req, res) {
        if (req.params.id){
            this.getCourseById(req.params.id, res);
        } else {
            let query = {};
            req.query.category ? query['category.id'] = req.query.category : '';
            req.query.subCategory ? query['subCategory.id'] = req.query.subCategory : '';
            req.query.courseType ? query['courseType.id'] = req.query.courseType : '';
            let limit = req.query.limit ? Number(req.query.limit) : 30;
            let skip = req.query.page ? limit * Number(req.query.page) : 0;
            this.modelInstance.find(query)
                .sort('-updatedAt')
                .skip(skip)
                .limit(limit)
                .then(courses => {
                    this.loggerInstance.info("Retrieved Course list");
                    res.json(new ResponseController(200, "Course list retrieved successfully", courses));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing Courses");
                    res.json(new ResponseController(500, "Error listing Courses"));
                });
        }
    }
    getCourseHeader(req, res) {
        this.modelInstance.findById(req.params.id)
            .select('courseImage category subCategory courseType')
            .then(course => {
                if (!course) {
                    this.loggerInstance.debug("Course not found");
                    return res.json(new ResponseController(404, "Not found course with given ID"));
                }
                this.loggerInstance.info("Retrieved course list");
                return res.json(new ResponseController(200, "Course list retrieved successfully", course));
            })
            .catch(() => {
                this.loggerInstance.error("DB error getting course");
                return res.json(new ResponseController(500, "Error getting course"));
            });
    }
    getCourseById(id, res) {
        this.modelInstance.findById(id)
            .then(course => {
                if (!course) {
                    this.loggerInstance.debug("Course not found");
                    return res.json(new ResponseController(404, "Not found course with given ID"));
                }
                this.loggerInstance.info("Retrieved course list");
                return res.json(new ResponseController(200, "Course list retrieved successfully", course));
            })
            .catch(() => {
                this.loggerInstance.error("DB error getting course");
                return res.json(new ResponseController(500, "Error getting course"));
            });
    }
    createCourse(req, res){

        if(!req.body.language) {
            req.body.language = {};
            req.body.language.id = "5a8405fa2c386932c50f77ea";
            req.body.language.name = "en-us";
        }
        let newCourse = new this.modelInstance(req.body);

        newCourse.save().then(course => {
            this.loggerInstance.info("Course created successfully");
            return res.json(new ResponseController(200, "Course created successfully", course));
        }).catch(err => {
            this.loggerInstance.error("Error creating Course");
            return res.json(new ResponseController(500, "Error creating course", err));
        })
    }

    /*
    * For PATCH request for partial updates
    */
    patchCourse(req, res){
        this.updateCourse(req, res);
    }

    /*
    * For PUT request to update completely
    */
    putCourse(req, res){
        this.updateCourse(req, res, true);
    }

    updateCourse(req, res, overwrite){
        delete req.body._id;
        let id = req.params.id;
        let newCourse = req.body;
        newCourse.updatedAt = new Date();
        this.updateCourseInDb(id, newCourse, overwrite).then(response => {
            if (!response) {
                this.loggerInstance.debug("Course not found");
                res.json(new ResponseController(404, "Not found course with given ID"));
            }
            this.loggerInstance.info("Course updated successfully");
            res.json(new ResponseController(200, "Course Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating course");
            res.json(new ResponseController(500, "Unable to update course", err));
        });
    }

    updateCourseInDb(id, newCourse){
        return new Promise((resolve, reject) => {
            this.modelInstance.findById(id)
                .then(course => {
                    _.merge(course, newCourse);
                    course.save()
                        .then(response => resolve(response))
                        .catch(err => reject(err));
                })
                .catch(err => reject(err))
            // this.modelInstance.findOneAndUpdate({
            //     _id: id
            // }, newCourse, {
            //     new: true,
            //     overwrite: overwrite
            // }).then()
            
        });
    }

    getCourseImages(req, res){
        this.modelInstance.distinct('courseImage', {})
            .then(data => {
                data = data.filter(image => image);
                this.loggerInstance.info("Course images retrieved successfully");
                res.json(new ResponseController(200, "Course images retrieved successfully", data));
            })
            .catch(err => {
                this.loggerInstance.error("DB error getting course images");
                res.json(new ResponseController(500, "DB error getting course images", err));
            });
    }

    getCourseListing(req, res) {
        console.log("req query : ", req.query);
        ((that) => {
            let queryObj = {};

            if (req.query.categoryId)
                queryObj['category.id'] = mongoose.Types.ObjectId(req.query.categoryId);

            if (req.query.subCategoryId)
                queryObj['subCategory.id'] = mongoose.Types.ObjectId(req.query.subCategoryId);

            if (req.query.courseTypeId)
                queryObj['courseType.id'] = mongoose.Types.ObjectId(req.query.courseTypeId);

            let courseListingQuery = that.modelInstance.find(queryObj);
            //courseListingQuery.select('name category.name subCategory.name courseType');
            courseListingQuery.limit(parseInt(req.query.limit));
            courseListingQuery.skip(parseInt(req.query.skip) - 1);
            courseListingQuery.exec(function (err, docs) {
                if (err) {
                    that.loggerInstance.error(`error getCourseListing ${err}`);
                    return res.json({"status": 500, "data": err});
                }
                that.loggerInstance.info(`success getCourseListing`);
                return res.json({"status": 200, "data": docs});
            });
        })(this);
    }

    getCourseTestItems(req, res){
        this.modelInstance.findById(req.params.id)
            .select('courseItems courseImage category subCategory courseType')
            .populate('courseItems.id')
            .then(test => res.json(test))
            .catch(err => res.json(new ResponseController(500, "Error retrieving course tests", err)));
    }
    async getSelectedCourses(req, res) {
        try {
            const courses = await this.modelInstance.find({ _id: { $in: req.body.ids } }).select('name');
            return res.json(new ResponseController(200, "Course type names listed", courses));
        } catch (error) {
            return res.json(new ResponseController(500, "Error listing course type names"));
        }
    }
}