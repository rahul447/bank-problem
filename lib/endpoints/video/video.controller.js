"use strict";

import videos from "./video.model";
import {ResponseController} from "../../util/response.controller";

export class VideoController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.videosModelInstance = videos;
    }

    saveVideoDetails(req, res) {
        let reqBody = JSON.parse(req.body);
        let reqQuery = JSON.parse(req.query);

        console.log("reqBody : ", reqBody);
        console.log("reqQuery : ", reqQuery);

        let params = {
            "content": {
                "locale": {
                    id: Object.values(reqBody.locale)[0],
                    name: Object.keys(reqBody.locale)[0],
                },
                title: reqBody.title,
                description: reqBody.description,
            }
        };

        let VideoObj = {};
        let contentArr = [];
        contentArr.push(params.content);
        VideoObj.content = contentArr;
        VideoObj.via = reqQuery.via;
        VideoObj.fileS3Location = reqBody.fileS3Location;
        VideoObj.thumNailS3Location = reqBody.thumNailS3Location;
        VideoObj.status = reqBody.status;
        VideoObj.duration = reqBody.duration;
        VideoObj.clientId = reqQuery.clientId;

        let video = new this.videosModelInstance(VideoObj);
        video.save((err) => {
            if (err)  {
                this.loggerInstance.error("Error creating newVideo");
                return res.json(new ResponseController(500, "Error creating newVideo", err));
            }
            this.loggerInstance.info("Video created successfully");
            return res.json(new ResponseController(200, "Video created successfully"));
        });
    }
}