"use strict";

import formula from "./formula.model";
import {ResponseController} from "../../util/response.controller";
import {_} from "lodash";

export class FormulaController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = formula;
    }

    getFormula(req, res) {
        if (req.params.id){
            this.getFormulaById(req.params.id, res);
        } else {
            this.modelInstance.find()
                .then(formulae => {
                    this.loggerInstance.info("Retrieved Formula list");
                    res.json(new ResponseController(200, "Formula list retrieved successfully", formulae));
                })
                .catch(() => {
                    this.loggerInstance.debug("DB error listing Formula");
                    res.json(new ResponseController(500, "Error listing Formula"));
                });
        }
    }
    getFormulaById(id, res) {
        this.modelInstance.findById(id)
            .then(formula => {
                if (!formula) {
                    this.loggerInstance.debug("Formula not found");
                    res.json(new ResponseController(404, "Not found formula with given ID"));
                }
                this.loggerInstance.info("Retrieved formula list");
                res.json(new ResponseController(200, "Formula list retrieved successfully", formula));
            })
            .catch(() => {
                this.loggerInstance.debug("DB error getting formula");
                res.json(new ResponseController(500, "Error getting formula"));
            });
    }
    createFormula(req, res){
        let newFormula= new this.modelInstance(req.body);
        newFormula.save().then(formula => {
            this.loggerInstance.info("Formula created successfully");
            return res.json(new ResponseController(200, "Formula created successfully", formula));
        }).catch(err => {
            this.loggerInstance.error("Error creating Formula");
            return res.json(new ResponseController(500, "Error creating formula", err));
        })
    }

    createFormulaClone(oldObj, bodyObj) {
        return new Promise((resolve, reject) => {
            let cloneObj = _.pick(oldObj, ['_id']);
            let newClonedObj = _.omitBy(bodyObj, function(value, key) {
                return key.startsWith("_id");
            });
            newClonedObj.publishId = cloneObj._id;
            newClonedObj.status = "DRAFT";
            let Formula = new this.modelInstance(newClonedObj);
            ((that) => {
                Formula.save()
                .then(function(Formula) {
                    that.loggerInstance.info(`Formula Clone saved successfully ${Formula._id}`);
                    resolve(Formula);
                })
                .catch(function(err) {
                    that.loggerInstance.error(`Formula Clone saved error ${err}`);
                    reject(err);
                })
            })(this);
        });
    }

    updateFormula(req, res){
        delete req.body._id;
        let id = req.params.id;
        if (!id){
            this.loggerInstance.debug("No ID specified");
            return res.json(new ResponseController(400, "No ID specified"));
        }

        let newFormula = req.body;
        newFormula.updatedAt = new Date();

        ((that) => {
            that.modelInstance.findOne({ _id: id})
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED") {
                        that.createFormulaClone(newObj, newFormula)
                        .then((cloneFormula) => {
                            newObj.draftId = cloneFormula._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Formula Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        resolve(newObj);
                    }
                });
            })
            .then(function(newObj) {
                that.modelInstance.findOneAndUpdate({ _id: id }, newObj, { new: true })
                .then(function (newObj) {
                    that.loggerInstance.info("Formula updated successfully");
                    return res.json(new ResponseController(200, "Formula updated successfully", newObj));
                })
                .catch(function (err) {
                    that.loggerInstance.error(`DB Error saving Formula ${err}`);
                    return res.json(new ResponseController(500, "Error updating Formula"));
                })
            })
        })(this);
    }


    getFormulaNamesById(formulaIdsArr) {
        return new Promise((resolve, reject) => {
            ((that) => {
                this.modelInstance.aggregate([
                    {
                        "$match": {
                            "_id": { $in: formulaIdsArr }
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

    publishFormula(formulaId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.modelInstance.findOne({ _id: formulaId }).
                populate('draftId').
                exec(function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting formula ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            doc.content = doc.draftId.content;
                            that.deleteFormula(doc.draftId._id)
                            .then(() => {
                                that.loggerInstance.info("Draft formula Deleted");
                                doc.save(function (err) {
                                    if(err) {
                                        that.loggerInstance.error(`formula Save Failed ${err}`);
                                        reject(err);
                                    }
                                    resolve();
                                });
                            });
                        } else {
                            doc.status = "PUBLISHED";
                            doc.save(function (err) {
                                if(err) {
                                    that.loggerInstance.error(`formula Save Failed ${err}`);
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

    deleteFormula(formulaId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.modelInstance.findById(formulaId, function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting formula ${err}`);
                        reject(err);
                    } else {
                        doc.status = "DELETED";
                        doc.save(function (err) {
                            if(err) {
                                that.loggerInstance.error(`formula Soft Delete Failed ${err}`);
                                reject(err);
                            }
                            resolve();
                        });
                    }
                });
            })(this);
        });
    }
}