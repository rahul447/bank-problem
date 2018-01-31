"use strict";
import tests from "./tests.model";
export class TestController {
    constructor(loggerInstance, config) {
        console.log(" ------in ClassController--------- ");
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.testModelInstance = tests;
    }
    testList(req, res) {
        console.log(" in testList???");
        this.testModelInstance.find().exec(function(err, tests) {
            if (err) {
                return res.json({
                    'status': '500',
                    'message': 'Error retrieving test list'
                });
            } else {
                return res.json({
                    'status': '200',
                    'message': 'test list retrieved successfully',
                    'data': tests
                });
            }
        });
    }
    addTest(req, res) {
        // console.log("addTest");
        console.log(req.body);
        let test = new tests(req.body)
        test.save().then(function(response) {
            return res.json({
                'status': '200',
                'message': 'test added',
                'data': response
            });
        }, function(err) {
            return res.json({
                'status': '500',
                'message': err
            });
        });
    }
    updateTest(req, res) {
        console.log("updateTest");
        //console.log(req.body);
        let tempTest = new this.testModelInstance(req.body);
        console.log(tempTest._id);
        this.testModelInstance.findOneAndUpdate({
            _id: req.body._id
        }, tempTest, {
            new: true
        }).exec(function(err, response) {
            console.log(err, response);
            return res.json({
                'status': '200',
                'message': 'test updated',
                'data': response
            });
        }, function(err) {
            return res.json({
                'status': '500',
                'message': err
            });
        })
    }
}