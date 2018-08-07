"use strict";

import express from "express";
import {getContentTagControllerInstance} from "./contentTag.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    tagInstance = getContentTagControllerInstance();

router.route('/getTagTypes').get(tagInstance.getTagTypes.bind(tagInstance));
router.route('/getTagDetailsByType/:type').get(tagInstance.getTagDetailsByType.bind(tagInstance));
router.route('/:id?').get(tagInstance.get.bind(tagInstance));
router.route('/').post(tagInstance.create.bind(tagInstance));
router.route('/:id').patch(tagInstance.patch.bind(tagInstance));
router.route('/:id').delete(tagInstance.delete.bind(tagInstance));

export default router;