"use strict";

import formula from "./formula.model";
import {ResponseController} from "../../util/response.controller";
import {_} from "lodash";
import mongoose from "mongoose";
import loggerInstance from "../../util/apiLogger";

let {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    FormulaControllerInstance;

class FormulaController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = formula;
    }

    getFormula(req, res) {

        if (req.query.draftId){
            this.getFormulaById(req.query.draftId, res);
        } else if (req.params.id){
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
            .populate('subjects.subjectId', 'name')
            .populate('subjects.chapters.chapterId', 'name')
            .populate('subjects.chapters.concepts.conceptId', 'name')
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
            if (oldObj.constructor.name === 'model') {
                oldObj = oldObj.toObject()
            }
            let cloneObj = _.pick(oldObj, ['_id']);
            let tailoredObj = Object.assign({}, oldObj, bodyObj);
            tailoredObj = _.omit(tailoredObj, ["_id", "draftId"]);
            tailoredObj.publishId = cloneObj._id;
            tailoredObj.status = "DRAFT";

            let Formula = new this.modelInstance(tailoredObj);
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

    updateFormulaClone(oldObj, bodyObj) {
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
                this.modelInstance.findOneAndUpdate({_id: oldObj.draftId}, tailoredObj,
                    {new: true, upsert: true, setDefaultsOnInsert: true}, function(err) {
                        if(err) {
                            that.loggerInstance.error(`Formula Clone Update error ${err}`);
                            reject(err);
                        }
                        that.loggerInstance.info(`Formula Clone Update Success`);
                        resolve();
                    });
            })(this);
        });
    }

    updateFormula(req, res){
        delete req.body._id;
        let id = req.query.draftId ? req.query.draftId : req.params.id;

        if (!id){
            this.loggerInstance.debug("No ID specified");
            return res.json(new ResponseController(400, "No ID specified"));
        }

        let newFormula = req.body;
        newFormula.updatedAt = new Date();

        ((that) => {
            that.modelInstance.findOne({ _id: id})
            .populate('draftId')
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                        that.createFormulaClone(newObj, newFormula)
                        .then((cloneFormula) => {
                            newObj.draftId = cloneFormula._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Formula Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else if(newObj.status === "PUBLISHED" && newObj.draftId) {
                        that.updateFormulaClone(newObj, newFormula)
                        .then(() => {
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Formula Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        resolve(newFormula);
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

    publishFormula(formulaId, aclMetaData) {
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
                            doc.tags = doc.draftId.tags;
                            const {updatedBy} = aclMetaData;
                            doc.aclMetaData.updatedBy = updatedBy;
                            that.deleteFormula(doc.draftId, aclMetaData)
                            .then(() => {
                                doc.draftId = undefined;
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
                            const {updatedBy} = aclMetaData;
                            doc.aclMetaData.updatedBy = updatedBy;
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

    deleteFormula(formulaId, aclMetaData) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.modelInstance.findById(formulaId, function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting formula ${err}`);
                        reject(err);
                    } else {
                        doc.status = "DELETED";
                        const {updatedBy} = aclMetaData;
                        doc.aclMetaData.updatedBy = updatedBy;
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

    updateFormulaConcept(req, res) {
        const id = req.query.draftId ? req.query.draftId : req.params.id;

        this.modelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
        .populate('draftId')
        .then(newObj => {
            return new Promise(async (resolve, reject) => {
                if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                    let cloneFormula = await this.createFormulaClone(newObj, req.body);
                    newObj.draftId = cloneFormula._id;
                    resolve(newObj);
                } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                    this.updateFormulaClone(newObj, req.body)
                    .then(() => {
                        resolve(newObj);
                    })
                    .catch(err => {
                        this.loggerInstance.error(`Formula Clone Updation Error ${err}`);
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
            .then(formulaObj => {
                this.loggerInstance.info(`Success formula Concept update`);
                return res.json(new ResponseController(200, "audio updated", formulaObj));
            })
            .catch(err => {
                this.loggerInstance.error(`DB Error`);
                return res.json(new ResponseController(200, "formula updated",err));
            });
        });
    }

    validateFormula(formulaId) {
        return new Promise((resolve, reject) => {
            this.modelInstance.
            findOne({ _id: formulaId }).
            populate('draftId').
            exec((err, doc) => {
                if(err) {
                    this.loggerInstance.error(`DB error getting formula ${err}`);
                    reject(err);
                } else {
                    this.loggerInstance.info(`Validating formula`);
                    const validStatus = doc.draftId ? this.validateOnly(doc.draftId)
                        : this.validateOnly(doc);
                    console.log(" validStatus : ", validStatus);
                    resolve(validStatus);
                }
            });
        });
    }

    validateOnly(doc) {
        let status = {'content': true, 'title': true, 'conceptId': true};

        for(let i in doc) {
            this.validate(i, doc, status)
        }
        let validStatus = Object.keys(status).every((k) => status[k]);
        return {status,  validStatus};
    }

    validate(key, formula, status) {

        if (key === 'conceptId' && (!formula[key] || formula[key].length === 0)) {
            status.conceptId = false;
        }

        if (key === 'content') {
            formula[key].map((contentVal) => {
                if (!contentVal.title || contentVal.title.length === 0) {
                    status.title = false;
                }
                if (!contentVal.content || contentVal.content.length === 0) {
                    status.content = false;
                }
            });
        }
    }
}

export function getFormulaControllerInstance() {
    FormulaControllerInstance = FormulaControllerInstance || new FormulaController(loggerInstance, config);
    return FormulaControllerInstance;
}