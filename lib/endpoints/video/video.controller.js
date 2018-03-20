"use strict";

import videos from "./video.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";
import {_} from "lodash";

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

    createVideoClone(oldObj, bodyObj) {

        console.log("bodyObj : ", bodyObj);
        bodyObj.content = JSON.parse(bodyObj.content);

        return new Promise((resolve, reject) => {
            let cloneObj = _.pick(oldObj, ['_id']);
            let newClonedObj = _.omitBy(bodyObj, function(value, key) {
                return key.startsWith("_id");
            });
            newClonedObj.publishId = cloneObj._id;
            newClonedObj.status = "DRAFT";
            let video = new this.videosModelInstance(newClonedObj);
            ((that) => {
                video.save()
                .then(function(video) {
                    that.loggerInstance.info(`Video Clone saved successfully ${video._id}`);
                    resolve(video);
                })
                .catch(function(err) {
                    that.loggerInstance.error(`Video Clone saved error ${err}`);
                    reject(err);
                })
            })(this);
        });
    }

    updateNewVideo(reqBody, reqQuery, res) {
        reqBody.content = JSON.parse(reqBody.content);
        reqBody.content.map((con) => {
            con.data = {};
            con.data.videos = con.videos;
            Reflect.deleteProperty(con, 'videos');
        });

        ((that) => {
            that.videosModelInstance.findOne({ _id: mongoose.Types.ObjectId(reqQuery.id)})
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED") {
                        that.createVideoClone(newObj, reqBody)
                        .then((cloneVideo) => {
                            newObj.draftId = cloneVideo._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Video Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        resolve(newObj);
                    }
                });
            })
            .then(function(newObj) {

                let conditions = { _id: mongoose.Types.ObjectId(reqQuery.id) }
                    , update = { $push: { content: { $each: newObj.content } } }
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
            })
        })(this);
    }

    editVideo(req, res){
        ((that) => {
            that.videosModelInstance.findOne({ _id: mongoose.Types.ObjectId(req.query.id)})
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED") {
                        that.createVideoClone(newObj, req.body)
                        .then((cloneVideo) => {
                            newObj.draftId = cloneVideo._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Video Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        resolve(newObj);
                    }
                });
            })
            .then(function(newObj) {

                let conditions = { _id: mongoose.Types.ObjectId(req.query.id) };
                that.videosModelInstance.findOneAndUpdate(conditions,newObj,{new:true})
                .then(function(videoObj){
                    that.loggerInstance.info(`Success video in New Locale`);
                    return res.json(new ResponseController(200, "Video updated",videoObj));
                })
                .catch(function(err){
                    that.loggerInstance.info(`DB Error`);
                    return res.json(new ResponseController(200, "Video updated",err));
                });
            })
        })(this);
    }

    getVideolNamesById(videoIdsArr) {
        return new Promise((resolve, reject) => {

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
                        via: 1
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: "$name.title",
                        via: 1
                    }
                }
            ])
            .then(function (docs) {
                    resolve(docs);
            }).catch(err => {
                reject(err);
            });

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

    updateVideoTags(req, res) {
        ((that) => {
            that.videosModelInstance.findOne({ _id: mongoose.Types.ObjectId(req.params.id) }, function (err, doc) {
                doc.tags = req.body.tags;
                doc.save(function(err) {
                    if(err) {
                        that.loggerInstance.error(`updateVideoTags fail ${err}`);
                        return res.json(new ResponseController(200, `updateVideoTags fail`, err));
                    }
                    else{
                        that.loggerInstance.info("updateVideoTags success");
                        return res.json(new ResponseController(500, "updateVideoTags success"));
                    }
                });
            });
        })(this);
    }

    publishVideo(videoId) {
        console.log("videoId : ", videoId);
        return new Promise((resolve, reject) => {
            ((that) => {
                that.videosModelInstance.findOne({ _id: videoId }).
                populate('draftId').
                exec(function (err, doc) {
                    console.log("doc : ", doc);
                    if(err) {
                        that.loggerInstance.error(`DB error getting Video ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            doc.content = doc.draftId.content;
                            that.deleteVideo(doc.draftId._id)
                            .then(() => {
                                that.loggerInstance.info("Draft Video Deleted");
                                doc.save(function (err) {
                                    if(err) {
                                        that.loggerInstance.error(`Video Save Failed ${err}`);
                                        reject(err);
                                    }
                                    resolve();
                                });
                            });
                        } else {
                            doc.status = "PUBLISHED";
                            doc.save(function (err) {
                                if(err) {
                                    that.loggerInstance.error(`Video Save Failed ${err}`);
                                    reject(err);
                                }
                                resolve();
                            });
                        }
                    }
                });
            })(this);
        });
    }

    deleteVideo(videoId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.videosModelInstance.findById(videoId, function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting video ${err}`);
                        reject(err);
                    } else {
                        doc.status = "DELETED";
                        doc.save(function (err) {
                            if(err) {
                                that.loggerInstance.error(`video Soft Delete Failed ${err}`);
                                reject(err);
                            }
                            resolve();
                        });
                    }
                });
            })(this);
        });
    }
}