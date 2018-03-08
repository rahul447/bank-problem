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
            con.data.noOfAudios = con.audios.length;
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
                con.data.noOfAudios = con.audios.length;
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

    getAudioNamesById(audioIdsArr) {
        return new Promise((resolve, reject) => {
            ((that) => {
                this.audiosModelInstance.aggregate([
                    {
                        "$match": {
                            "_id": { $in: audioIdsArr }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            name: { $arrayElemAt: [ "$content", 0 ] },
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
}