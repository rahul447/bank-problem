"use strict";

import express from "express";
import {getFormulaControllerInstance} from "./formula.controller";

let router = express.Router(),
    getFormulaRoute = router.route("/getFormula/:id?"),
    createFormulaRoute = router.route("/createFormula"),
    updateFormulaRoute = router.route("/updateFormula/:id"),
    updateFormulaConceptRoute = router.route("/updateFormulaConcept/:id"),
    formulaInstance = getFormulaControllerInstance();

getFormulaRoute.get(formulaInstance.getFormula.bind(formulaInstance));
createFormulaRoute.post(formulaInstance.createFormula.bind(formulaInstance));
updateFormulaRoute.patch(formulaInstance.updateFormula.bind(formulaInstance));
updateFormulaConceptRoute.post(formulaInstance.updateFormulaConcept.bind(formulaInstance));
export default router;