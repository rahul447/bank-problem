"use strict";

import testType from "./testType.model";
import { ResponseController } from "../../util/response.controller";

export class TestTypeController {

    constructor(parameters) {
        let { loggerInstance, config } = parameters;
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = testType;
    }

    get(req, res){
        if (req.params.id) {
            this.getById(req.params.id, res);
        } else {
            this.modelInstance.find()
                .then(testTypes => {
                    this.loggerInstance.info("Retrieved test types list");
                    res.json(new ResponseController(200, "Test type list retrieved successfully", testTypes));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing test types");
                    res.json(new ResponseController(500, "Error listing test types"));
                });
        }
    }

    getById(id, res){
        this.modelInstance.findById(id)
            .then(testType => {
                if (!testType) {
                    this.loggerInstance.debug("Test type not found");
                    res.json(new ResponseController(404, "Not found test type with given ID"));
                }
                this.loggerInstance.info("Retrieved test type list");
                res.json(new ResponseController(200, "Test type list retrieved successfully", testType));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error getting test type");
                res.json(new ResponseController(500, "Error getting test type"));
            });
    }

    create(req, res) {
        let testType = new this.modelInstance(req.body);
        testType.save().then(testType => {
            this.loggerInstance.info("Test type created successfully");
            return res.json(new ResponseController(200, "Test type created successfully", testType));
        }).catch(err => {
            this.loggerInstance.error("Error creating test type");
            return res.json(new ResponseController(500, "Error creating test type", err));
        })
    }

    patch(req, res) {
        delete req.body._id;
        let id = req.params.id;
        let newTestType = req.body;
        newTestType.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newTestType, {
                new: true
        }).then(response => {
            if (!response) {
                this.loggerInstance.debug("Test type not found");
                res.json(new ResponseController(404, "Not found test type with given ID"));
            }
            this.loggerInstance.info("Test type updated successfully");
            res.json(new ResponseController(200, "Test type Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating test type");
            res.json(new ResponseController(500, "Unable to update test type", err));
        });
    }

    delete(req, res) {
        let id = req.params.id;
        this.modelInstance.findByIdAndRemove(id)
            .then(data => {
                if (!data) {
                    this.loggerInstance.debug("Test type not found");
                    return res.json(new ResponseController(404, "Test type not found"));
                }
                this.loggerInstance.info("Test type deleted successfully");
                return res.json(new ResponseController(200, "Test type deleted successfully", data));
            }).catch(err => {
                this.loggerInstance.error("Error deleting test type");
                return res.json(new ResponseController(500, "Error deleting test type", err));
            });
    }
}