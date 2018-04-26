"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {FormulaController} from "./formula.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    getFormulaRoute = router.route("/getFormula/:id?"),
    createFormulaRoute = router.route("/createFormula"),
    updateFormulaRoute = router.route("/updateFormula/:id"),
    updateFormulaConceptRoute = router.route("/updateFormulaConcept/:id"),
    formulaInstance = new FormulaController(loggerInstance, config);

getFormulaRoute.get(formulaInstance.getFormula.bind(formulaInstance));
createFormulaRoute.post(formulaInstance.createFormula.bind(formulaInstance));
updateFormulaRoute.patch(formulaInstance.updateFormula.bind(formulaInstance));
updateFormulaConceptRoute.post(formulaInstance.updateFormulaConcept.bind(formulaInstance));
export default router;