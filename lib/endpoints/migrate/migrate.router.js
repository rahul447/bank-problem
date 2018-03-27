"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {MigrateController} from "./migrate.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    changesRoute = router.route("/changes/:id"),

    migrateInstance = new MigrateController(loggerInstance, config);

changesRoute.get(migrateInstance.changes.bind(migrateInstance));
export default router;