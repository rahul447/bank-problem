"use strict";

import files from "./files.model";
// import {ResponseController} from "../../util/response.controller";

export class AudioController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.audiosModelInstance = files;
    }
}