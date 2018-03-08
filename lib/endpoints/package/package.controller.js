"use strict";

import packages from "./package.model";
import mongoose from 'mongoose';
export class PackageController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.packageModelInstance = packages;
    }

    createPackage(req, res) {
        let newpackage = new this.packageModelInstance(req.body);
        newpackage.save()
            .then(newPackageResult => {
                this.loggerInstance.info("Package created successfully", newPackageResult);
                return res.json({"status": 200, "data": newPackageResult});
            })
            .catch(err => {
                this.loggerInstance.error("Error creating Package", err);
                return res.json({"status": 200, "data": err});
            })
    }

    listPackage(req, res) {
        ((that) => {
            let listPackageQuery = that.packageModelInstance.find({});
            listPackageQuery.select('name code sku status');
            listPackageQuery.limit(parseInt(req.query.limit));
            listPackageQuery.skip(parseInt(req.query.skip) - 1);
            listPackageQuery.exec(function (err, docs) {
                if(err) {
                    that.loggerInstance.error(`error listPackage ${err}`);
                    return res.json({"status": 500, "data": err});
                }
                that.loggerInstance.info(`success listPackage ${err}`);
                return res.json({"status": 200, "data": docs});
            });
        })(this);
    }

    getPackageListCount(req, res) {
        ((that) => {
            let listPackageQuery = that.packageModelInstance.count();
            listPackageQuery.exec(function (err, docs) {
                if(err) {
                    that.loggerInstance.error(`error getPackageListCount ${err}`);
                    return res.json({"status": 500, "data": err});
                }
                that.loggerInstance.info(`success getPackageListCount ${err}`);
                return res.json({"status": 200, "data": docs});
            });
        })(this);
    }

    deletePackage(req, res) {
        ((that) => {
            return that.packageModelInstance.findOneAndRemove({_id: mongoose.Types.ObjectId(req.params.id)}, function(err) {
                if(err) {
                    that.loggerInstance.error(`error deletePackage ${err}`);
                    return res.json({"status": 500, "data": err});
                }

                that.loggerInstance.info(`success deletePackage`);
                return res.json({"status": 200, "data": {}});
            });
        })(this)
    }

    basicInfoSave(req, res) {

        let packageId = req.query.id,
            packageBody = req.body;

        ((that) => {
            this.packageModelInstance.findOne({ _id: mongoose.Types.ObjectId(packageId)},
                function (err, doc) {
                    doc.expiryDate = new Date(packageBody.expiryDate);
                    doc.objectiveString = packageBody.objectiveString;
                    doc.recommendationString = packageBody.recommendedString;
                    doc.availableForB2C = packageBody.bc;
                    doc.price = parseInt(packageBody.price);
                    doc.discount = parseInt(packageBody.discount);
                    doc.save(function(err, data) {
                        if(err) {
                            that.loggerInstance.error("Package Basic error", err);
                            return res.json({"status": 200, "data": err});
                        }
                        that.loggerInstance.info("Package Basic success", data);
                        return res.json({"status": 200, "data": data});
                    });
                });
        })(this);
    }

    getCourseByPackage(req, res) {
        ((that) => {
            that.packageModelInstance.aggregate([
                {
                    "$match": {
                        "_id": mongoose.Types.ObjectId(req.params.id)
                    }
                },
                {
                    "$unwind": "$courseDetails"
                },
                /*{
                    "$unwind": "$courseDetails.includedItems"
                },*/
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseDetails.courseId',
                        foreignField: '_id',
                        as: 'courseItemDetails'
                    }
                },
                /*{
                    "$unwind": "$courseItemDetails"
                },*/
                /*{
                    "$project": {
                        "_id": 1,
                        "clientID": 1,
                        "userId": 1,
                        "name": 1,
                        "sku": 1,
                        "expiryDate": 1,
                        "courseDetails.courseId": 1,
                        "courseDetails.courseType": 1,
                        "courseDetails.courseName": 1,
                        "courseDetails.includedItems": 1,
                        "courseItemDetails._id": 1,
                        "courseItemDetails.name": 1,
                        "courseItemDetails.itemType": 1,
                        "courseItemDetails.details": 1
                    }
                }*/
            ])
            .then(function (docs) {
                    that.loggerInstance.info(`success getCourseByPackage`);
                    return res.json({"status": 200, "data": docs});
            }).catch(err => {
                that.loggerInstance.error(`error getCourseByPackage ${err}`);
                return res.json({"status": 500, "data": err});
            });
        })(this);
    }
}