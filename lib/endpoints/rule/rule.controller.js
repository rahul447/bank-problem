"use strict";

import rules from "./rule.model";
import {ResponseController} from "../../util/response.controller";

export class RuleController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.ruleModelInstance = rules;
    }

    rulesList(req, res) {
        if (req.params.id){
            this.getRuleById.call(this, req.params.id, res);
        } else {
            this.ruleModelInstance.find()
                .then(rules => {
                    this.loggerInstance.info("Retrieved rule list");
                    return res.json(new ResponseController(200, "Rules list retrieved successfully", rules));
                })
                .catch(err => {
                    this.loggerInstance.debug("DB error listing rule");
                    return res.json(new ResponseController(500, "Error listing rule"));
                });
        }
    }

    getRuleById(id, res) {
        this.ruleModelInstance.findById(id)
            .then(rule => {
                if(!rule){
                    this.loggerInstance.debug("Rule not found with given ID");
                    return res.json(new ResponseController(404, "Rule not found with given ID"));
                }
                this.loggerInstance.info("Retrieved rule list");
                return res.json(new ResponseController(200, "Rules list retrieved successfully", rule));
            })
            .catch(err => {
                this.loggerInstance.debug("DB error listing rule");
                return res.json(new ResponseController(500, "Error listing rule"));
            });
    }

    createRule(req, res){
        let newRule = new this.ruleModelInstance(req.body);
        newRule.save().then(rule => {
            this.loggerInstance.info("Rule created successfully");
            return res.json(new ResponseController(200, "Rule created successfully", rule));
        }).catch(err => {
            this.loggerInstance.error("Error creating rule");
            return res.json(new ResponseController(500, "Error creating rule", err));
        })
    }
    ruleCreate(req,res){
        let rule = new this.ruleModelInstance(req.body);
        ((that)=>{
            rule.save()
            .then(function(rule){
                that.loggerInstance.info("Rule created successfully");
                return res.json(new ResponseController(200, "Rule created successfully", rule));
            })
            .catch(function(err){
                that.loggerInstance.info("DB Error while creating rule");
                return res.json(new ResponseController(200, "Error creating rule", err));
            })
        })(this)
    }
    updateRule(req, res){
        delete req.body._id;
        let ruleId = req.params.id;
        if (!ruleId){
            this.loggerInstance.debug("No ruleId specified");
            return res.json(new ResponseController(400, "No ruleId specified"));
        }
        let newRule = req.body;
        newRule.updatedAt = new Date();
        this.ruleModelInstance.findOneAndUpdate({
            _id: ruleId
        }, newRule, {
            new: true
        }).then(response => {
            if (!response) {
                this.loggerInstance.debug("Rule not found");
                return res.json(new ResponseController(404, "Not found rule with given ID"));
            }
            this.loggerInstance.info("Rule updated successfully");
            return res.json(new ResponseController(200, "Rule Updated", response));
        }).catch(err => {
            this.loggerInstance.error("DB error updating rule");
            return res.json(new ResponseController(500, "Unable to update rule", err));
        });
    }
}