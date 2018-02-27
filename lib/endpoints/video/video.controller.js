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
        let reqBody = req.body;
        let reqQuery = req.query;

        reqBody.content.map((con) => {
            con.data = {};
            con.data.noOfVideos = con.videos.length;
            con.data.videos = con.videos;
            Reflect.deleteProperty(con, 'videos');
        });

        let VideoObj = {};
        VideoObj.content = reqBody.content;
        VideoObj.via = reqQuery.via;
        VideoObj.status = reqBody.status;
        VideoObj.duration = reqBody.duration;

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