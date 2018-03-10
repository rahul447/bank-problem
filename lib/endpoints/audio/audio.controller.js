"use strict";

import audios from "./audio.model";
import {ResponseController} from "../../util/response.controller";
import mongoose from "mongoose";

export class AudioController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.audiosModelInstance = audios;
    }

    saveAudioDetails(req, res) {
        let reqBody = req.body;
        let reqQuery = req.query;

        if(reqQuery.id) {
            this.updateNewAudio(reqBody, reqQuery, res);
        } else {
            this.saveNewAudio(reqBody, reqQuery, res);
        }
    }

    saveNewAudio(reqBody, reqQuery, res) {
        reqBody.content = JSON.parse(reqBody.content);
        reqBody.content.map((con) => {
            con.data = {};
            con.data.audios = con.audios;
            Reflect.deleteProperty(con, 'audios');
        });

        let AudioObj = {};
        AudioObj.content = reqBody.content;
        AudioObj.via = reqQuery.via;
        AudioObj.status = reqBody.status;

        let audio = new this.audiosModelInstance(AudioObj);

        audio.save((err, doc) => {
            if (err) {
                this.loggerInstance.error("Error creating newAudio");
                return res.json({status: 500, data: err});
            }
            this.loggerInstance.info("Audio created successfully");
            return res.json({status: 200, data: doc._id});
        });
    }

    updateNewAudio(reqBody, reqQuery, res) {
        reqBody.content = JSON.parse(reqBody.content);
        ((that) => {
            reqBody.content.map((con) => {
                con.data = {};
                con.data.audios = con.audios;
                Reflect.deleteProperty(con, 'audios');
            });

            let conditions = { _id: mongoose.Types.ObjectId(reqQuery.id) }
                , update = { $push: { content: { $each: reqBody.content } } }
                , options = { multi: false };

            that.audiosModelInstance.update(conditions, update, options, callback);

            function callback (err, numAffected) {
                if (err) {
                    that.loggerInstance.error("Error Audio in New Locale");
                    return res.json({status: 500, data: err});
                }
                that.loggerInstance.info(`Success audio in New Locale ${numAffected}`);
                return res.json({status: 200, data: numAffected});
            }
        })(this);
    }

    editAudio(req, res){
        let audio = new this.audiosModelInstance(req.body);
        let content = JSON.parse(req.body.content);
        audio.content = content;
        audio._id = req.query.id;
        ((that) => {
            let conditions = { _id: mongoose.Types.ObjectId(req.query.id) };
            that.audiosModelInstance.findOneAndUpdate(conditions, audio,{new:true})
            .then(function(audioObj){
                that.loggerInstance.info(`Success audio in New Locale`);
                return res.json(new ResponseController(200, "Audio updated",audioObj));
            })
            .catch(function(err){
                that.loggerInstance.info(`DB Error`);
                return res.json(new ResponseController(500, "Error in Audio updation",err));
            });
        })(this);
    }

    getAudioNamesById(audioIdsArr) {
        return new Promise((resolve, reject) => {
            ((that) => {
                this.audiosModelInstance.aggregate([
                    {
                        "$match": {
                            "_id": {$in: audioIdsArr}
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
                        console.log("docs : ", docs);
                        resolve(docs);
                    }).catch(err => {
                    reject(err);
                });
            })(this);
        });
    }

    getAudio(req, res){
        let audioId = req.params.id;
        ((that)=>{
            that.audiosModelInstance.findOne({_id:audioId})
            .then(function(audioObj){
                if(audioObj){
                    that.loggerInstance.info("Audio found successfully");
                    return res.json(new ResponseController(200, "Audio found successfully",audioObj));
                }
                else{
                    that.loggerInstance.info("Audio not found");
                    return res.json(new ResponseController(500, "Audio not found"));
                }
            })
            .catch(function(err){
                that.loggerInstance.error("DB Error finding audio");
                return res.json(new ResponseController(500, "DB Error finding audio",err));
            })
        })(this)
    }

    updateAudioTags(req, res) {
        ((that) => {
            that.audiosModelInstance.findOne({ _id: req.params.id }, function (err, doc) {
                doc.tags = req.body.tags;
                doc.save(function(err) {
                    if(err) {
                        that.loggerInstance.error(`updateAudioTags fail ${err}`);
                        return res.json(new ResponseController(200, "updateAudioTags fail ", err));
                    }
                    else{
                        that.loggerInstance.info("updateAudioTags success");
                        return res.json(new ResponseController(500, "updateAudioTags success"));
                    }
                });
            });
        })(this);
    }
}