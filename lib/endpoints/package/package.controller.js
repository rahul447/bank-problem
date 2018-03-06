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
}