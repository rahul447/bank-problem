"use strict";

import packages from "./package.model";

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
}