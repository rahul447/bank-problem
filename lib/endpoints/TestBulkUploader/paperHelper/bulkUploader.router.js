"use strict";

const express = require("express");
const loggerInstance = require("../../../util/apiLogger");
const {createPaperMain} = require("../finalScript");

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../../config/" + nodeEnv)),
    createTestRoute = router.route("/createTest");

createTestRoute.post(createPaperMain);

module.exports = router;