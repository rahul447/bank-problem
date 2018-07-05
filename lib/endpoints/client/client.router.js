"use strict";

import express from "express";
import { getClientControllerInstance } from "./client.controller";

let router = express.Router(),
    controllerInstance = getClientControllerInstance();

router.route("/:id?").get(controllerInstance.get.bind(controllerInstance));
router.route("/").post(controllerInstance.create.bind(controllerInstance));
router.route("/:id").patch(controllerInstance.update.bind(controllerInstance));

export default router;