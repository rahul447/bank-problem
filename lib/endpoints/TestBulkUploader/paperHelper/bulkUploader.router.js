"use strict";

const express = require("express");
const loggerInstance = require("../../../util/apiLogger");
const {createPaper} = require("../finalScript");

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../../config/" + nodeEnv)),
    createTestRoute = router.route("/createTest");

createTestRoute.post(createPaper);

module.exports = router;