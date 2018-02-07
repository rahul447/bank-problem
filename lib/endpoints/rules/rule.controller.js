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
        this.ruleModelInstance.find()
            .then(rules => {
                this.loggerInstance.info("Retrieved rules list");
                res.json(new ResponseController(200, "Rules list retrieved successfully", rules));
            })
            .catch(err => {
                this.loggerInstance.debug("DB error listing rules");
                res.json(new ResponseController(500, "Error listing rules"));
            });
    }
}