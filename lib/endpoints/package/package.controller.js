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
            listPackageQuery.select('name code sku status thumbUrl url');
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
            that.packageModelInstance.findOneAndRemove({_id: mongoose.Types.ObjectId(req.params.id)}, function(err) {
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

        console.log("req.body : ", req.body);

        ((that) => {
            this.packageModelInstance.findOne({ _id: mongoose.Types.ObjectId(packageId)},
                function (err, doc) {
                    doc.expiryDate = new Date(packageBody.expiryDate);
                    doc.objectiveString = packageBody.objectiveString;
                    doc.recommendationString = packageBody.recommendationString;
                    doc.availableForB2C = packageBody.availableForB2C;
                    doc.price = parseInt(packageBody.price);
                    doc.discount = parseInt(packageBody.discount);
                    doc.targetYear = packageBody.targetYear;
                    doc.metatags = packageBody.metatags;
                    doc.FAQ = [];
                    packageBody.FAQ.map(ff => {
                        ff.type = mongoose.Types.ObjectId();
                        ff.sequence = ff.sequence.toString();
                        doc.FAQ.push(ff)
                    });
                    doc.save(function(err, data) {
                        if(err) {
                            that.loggerInstance.error("Package basicInfoSave error", err);
                            return res.json({"status": 200, "data": err});
                        }
                        that.loggerInstance.info("package basicInfoSave success");
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
                {
                    $lookup: {
                        from: 'courses',
                        localField: 'courseDetails.courseId',
                        foreignField: '_id',
                        as: 'courseItemDetails'
                    }
                },
                {
                    "$unwind": "$courseItemDetails"
                },
                {
                    $group : {
                        _id : "$_id",
                        clientID: { $push: "$clientID" },
                        userId: { $push: "$userId" },
                        name: { $push: "$name" },
                        sku: { $push: "$sku" },
                        expiryDate: { $push: "$expiryDate" },
                        courseDetails: { $push: "$courseDetails" },
                        courseItemDetails: { $push: "$courseItemDetails" },
                    }
                },
                {
                    $project:
                        {
                            _id: 1,
                            clientID: { $arrayElemAt: [ "$clientID", 0 ] },
                            userId: { $arrayElemAt: [ "$userId", 0 ] },
                            name: { $arrayElemAt: [ "$name", 0 ] },
                            sku: { $arrayElemAt: [ "$sku", 0 ] },
                            expiryDate: { $arrayElemAt: [ "$expiryDate", 0 ] },
                            courseDetails: 1,
                            courseItemDetails: 1
                        }
                }
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

    getPackageBasicInfo(req, res) {
        this.packageModelInstance.findOne({ '_id': mongoose.Types.ObjectId(req.params.id) }, 'name sku code thumbUrl url objectiveString recommendationString expiryDate availableForB2C price discount FAQ targetYear metatags', (err, pkgInfo) => {
            if (err) return res.json({data: err, statusCode: 500, message: `packageInfo Fetch Error for ${req.params.id}`});
            this.loggerInstance.info(`packageInfo fetch success`);
            return res.json({data: pkgInfo, statusCode:200, message: `packageInfo fetch success`});
        });
    }

    savePackageInfoDetails(req, res) {
        this.packageModelInstance.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, (err, doc) => {
            Object.assign(doc, req.body);
            doc.save((err, newDoc) => {
                return err ? res.json({data: err, statusCode: 500, message: `Error savePackageInfoDetails`}): res.json({data: newDoc, statusCode: 200, message: `Success savePackageInfoDetails`});
            });
        });
    }

    linkselectedCoursesToPackage(req, res) {
        this.packageModelInstance.findOne({ _id: mongoose.Types.ObjectId(req.params.id)}, (err, doc) => {
            doc.courseDetails = doc.courseDetails ? doc.courseDetails : [];
            req.body.map(course => {
                let eachCourseData = {};
                eachCourseData.courseId = mongoose.Types.ObjectId(course.id);
                eachCourseData.courseName = course.name;
                eachCourseData.courseType = Object.assign({}, course.type);
                doc.courseDetails.push(eachCourseData);
            });
            doc.save((err, data) => {
                if(err) {
                    this.loggerInstance.error("linkselectedCoursesToPackage error", err);
                    return res.json({"status": 200, "data": err});
                }
                this.loggerInstance.info("linkselectedCoursesToPackage success");
                return res.json({"status": 200, "data": data});
            });
        });
    }

    courseCountPerPackageAgg(packageId) {
        return this.packageModelInstance.aggregate([
            {
                "$match": {
                    "_id": mongoose.Types.ObjectId(packageId)
                }
            },
            {
                $project: {
                    cntOfCourseDetails: { $size: "$courseDetails" }
                }
            }
        ])
    }

    async courseCountPerPackage(req, res) {
        try {
            let countOfCourses = await this.courseCountPerPackageAgg(req.params.id);
            return res.json({"status": 200, "data": countOfCourses});
        } catch(err) {
            return res.json({"status": 500, "data": err});
        }
    }

    removeCourseFromPackage(req, res) {
         this.packageModelInstance.update(
             { _id: mongoose.Types.ObjectId(req.params.id) },
             { $pull: { 'courseDetails': { courseId: mongoose.Types.ObjectId(req.body.courseId) } } },
             {},
             (err, doc) => {
                 if(err) {
                     this.loggerInstance.error(`removeCourseFromPackage Error ${err}`);
                     return res.json({"status": 500, "data": err})
                 }

                 this.loggerInstance.info(`removeCourseFromPackage Success`);
                 return res.json({"status": 200, "data": doc});
             }
         );
    }

    addCourseItemToPackage(req, res) {

        const itemTypeObj = { testId: "testGroup", scheduleIDs: "scheduledTests", sampleTestId: "sampleTests" };
        console.log(" req.body : ", req.body);
        this.packageModelInstance.findById(mongoose.Types.ObjectId(req.params.packageId), (err, doc) => {
           doc.courseDetails.map(course => {
               if(course.courseId == req.params.courseId) {
                   this.selectedMapper(req, itemTypeObj, course);
                   this.allMapper(req, itemTypeObj, course);
               }
           });
           doc.save((err, upDoc) => {
               if(err) {
                   this.loggerInstance.error(`addCourseItemToPackage Error ${err}`);
                   return res.json({"status": 500, "data": err});
               }
               this.loggerInstance.info(`addCourseItemToPackage Success`);
               return res.json({"status": 200, "data": upDoc});
           });
        });

    }

    selectedMapper(req, itemTypeObj, course) {
        req.body.selectedCourseItems.map(selected => {
            let includeObj = {};
            includeObj.partialDataDetails = {};
            selected.map(inner => {
                if (inner.testId) {
                    !includeObj.partialDataDetails.testIDs ? includeObj.partialDataDetails
                        .testIDs = [] : '';
                    includeObj.itemId = req.body.courseItemMap.testGroup;
                    includeObj.itemType = itemTypeObj.testId;
                    includeObj.filter = !req.body.partialObj.tests ? "partial" : "all";
                    includeObj.partialDataDetails.testIDs.push(inner.testId);
                }

                if (inner.scheduleID) {
                    !includeObj.partialDataDetails.scheduleIDs ? includeObj.partialDataDetails
                        .scheduleIDs = [] : '';
                    includeObj.itemId = req.body.courseItemMap.scheduledTests;
                    includeObj.itemType = itemTypeObj.scheduleIDs;
                    includeObj.filter = !req.body.partialObj.schedule ? "partial" : "all";
                    includeObj.partialDataDetails.scheduleIDs.push(inner.scheduleID);
                }

                if (inner.sampleTestId) {
                    !includeObj.partialDataDetails.sampleTestId ? includeObj.partialDataDetails
                        .sampleTestId = [] : '';
                    includeObj.itemId = req.body.courseItemMap.sampleTests;
                    includeObj.itemType = itemTypeObj.sampleTestId;
                    includeObj.filter = !req.body.partialObj.sample ? "partial" : "all";
                    includeObj.partialDataDetails.sampleTestId.push(inner.sampleTestId);
                }
            });
            course.includedItems.push(includeObj);
        });
    }

    allMapper(req, itemTypeObj, course) {
        req.body.allCourseItems.map(selected => {
            selected.filter = 'all';
            course.includedItems.push(selected);
        });
    }
}