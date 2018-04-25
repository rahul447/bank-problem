"use strict";

import studyMaterial from "./studyMaterial.model";
import {ResponseController} from "../../util/response.controller";
import {_} from "lodash";
import mongoose from "mongoose";

export class StudyMaterialController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = studyMaterial;
    }

    getStudyMaterial(req, res) {
        if (req.query.draftId){
            this.getStudyMaterialById(req.query.draftId, res);
        } else if (req.params.id){
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
            .populate('subjects.subjectId', 'name')
            .populate('subjects.chapters.chapterId', 'name')
            .populate('subjects.chapters.concepts.conceptId', 'name')
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

    createMaterialClone(oldObj, bodyObj) {
        return new Promise((resolve, reject) => {
            if (oldObj.constructor.name === 'model') {
                oldObj = oldObj.toObject()
            }
            let cloneObj = _.pick(oldObj, ['_id']);
            let tailoredObj = Object.assign({}, oldObj, bodyObj);
            tailoredObj = _.omit(tailoredObj, "_id");
            tailoredObj.publishId = cloneObj._id;
            tailoredObj.status = "DRAFT";
            let material = new this.modelInstance(tailoredObj);
            ((that) => {
                material.save()
                .then(function(material) {
                    that.loggerInstance.info(`Material Clone saved successfully ${material._id}`);
                    resolve(material);
                })
                .catch(function(err) {
                    that.loggerInstance.error(`Material Clone saved error ${err}`);
                    reject(err);
                })
            })(this);
        });
    }

    updateMaterialClone(oldObj, bodyObj) {
        return new Promise((resolve, reject) => {
            ((that) => {
                if (oldObj.constructor.name === 'model') {
                    oldObj = oldObj.toObject()
                }
                let cloneObj = _.pick(oldObj, ['_id']);
                let tailoredObj = Object.assign({}, oldObj.draftId, bodyObj);
                tailoredObj = _.omit(tailoredObj, ["_id", "draftId"]);
                tailoredObj.publishId = cloneObj._id;
                tailoredObj.status = "DRAFT";

                that.modelInstance.findOneAndUpdate({_id: oldObj.draftId}, tailoredObj,
                    {new: true, upsert: true, setDefaultsOnInsert: true}, function(err) {
                        if(err) {
                            that.loggerInstance.error(`Material Clone Update error ${err}`);
                            reject(err);
                        }
                        that.loggerInstance.info(`Material Clone Update success`);
                        resolve();
                    });
            })(this);
        });
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

        ((that) => {
            that.modelInstance.findOne({ _id: id})
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                        that.createMaterialClone(newObj, newMaterial)
                        .then((cloneMat) => {
                            newObj.draftId = cloneMat._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Material Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                        that.updateMaterialClone(newObj, newMaterial)
                        .then(() => {
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Audio Clone Updation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        resolve(newMaterial);
                    }
                });
            })
            .then(function(newObj) {
                that.modelInstance.findOneAndUpdate({ _id: id }, newObj, { new: true })
                .then(function (newObj) {
                    that.loggerInstance.info("Matertial updated successfully");
                    return res.json(new ResponseController(200, "Matertial updated successfully", newObj));
                })
                .catch(function (err) {
                    that.loggerInstance.error(`DB Error saving Matertial ${err}`);
                    return res.json(new ResponseController(500, "Error updating Matertial"));
                })
            })
        })(this);
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

    publishMaterial(materialId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.modelInstance.findOne({ _id: materialId }).
                populate('draftId').
                exec(function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting material ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            doc.content = doc.draftId.content;
                            doc.tags = doc.draftId.tags;
                            that.deleteMaterial(doc.draftId._id)
                            .then(() => {
                                doc.draftId = undefined;
                                that.loggerInstance.info("Draft Material Deleted");
                                doc.save(function (err) {
                                    if(err) {
                                        that.loggerInstance.error(`Material Save Failed ${err}`);
                                        reject(err);
                                    }
                                    resolve();
                                });
                            })
                        } else {
                            doc.status = "PUBLISHED";
                            doc.save(function (err) {
                                if(err) {
                                    that.loggerInstance.error(`Material Save Failed ${err}`);
                                    reject(err);
                                }
                                resolve();
                            });
                        }
                    }
                });
            })(this);
        });
    }

    deleteMaterial(materialId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.modelInstance.findById(materialId, function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting material ${err}`);
                        reject(err);
                    } else {
                        doc.status = "DELETED";
                        doc.save(function (err) {
                            if(err) {
                                that.loggerInstance.error(`Material Soft Delete Failed ${err}`);
                                reject(err);
                            }
                            resolve();
                        });
                    }
                });
            })(this);
        });
    }

    updateMaterialConcept(req, res) {
        const id = req.query.draftId ? req.query.draftId : req.params.id;

        this.modelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
        .populate('draftId')
        .then(newObj => {
            return new Promise(async (resolve, reject) => {
                if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                    let cloneMaterial = await this.createMaterialClone(newObj, req.body);
                    newObj.draftId = cloneMaterial._id;
                    resolve(newObj);
                } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                    this.updateMaterialClone(newObj, req.body)
                    .then(() => {
                        resolve(newObj);
                    })
                    .catch(err => {
                        this.loggerInstance.error(`Material Clone Updation Error ${err}`);
                        reject(err);
                    });
                } else {
                    newObj.subjects = req.body.subjects;
                    resolve(newObj);
                }
            });
        })
        .then(newObj => {
            let conditions = { _id: mongoose.Types.ObjectId(id) };
            this.modelInstance.findOneAndUpdate(conditions, newObj, { new: true })
            .then(materialObj => {
                this.loggerInstance.info(`Success Material Concept update`);
                return res.json(new ResponseController(200, "Material updated", materialObj));
            })
            .catch(err => {
                this.loggerInstance.error(`DB Error`);
                return res.json(new ResponseController(200, "Material updated",err));
            });
        });
    }
}