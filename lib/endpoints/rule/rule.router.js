"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {RuleController} from "./rule.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    ruleCreateRoute = router.route('/ruleCreate'),
    getRulesRoute = router.route("/getRules/:id?"),
    createRuleRoute = router.route("/createRule"),
    updateRuleRoute = router.route("/updateRule/:id"),
    ruleInstance = new RuleController(loggerInstance, config);
    
getRulesRoute.get(ruleInstance.rulesList.bind(ruleInstance));
createRuleRoute.post(ruleInstance.createRule.bind(ruleInstance));
updateRuleRoute.patch(ruleInstance.updateRule.bind(ruleInstance));

export default router;