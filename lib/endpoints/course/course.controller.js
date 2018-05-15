"use strict";

import course from "./course.model";
import courseSyllabus from "../courseSyllabus/courseSyllabus.model";
import mongoose from 'mongoose';
import {ResponseController} from "../../util/response.controller";
import {_} from 'lodash';
import {
    sendClientError,
    sendServerError,
    sendSuccess
} from '../../util/responseLogger'

export class CourseController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = course;
        this.syllabusModelInstance = courseSyllabus;
    }

    async getCourse(req, res) {
        if (req.params.id){
            this.getCourseById(req.params.id, res);
        } else {
            try {
                let query = {};
                req.query.category ? query['category.id'] = req.query.category : '';
                req.query.subCategory ? query['subCategory.id'] = req.query.subCategory : '';
                req.query.courseType ? query['courseType.id'] = req.query.courseType : '';
                let limit = req.query.limit ? Number(req.query.limit) : 10;
                let skip = req.query.page ? limit * Number(req.query.page) : 0;
                const responseObject = {};
                const sortKeys = ['name', 'updatedAt'];
                const orderKeys = ['asc', 'desc'];
                const sort = req.query.sort || 'updatedAt';
                const order = req.query.order || 'asc';
                if (!sortKeys.includes(sort)) {
                    return sendClientError({
                        res,
                        responseMessage: 'Invalid sort param'
                    });
                }
                if (!orderKeys.includes(order)) {
                    return sendClientError({
                        res,
                        responseMessage: 'Invalid order param'
                    });
                }
                const sortValues = {
                    updatedAt : 'updatedAt',
                    name: 'name'
                };
                const orderValues = {
                    asc: 1,
                    desc: -1
                };
                const sortParam = {
                    [sortValues[sort]]: orderValues[order]
                };
                responseObject.data = await this.modelInstance.find(query)
                    .sort(sortParam)
                    .skip(skip)
                    .limit(limit);
                responseObject.totalCount = await this.modelInstance.count(query);
                responseObject.sortKeys = sortKeys;
                responseObject.orderKeys = orderKeys;
                return sendSuccess({
                    res,
                    responseMessage: 'Courses retrieved successfully',
                    responseObject
                });
            } catch (error) {
                return sendServerError({
                    res,
                    responseMessage: 'Error listing Courses'
                });
            }
        }
    }
    getCourseHeader(req, res) {
        this.modelInstance.findById(req.params.id)
            .select('name courseImage category subCategory courseType')
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
            // this.modelInstance.findById(id)
            //     .then(course => {
            //         _.merge(course, newCourse);
            //         console.log(newCourse);
            //         console.log(course);
            //         course.save()
            //             .then(response => resolve(response))
            //             .catch(err => reject(err));
            //     })
            //     .catch(err => reject(err))
            // this.modelInstance.findOneAndUpdate({
            //     _id: id
            // }, newCourse, {
            //     new: true,
            //     overwrite: overwrite
            // }).then()
            let updatedCourse = new this.modelInstance(newCourse);
            updatedCourse._id=id;
            ((that)=>{
                this.modelInstance.findOneAndUpdate({_id:id},updatedCourse,{new:true},function(err,response){
                    if(!err){
                        resolve(response)
                    }
                    else{
                        reject(err)
                    }
                })
            })(this)
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

    async getCourseTestItems(req, res){
        try {
            const courseWithTests = await this.modelInstance.findById(req.params.id)
                .select('courseItems name courseImage category subCategory courseType')
                .populate('courseItems.id');
            if (!courseWithTests) {
                return sendClientError({
                    res,
                    responseMessage: 'Not found a course with given ID'
                });
            }
            return sendSuccess({
                res,
                responseMessage: 'Course test items retrieved successfully',
                responseObject: courseWithTests
            });
        } catch (error) {
            return sendServerError({
                res,
                responseMessage: 'Unable to retrieve course tests'
            });
        }
    }

    async getSelectedCourses(req, res) {
        try {
            const courses = await this.modelInstance.find({ _id: { $in: req.body.ids } }).select('name').lean();
            const courseDetails = await Promise.all(courses.map(async course => {
                course.subjects = await this.syllabusModelInstance.find({ courseId: course._id, type: 'subject', name: req.body.subjectName }).select('name').lean();
                return course;
            }));
            return res.json(new ResponseController(200, "Course type names listed", courseDetails));
        } catch (error) {
            return res.json(new ResponseController(500, "Error listing course type names"));
        }
    }

    getCourseItemDetailsByCourseAgg(courseId) {
        return this.modelInstance.aggregate([
            {
                "$match": {
                    "_id": mongoose.Types.ObjectId(courseId)
                }
            },
            {
                "$project": {
                    "name": 1,
                    "courseItems": 1
                }
            },
            {
                "$unwind": "$courseItems"
            },
            {
                "$lookup": {
                    from: "courseitems",
                    as: "courseItemsData",
                    localField: "courseItems.id",
                    foreignField: "_id"
                }
            },
            {
                "$unwind": "$courseItemsData"
            },
            {
                "$project": {
                    "CourseName": "$name",
                    "itemName": "$courseItems.itemName",
                    "itemType": "$courseItems.itemType",
                    "courseItemId": "$courseItemsData._id",
                    "courseItemsDetails": "$courseItemsData.details"
                }
            },
            {
                "$group": {
                    "_id": "$_id",
                    "CourseNameSet": { $addToSet: "$CourseName" },
                    "itemNameSet": { $addToSet: "$itemName" },
                    "itemTypeSet": { $addToSet: "$itemType" },
                    "courseItemIdSet": { $addToSet: "$courseItemId" },
                    "courseItemsDetailsSet": { $addToSet: "$courseItemsDetails" },
                }
            },
            {
                "$project": {
                    "courseName": { $arrayElemAt: [ "$CourseNameSet", 0 ] },
                    "itemNameSet": 1,
                    "itemTypeSet": 1,
                    "courseItemsDetailsSet": 1,
                    "courseItemIdSet": 1
                }
            }
        ]);
    }

    async getCourseItemDetailsByCourse(req, res) {

        let courseItemDetails = await this.getCourseItemDetailsByCourseAgg(req.params.id);
        console.log("courseItemDetails : ", courseItemDetails);

        this.loggerInstance.info(`success getCourseItemDetailsByCourse`);
        return res.json({"status": 200, "data": courseItemDetails});
    }

}