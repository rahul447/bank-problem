"use strict";

import courseTag from "./courseTag.model";
import { ResponseController } from "../../util/response.controller";

export class CourseTagController {

    constructor(parameters) {
        let { loggerInstance, config } = parameters;
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = courseTag;
    }

    get(req, res){
        if (req.params.id) {
            this.getById(req.params.id, res);
        } else {
            let limit = req.query.limit ? Number(req.query.limit) : 30;
            let skip = req.query.page ? limit * Number(req.query.page) : 0;
            this.modelInstance.find().skip(skip).limit(limit)
                .then(tags => {
                    this.loggerInstance.info("Retrieved course tags list");
                    res.json(new ResponseController(200, "course tags list retrieved successfully", tags));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing course tags");
                    res.json(new ResponseController(500, "Error listing course tags"));
                });
        }
    }

    getById(id, res){
        this.modelInstance.findById(id)
            .then(tag => {
                if (!tag) {
                    this.loggerInstance.debug("Course tag not found");
                    res.json(new ResponseController(404, "Not found course tag with given ID"));
                }
                this.loggerInstance.info("Retrieved course tag list");
                res.json(new ResponseController(200, "Course tag list retrieved successfully", tag));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error getting course tag");
                res.json(new ResponseController(500, "Error getting course tag"));
            });
    }

    create(req, res) {
        let tag = new this.modelInstance(req.body);
        tag.save().then(tag => {
            this.loggerInstance.info("Course tag created successfully");
            return res.json(new ResponseController(200, "Course tag created successfully", tag));
        }).catch(err => {
            this.loggerInstance.error("Error creating Course Tag");
            return res.json(new ResponseController(500, "Error creating course tag", err));
        })
    }

    patch(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newCourseTag = req.body;
        newCourseTag.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newCourseTag, {
                new: true
        }).then(response => {
            if (!response) {
                this.loggerInstance.debug("Course tag not found");
                res.json(new ResponseController(404, "Not found course tag with given ID"));
            }
            this.loggerInstance.info("Course tag updated successfully");
            res.json(new ResponseController(200, "Course tag Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating course tag");
            res.json(new ResponseController(500, "Unable to update course tag", err));
        });
    }

    delete(req, res) {
        let id = req.params.id;
        this.modelInstance.findByIdAndRemove(id)
            .then(data => {
                if (!data) {
                    this.loggerInstance.debug("Course tag not found");
                    return res.json(new ResponseController(404, "Course tag not found"));
                }
                this.loggerInstance.info("Course tag deleted successfully");
                return res.json(new ResponseController(200, "Course tag deleted successfully", data));
            }).catch(err => {
                this.loggerInstance.error("Error deleting course tag");
                return res.json(new ResponseController(500, "Error deleting course tag", err));
            });
    }
}