"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { CourseTypeController } from "./courseType.controller";

let router = express.Router(),
    { NODE_ENV } = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    controllerInstance = new CourseTypeController({
        loggerInstance: loggerInstance,
        config: config
    });

router.route('/:id?').get(controllerInstance.get.bind(controllerInstance));
router.route('/').post(controllerInstance.create.bind(controllerInstance));
router.route('/:id').patch(controllerInstance.patch.bind(controllerInstance));
router.route('/:id').delete(controllerInstance.delete.bind(controllerInstance));

export default router;