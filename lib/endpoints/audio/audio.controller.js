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
        let reqQuery = req.query;

        let params = {
            "content": {
                "locale": {
                    id: Object.values(JSON.parse(reqBody.locale))[0],
                    name: Object.keys(JSON.parse(reqBody.locale))[0],
                },
                title: reqBody.title,
                description: reqBody.description,
            }
        };
        let AudioObj = {};
        let contentArr = [];
        contentArr.push(params.content);
        AudioObj.content = contentArr;
        AudioObj.via = reqQuery.via;
        AudioObj.fileS3Location = reqBody.fileS3Location;
        AudioObj.status = reqBody.status;
        AudioObj.duration = reqBody.duration;
        let audio = new this.audiosModelInstance(AudioObj);
        audio.save((err) => {
            if (err)  {
                this.loggerInstance.error("Error creating newAudio");
                return res.json(new ResponseController(500, "Error creating newAudio", err));
            }
            this.loggerInstance.info("Audio created successfully");
            return res.json(new ResponseController(200, "Audio created successfully"));
        });
    }
}