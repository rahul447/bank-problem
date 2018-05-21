"use strict";

import express from "express";
import loggerInstance from "../../../util/apiLogger";
import createPaper from "../finalScript";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    createTestRoute = router.route("/createTest");

createTestRoute.post(createPaper);

export default router;