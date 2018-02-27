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

        reqBody.content.map((con) => {
            con.data = {};
            con.data.noOfAudios = con.audios.length;
            con.data.audios = con.audios;
            Reflect.deleteProperty(con, 'audios');
        });

        let AudioObj = {};
        AudioObj.content = reqBody.content;
        AudioObj.via = reqQuery.via;
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