"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {TestTypeController} from "./testType.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    testTypeInstance = new TestTypeController({
        loggerInstance: loggerInstance,
        config: config
    });

router.route('/:id?').get(testTypeInstance.get.bind(testTypeInstance));
router.route('/').post(testTypeInstance.create.bind(testTypeInstance));
router.route('/:id').patch(testTypeInstance.patch.bind(testTypeInstance));
router.route('/:id').delete(testTypeInstance.delete.bind(testTypeInstance));

export default router;