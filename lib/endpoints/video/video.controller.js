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

        if(bodyObj.content)
            bodyObj.content = JSON.parse(bodyObj.content);

        return new Promise((resolve, reject) => {
            if (oldObj.constructor.name === 'model') {
                oldObj = oldObj.toObject()
            }
            let cloneObj = _.pick(oldObj, ['_id']);
            let tailoredObj = Object.assign({}, oldObj, bodyObj);
            tailoredObj = _.omit(tailoredObj, "_id");
            tailoredObj.publishId = cloneObj._id;
            tailoredObj.status = "DRAFT";

            let video = new this.videosModelInstance(tailoredObj);
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

    updateVideoClone(oldObj, bodyObj) {
        if(bodyObj.content)
            bodyObj.content = JSON.parse(bodyObj.content);
        return new Promise((resolve, reject) => {
            ((that) => {
                if (oldObj.constructor.name === 'model') {
                    oldObj = oldObj.toObject()
                }
                let cloneObj = _.pick(oldObj, ['_id']);
                let tailoredObj = Object.assign({}, oldObj, bodyObj);
                tailoredObj = _.omit(tailoredObj, ["_id", "draftId"]);
                tailoredObj.publishId = cloneObj._id;
                tailoredObj.status = "DRAFT";

                that.videosModelInstance.findOneAndUpdate({_id: oldObj.draftId}, tailoredObj,
                    {new: true, upsert: true, setDefaultsOnInsert: true}, function(err) {
                        if(err) {
                            that.loggerInstance.error(`Video Clone Update error ${err}`);
                            reject(err);
                        }
                        that.loggerInstance.info(`Video Clone Update success`);
                        resolve();
                    });
            })(this);
        });
    }

    updateNewVideo(reqBody, reqQuery, res) {
        if(reqBody.content)
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
                    if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                        that.createVideoClone(newObj, reqBody)
                        .then((cloneVideo) => {
                            newObj.draftId = cloneVideo._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Video Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                        that.updateVideoClone(newObj, reqBody)
                        .then(() => {
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Audio Clone Updation Error ${err}`);
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
        console.log("req.query : ", req.query);
        let id = req.query.draftId ? req.query.draftId : req.query.id;
        ((that) => {
            that.videosModelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                        that.createVideoClone(newObj, req.body)
                        .then((cloneVideo) => {
                            newObj.draftId = cloneVideo._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Video Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                        that.updateVideoClone(newObj, req.body)
                            .then(() => {
                                resolve(newObj);
                            })
                            .catch(err => {
                                that.loggerInstance.error(`Video Clone Updation Error ${err}`);
                                reject(err);
                            });
                    } else {
                        req.body.content = JSON.parse(req.body.content);
                        resolve(req.body);
                    }
                });
            })
            .then(function(newObj) {

                let conditions = { _id: mongoose.Types.ObjectId(id) };
                that.videosModelInstance.findOneAndUpdate(conditions,newObj,{new:true})
                .then(function(videoObj){
                    that.loggerInstance.info(`Success video in New Locale`);
                    return res.json(new ResponseController(200, "Video updated",videoObj));
                })
                .catch(function(err){
                    that.loggerInstance.info(`DB Error ${err}`);
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
        let videoId = req.query.draftId ? req.query.draftId : req.params.id;
        ((that)=>{
            that.videosModelInstance.findOne({_id:videoId})
            .populate('subjects.subjectId', 'name')
            .populate('subjects.chapters.chapterId', 'name')
            .populate('subjects.chapters.concepts.conceptId', 'name')
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
            let id = req.query.draftId ? req.query.draftId : req.params.id;
            that.videosModelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
            .then(function (newObj) {
                return new Promise((resolve, reject) => {
                    if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                        that.createVideoClone(newObj, req.body)
                        .then((cloneVideo) => {
                            newObj.draftId = cloneVideo._id;
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`Video Clone Creation Error ${err}`);
                            reject(err);
                        });
                    } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                        that.updateVideoClone(newObj, req.body)
                        .then(() => {
                            resolve(newObj);
                        })
                        .catch(err => {
                            that.loggerInstance.error(`video Clone Updation Error ${err}`);
                            reject(err);
                        });
                    } else {
                        newObj.tags = [...new Set(newObj.tags ? newObj.tags.concat(req.body.tags) :
                            req.body.tags)];
                        resolve(newObj);
                    }
                });
            })
            .then(function(newObj) {
                let conditions = { _id: mongoose.Types.ObjectId(id) };
                that.videosModelInstance.findOneAndUpdate(conditions,newObj,{new:true})
                .then(function(videoObj){
                    that.loggerInstance.info(`Success video Tag update`);
                    return res.json(new ResponseController(200, "video updated",videoObj));
                })
                .catch(function(err){
                    that.loggerInstance.error(`DB Error ${err}`);
                    return res.json(new ResponseController(200, "video updated",err));
                });
            })
        })(this);
    }

    publishVideo(videoId) {
        return new Promise((resolve, reject) => {
            ((that) => {
                that.videosModelInstance.findOne({ _id: videoId }).
                populate('draftId').
                exec(function (err, doc) {
                    if(err) {
                        that.loggerInstance.error(`DB error getting Video ${err}`);
                        reject(err);
                    } else {
                        if(doc.draftId) {
                            doc.content = doc.draftId.content;
                            doc.tags = doc.draftId.tags;
                            that.deleteVideo(doc.draftId._id)
                            .then(() => {
                                that.loggerInstance.info("Draft Video Deleted");
                                doc.draftId = undefined;
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

    updateVideoConcept(req, res) {
        const id = req.query.draftId ? req.query.draftId : req.params.id;

        this.videosModelInstance.findOne({ _id: mongoose.Types.ObjectId(id)})
        .populate('draftId')
        .then(newObj => {
            return new Promise(async (resolve, reject) => {
                if(newObj.status === "PUBLISHED" && !newObj.draftId) {
                    let cloneVideo = await this.createVideoClone(newObj, req.body);
                    newObj.draftId = cloneVideo._id;
                    resolve(newObj);
                } else if (newObj.status === "PUBLISHED" && newObj.draftId) {
                    this.updateVideoClone(newObj, req.body)
                        .then(() => {
                            resolve(newObj);
                        })
                        .catch(err => {
                            this.loggerInstance.error(`Video Clone Updation Error ${err}`);
                            reject(err);
                        });
                } else {
                    newObj.subjects = req.body.subjects;
                    resolve(newObj);
                }
            });
        })
        .then(newObj => {
            let conditions = { _id: mongoose.Types.ObjectId(id) };
            this.videosModelInstance.findOneAndUpdate(conditions, newObj, { new: true })
            .then(videoObj => {
                this.loggerInstance.info(`Success Video Concept update`);
                return res.json(new ResponseController(200, "Video updated", videoObj));
            })
            .catch(err => {
                this.loggerInstance.error(`DB Error`);
                return res.json(new ResponseController(200, "Video updated",err));
            });
        });
    }

    validateVideo(Id) {
        return new Promise((resolve, reject) => {
            this.videosModelInstance.
            findOne({ _id: Id }).
            populate('draftId').
            exec((err, doc) => {
                if(err) {
                    this.loggerInstance.error(`DB error getting video ${err}`);
                    reject(err);
                } else {
                    this.loggerInstance.info(`Validating video`);
                    const validStatus = doc.draftId ? this.validateOnly(doc.draftId)
                        : this.validateOnly(doc);
                    console.log(" validStatus : ", validStatus);
                    resolve(validStatus);
                }
            });
        });
    }

    validateOnly(doc) {
        let status = {'conceptId': true, 'title': true, 'videos': true};

        for(let i in doc) {
            this.validate(i, doc, status)
        }
        let validStatus = Object.keys(status).every((k) => status[k]);
        return {status,  validStatus};
    }

    validate(key, video, status) {

        if (key === 'conceptId' && (!video[key] || video[key].length === 0)) {
            status.conceptId = false;
        }
        if (key === 'content') {
            video[key].map((contentVal) => {
                if (!contentVal.title || contentVal.title.length === 0) {
                    status.title = false;
                }
                if (!contentVal.data.videos || contentVal.data.videos.length === 0) {
                    status.videos = false;
                }
            });
        }
    }
}