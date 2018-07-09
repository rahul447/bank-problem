"use strict";

import express from "express";
import { getCategoryControllerInstance } from "./category.controller";

let router = express.Router(),
    controllerInstance = getCategoryControllerInstance();

router.route('/:id?').get(controllerInstance.get.bind(controllerInstance));
router.route('/').post(controllerInstance.create.bind(controllerInstance));
router.route('/:id').patch(controllerInstance.patch.bind(controllerInstance));
router.route('/:id').delete(controllerInstance.delete.bind(controllerInstance));

export default router;