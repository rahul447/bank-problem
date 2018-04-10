"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import { OrgCenterController } from "./orgCenter.controller";
import {ClientController} from "../client/client.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    clientInstance = new ClientController(loggerInstance, config),
    orgCenterInstance = new OrgCenterController(loggerInstance, config, clientInstance);

router.route("/:id?").get(orgCenterInstance.get.bind(orgCenterInstance));
router.route("/").post(orgCenterInstance.create.bind(orgCenterInstance));
router.route("/:id").patch(orgCenterInstance.update.bind(orgCenterInstance));

export default router;