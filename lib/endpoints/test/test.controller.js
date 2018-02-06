"use strict";
import tests from "./tests.model";
import {ResponseController} from "../../util/response.controller";
export class TestController {
    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.testModelInstance = tests;
    }
    testList(req, res) {
        this.testModelInstance.find()
            .then(tests => {
                this.loggerInstance.info("Retrieved test list");
                res.json(new ResponseController(200, "Test list retrieved successfully", tests));
            })
            .catch(err => {
                this.loggerInstance.error("DB Error retrieving test list");
                res.json(new ResponseController(500, "Error retrieving test list"));
            });
    }
    addTest(req, res) {
        let test = new this.testModelInstance(req.body);
        test.save()
            .then(response => {
                this.loggerInstance.info("Created test succesfully");
                res.json(new ResponseController(200, "Test added", response));
            })
            .catch(err => {
                this.loggerInstance.error("DB error creating new test");
                res.json(new ResponseController(500, err));
            });
    }
    updateTest(req, res) {
        delete req.body._id;
        let testId = req.params.id;
        let newTest = req.body;
        this.testModelInstance.findOneAndUpdate({
            _id: testId
        }, newTest, {
            new: true,
            overwrite: true
        })
            .then(response => {
                this.loggerInstance.info("Test updated succesfully");
                res.json(new ResponseController(200, "Test Updated", response));
            })
            .catch(err => {
                this.loggerInstance.error("DB error updating test");
                res.json(new ResponseController(500, "Unable to update test", err));
            });
    }
}