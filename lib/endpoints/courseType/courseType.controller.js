"use strict";

import courseType from "./courseType.model";
import { ResponseController } from "../../util/response.controller";
import loggerInstance from "../../util/apiLogger";

let CourseTypeControllerInstance, {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

class CourseTypeController {

    constructor({ loggerInstance, config }) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = courseType;
    }

    get(req, res) {
        if (req.params.id) {
            this.getById(req.params.id, res);
        } else {
            let query = {};
            if (req.query.subCategory) {
                query['subCategory.id'] = req.query.subCategory;
            }
            let limit = req.query.limit ? Number(req.query.limit) : 30;
            let skip = req.query.page ? limit * Number(req.query.page) : 0;
            this.modelInstance.find(query).skip(skip).limit(limit)
                .then(courseTypes => {
                    this.loggerInstance.info("Retrieved courseTypes list");
                    res.json(new ResponseController(200, "courseTypes list retrieved successfully", courseTypes));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing courseTypes");
                    res.json(new ResponseController(500, "Error listing courseTypes"));
                });
        }
    }

    getNames(req, res) {
        this.modelInstance.find().select('name')
            .then(courseTypes => {
                this.loggerInstance.info("Retrieved courseTypes list");
                res.json(new ResponseController(200, "courseTypes list retrieved successfully", courseTypes));
            })
            .catch((err) => {
                this.loggerInstance.debug("Error listing courseTypes", err);
                res.json(new ResponseController(500, "Error listing courseTypes"));
            });
    }

    getById(id, res) {
        this.modelInstance.findById(id)
            .then(courseType => {
                if (!courseType) {
                    this.loggerInstance.debug("courseType not found");
                    res.json(new ResponseController(404, "Not found courseType with given ID"));
                }
                this.loggerInstance.info("Retrieved courseType list");
                res.json(new ResponseController(200, "courseType list retrieved successfully", courseType));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error getting courseType");
                res.json(new ResponseController(500, "Error getting courseType"));
            });
    }

    create(req, res) {
        let courseType = new this.modelInstance(req.body);
        courseType.save().then(courseType => {
            this.loggerInstance.info("courseType created successfully");
            return res.json(new ResponseController(200, "courseType created successfully", courseType));
        }).catch(err => {
            this.loggerInstance.error("Error creating courseType");
            return res.json(new ResponseController(500, "Error creating courseType", err));
        })
    }

    patch(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newCourseType = req.body;
        newCourseType.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newCourseType, {
                new: true
            }).then(response => {
                if (!response) {
                    this.loggerInstance.debug("CourseType not found");
                    res.json(new ResponseController(404, "Not found CourseType with given ID"));
                }
                this.loggerInstance.info("CourseType updated successfully");
                res.json(new ResponseController(200, "CourseType Updated", response));
            }).catch(err => {
                this.loggerInstance.error("DB error updating CourseType");
                res.json(new ResponseController(500, "Unable to update CourseType", err));
            });
    }

    delete(req, res) {
        let id = req.params.id;
        this.modelInstance.findByIdAndRemove(id)
            .then(data => {
                if (!data) {
                    this.loggerInstance.debug("courseType not found");
                    return res.json(new ResponseController(404, "courseType not found"));
                }
                this.loggerInstance.info("courseType deleted successfully");
                return res.json(new ResponseController(200, "courseType deleted successfully", data));
            }).catch(err => {
                this.loggerInstance.error("Error deleting courseType");
                return res.json(new ResponseController(500, "Error deleting courseType", err));
            });
    }
}

export function getCourseTypeControllerInstance() {
    CourseTypeControllerInstance = CourseTypeControllerInstance || new CourseTypeController({loggerInstance, config});
    return CourseTypeControllerInstance;
}