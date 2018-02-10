"use strict";

import rules from "./rules.model";
import {ResponseController} from "../../util/response.controller";

export class RuleController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.ruleModelInstance = rules;
    }

    rulesList(req, res) {
        ((that)=>{
            this.ruleModelInstance.find({})
            .then(function(rules){
                that.loggerInstance.info("Retrieved rules list");
                res.json(new ResponseController(200, "Rules list retrieved successfully", rules));
            })
            .catch(function(err){
                that.loggerInstance.debug("DB error listing rules");
                res.json(new ResponseController(500, "Error listing rules"));
            });
        })(this)
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
                that.loggerInstance.info("DB Error while creating rule successfully");
                return res.json(new ResponseController(200, "Error creating rule", err));
            })
        })(this)
    }
}