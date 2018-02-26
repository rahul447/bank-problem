"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {CourseTagController} from "./courseTag.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    tagInstance = new CourseTagController({
        loggerInstance: loggerInstance,
        config: config
    });

router.route('/:id?').get(tagInstance.get.bind(tagInstance));
router.route('/').post(tagInstance.create.bind(tagInstance));
router.route('/:id').patch(tagInstance.patch.bind(tagInstance));
router.route('/:id').delete(tagInstance.delete.bind(tagInstance));

export default router;