"use strict";

import formula from "./formula.model";
import {ResponseController} from "../../util/response.controller";

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
    updateFormula(req, res){
        delete req.body._id;
        let id = req.params.id;
        if (!id){
            this.loggerInstance.debug("No ID specified");
            return res.json(new ResponseController(400, "No ID specified"));
        }
        let newFormula= req.body;
        newFormula.updatedAt = new Date();
        this.modelInstance.findOneAndUpdate({
            _id: id
        }, newFormula, {
            new: true
        }).then(response => {
            if (!response) {
                this.loggerInstance.debug("Formula not found");
                res.json(new ResponseController(404, "Not found formula with given ID"));
            }
            this.loggerInstance.info("Formula updated successfully");
            res.json(new ResponseController(200, "Formula Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating formula");
            res.json(new ResponseController(500, "Unable to update formula", err));
        });
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
}