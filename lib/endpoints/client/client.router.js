"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { ClientController } from "./client.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    controllerInstance = new ClientController(loggerInstance, config);

router.route("/:id?").get(controllerInstance.get.bind(controllerInstance));
router.route("/").post(controllerInstance.create.bind(controllerInstance));
router.route("/:id").patch(controllerInstance.update.bind(controllerInstance));

export default router;