"use strict";

import express from "express";
import {getRuleControllerInstance} from "./rule.controller";

let router = express.Router(),
    getRulesRoute = router.route("/getRules/:id?"),
    createRuleRoute = router.route("/createRule"),
    updateRuleRoute = router.route("/updateRule/:id"),
    ruleInstance = getRuleControllerInstance();
    
getRulesRoute.get(ruleInstance.rulesList.bind(ruleInstance));
createRuleRoute.post(ruleInstance.createRule.bind(ruleInstance));
updateRuleRoute.patch(ruleInstance.updateRule.bind(ruleInstance));

export default router;