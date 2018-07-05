"use strict";

import express from "express";
import { getSubCategoryControllerInstance } from "./subCategory.controller";

let router = express.Router(),
    controllerInstance = getSubCategoryControllerInstance();

router.route('/:id?').get(controllerInstance.get.bind(controllerInstance));
router.route('/').post(controllerInstance.create.bind(controllerInstance));
router.route('/:id').patch(controllerInstance.patch.bind(controllerInstance));
router.route('/:id').delete(controllerInstance.delete.bind(controllerInstance));

export default router;