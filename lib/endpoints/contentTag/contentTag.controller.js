"use strict";

import contentTag from "./contentTag.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";

export class ContentTagController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.contentTagModelInstance = contentTag;
    }
}