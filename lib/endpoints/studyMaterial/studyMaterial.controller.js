"use strict";

import studyMaterial from "./studyMaterial.model";
import {ResponseController} from "../../util/response.controller";

export class StudyMaterialController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = studyMaterial;
    }

    getStudyMaterial(req, res) {
        if (req.params.id){
            this.getStudyMaterialById(req.params.id, res);
        } else {
            this.modelInstance.find()
                .then(materials => {
                    this.loggerInstance.info("Retrieved Study Material list");
                    res.json(new ResponseController(200, "Study Material list retrieved successfully", materials));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing Study Material");
                    res.json(new ResponseController(500, "Error listing Study Material"));
                });
        }
    }
    getStudyMaterialById(id, res) {
        this.modelInstance.findById(id)
            .then(material => {
                if (!material) {
                    this.loggerInstance.debug("Study Material not found");
                    res.json(new ResponseController(404, "Not found Study Material with given ID"));
                }
                this.loggerInstance.info("Retrieved Study Material list");
                res.json(new ResponseController(200, "Study Material list retrieved successfully", material));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error listing Study Material");
                res.json(new ResponseController(500, "Error listing Study Material"));
            });
    }
    createStudyMaterial(req, res){
        let newMaterial= new this.modelInstance(req.body);
        newMaterial.save().then(material => {
            this.loggerInstance.info("Study Material created successfully");
            return res.json(new ResponseController(200, "Study Material created successfully", material));
        }).catch(err => {
            this.loggerInstance.error("Error creating Study Material");
            return res.json(new ResponseController(500, "Error creating Study Material", err));
        })
    }
    updateStudyMaterial(req, res){
        delete req.body._id;
        let id = req.params.id;
        if (!id){
            this.loggerInstance.debug("No ID specified");
            return res.json(new ResponseController(400, "No ID specified"));
        }
        let newMaterial = req.body;
        newMaterial.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newMaterial, {
            new: true
        }).then(response => {
            if (!response) {
                this.loggerInstance.debug("Study Material not found");
                res.json(new ResponseController(404, "Not found Study Material with given ID"));
            }
            this.loggerInstance.info("Study Material updated successfully");
            res.json(new ResponseController(200, "Study Material Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating Study Material");
            res.json(new ResponseController(500, "Unable to update Study Material", err));
        });
    }

    getMaterialNamesById(materialIdsArr) {
        return new Promise((resolve, reject) => {
            ((that) => {
                this.modelInstance.aggregate([
                    {
                        "$match": {
                            "_id": { $in: materialIdsArr }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: { $arrayElemAt: [ "$content", 0 ] },
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: "$name.title",
                        }
                    }
                ])
                .then(function (docs) {
                    resolve(docs);
                }).catch(err => {
                    reject(err);
                });
            })(this);
        });
    }
}