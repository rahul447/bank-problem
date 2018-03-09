"use strict";

import videos from "./video.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";

export class VideoController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.videosModelInstance = videos;
    }

    saveVideoDetails(req, res) {
        let reqBody = req.body;
        let reqQuery = req.query;

        if(reqQuery.id) {
            this.updateNewVideo(reqBody, reqQuery, res);
        } else {
            this.saveNewVideo(reqBody, reqQuery, res);
        }
    }

    saveNewVideo(reqBody, reqQuery, res) {
        reqBody.content = JSON.parse(reqBody.content);
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

        video.save((err, doc) => {
            if (err) {
                this.loggerInstance.error("Error creating newVideo");
                return res.json({status: 500, data: err});
            }
            this.loggerInstance.info("Video created successfully");
            return res.json({status: 200, data: doc._id});
        });
    }

    updateNewVideo(reqBody, reqQuery, res) {
        reqBody.content = JSON.parse(reqBody.content);
        ((that) => {
            reqBody.content.map((con) => {
                con.data = {};
                con.data.noOfVideos = con.videos.length;
                con.data.videos = con.videos;
                Reflect.deleteProperty(con, 'videos');
            });

            let conditions = { _id: mongoose.Types.ObjectId(reqQuery.id) }
                , update = { $push: { content: { $each: reqBody.content } } }
                , options = { multi: false };

            that.videosModelInstance.update(conditions, update, options, callback);

            function callback (err, numAffected) {
                if (err) {
                    that.loggerInstance.error("Error Video in New Locale");
                    return res.json({status: 500, data: err});
                }
                that.loggerInstance.info(`Success Video in New Locale ${numAffected}`);
                return res.json({status: 200, data: numAffected});
            }
        })(this);
    }

    editVideo(req, res){
        let video = new this.videosModelInstance(req.body);
        let content = JSON.parse(req.body.content);
        video.content = content;
        video._id = req.query.id;
        ((that) => {
            let conditions = { _id: mongoose.Types.ObjectId(req.query.id) };
            that.videosModelInstance.findOneAndUpdate(conditions,video,{new:true})
            .then(function(videoObj){
                that.loggerInstance.info(`Success video in New Locale`);
                return res.json(new ResponseController(200, "Video updated",videoObj));
            })
            .catch(function(err){
                that.loggerInstance.info(`DB Error`);
                return res.json(new ResponseController(200, "Video updated",err));
            });
        })(this);
    }

    getVideolNamesById(videoIdsArr) {
        return new Promise((resolve, reject) => {
            ((that) => {
                this.videosModelInstance.aggregate([
                    {
                        "$match": {
                            "_id": {$in: videoIdsArr}
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: {$arrayElemAt: ["$content", 0]},
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: "$name.title",
                        }
                    }
                ])
                    .then(function (docs) {
                        resolve(docs);
                    }).catch(err => {
                    reject(err);
                });
            })(this);
        });
    }

    getVideo(req, res){
        let videoId = req.params.id;
        ((that)=>{
            that.videosModelInstance.findOne({_id:videoId})
            .then(function(videoObj){
                if(videoObj){
                    that.loggerInstance.info("video found successfully");
                    return res.json(new ResponseController(200, "video found successfully",videoObj));
                }
                else{
                    that.loggerInstance.info("video not found");
                    return res.json(new ResponseController(500, "video not found"));
                }
            })
            .catch(function(err){
                that.loggerInstance.error("DB Error finding video");
                return res.json(new ResponseController(500, "DB Error finding video",err));
            })
        })(this)
    }
}