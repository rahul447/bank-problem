"use strict";

import express from "express";
import loggerInstance from "../../util/apiLogger";
import {FileController} from "./file.controller";

let router = express.Router(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    fileInstance = new FileController(loggerInstance, config);

export default router;