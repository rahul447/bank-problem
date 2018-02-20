"use strict";

import audios from "./audio.model";
import {ResponseController} from "../../util/response.controller";

export class AudioController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.audiosModelInstance = audios;
    }

    saveAudioDetails(req, res) {
        let reqBody = req.body;

        let AudioObj = {};
        let contentArr = [];
        contentArr.push(reqBody.content);
        AudioObj.content = contentArr;
        AudioObj.via = reqBody.via;
        AudioObj.location = reqBody.location;
        AudioObj.status = reqBody.status;
        AudioObj.duration = reqBody.duration;

        let audio = new this.audiosModelInstance(AudioObj);
        audio.save((err) => {
            if (err)  {
                this.loggerInstance.error("Error creating newAudio");
                return res.json(new ResponseController(500, "Error creating newAudio", err));
            }
            this.loggerInstance.info("newAudio created successfully");
            return res.json(new ResponseController(200, "newAudio created successfully"));
        });
    }
}