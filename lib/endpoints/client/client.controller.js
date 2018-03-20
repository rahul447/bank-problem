"use strict";

import client from "./client.model";
import {ResponseController} from "../../util/response.controller";
import {_} from "lodash";

export class ClientController {

    constructor(loggerInstance, config) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.modelInstance = client;
    }

    get(req, res) {
        if (req.params.id){
            this.getById(req.params.id, res);
        } else {
            this.modelInstance.find()
                .then(data => {
                    this.loggerInstance.info("Retrieved client list");
                    res.json(new ResponseController(200, "client list retrieved successfully", data));
                })
                .catch(() => {
                    this.loggerInstance.error("DB error listing client");
                    res.json(new ResponseController(500, "Error listing client"));
                });
        }
    }

    getById(id, res) {
        this.modelInstance.findById(id)
            .then(data => {
                if (!data) {
                    this.loggerInstance.debug("client not found");
                    res.json(new ResponseController(404, "Not found client with given ID"));
                }
                this.loggerInstance.info("Retrieved client list");
                res.json(new ResponseController(200, "client list retrieved successfully", data));
            })
            .catch(() => {
                this.loggerInstance.error("DB error listing client");
                res.json(new ResponseController(500, "Error listing client"));
            });
    }

    create(req, res){
        let newOrg= new this.modelInstance(req.body);
        newOrg.save().then(data => {
            this.loggerInstance.info("client created successfully");
            return res.json(new ResponseController(200, "client created successfully", data));
        }).catch(err => {
            this.loggerInstance.error("Error creating client");
            return res.json(new ResponseController(500, "Error creating client", err));
        })
    }

    update(req, res){
        delete req.body._id;
        let id = req.params.id;
        this.modelInstance.findById(id)
            .then(data => {
                if (!data) {
                    this.loggerInstance.debug("Not found client");
                    return res.json(new ResponseController(404, "Not found"));
                }
                _.merge(data, req.body);
                data.updatedAt = new Date();
                data.save()
                    .then(org => {
                        this.loggerInstance.info("Successfully updated client");
                        res.json(new ResponseController(200, "Successfully updated client", org));
                    })
                    .catch(() => {
                        this.loggerInstance.error("Error updating client");
                        res.json(new ResponseController(200, "Error updating client"));
                    });
            })
            .catch(() => {
                this.loggerInstance.error("DB Error updating client");
                res.json(new ResponseController(200, "DB Error updating client"));
            });
    }
}