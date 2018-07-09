"use strict";

import orgCenter from "./orgCenter.model";
import mongoose from "mongoose";
import loggerInstance from "../../util/apiLogger";
import {getClientControllerInstance} from "../client/client.controller";

let {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv)),
    OrgCenterControllerInstance;

class OrgCenterController {

    constructor(loggerInstance, config, clientControllerInstance) {
        this.loggerInstance = loggerInstance;
        this.config = config;
        this.orgCenterModel = orgCenter;
        this.clientControllerInstance = clientControllerInstance;
    }

    async get(req, res) {
        if (req.params.id){
            return this.getById(req.params.id, res);
        } else {
            try{
                const data = await this.orgCenterModel.find();
                const SuccessMessage = `Retrieved OrgCenter List Success`;
                this.loggerInstance.info(SuccessMessage);
                return res.json({data, message: SuccessMessage, statusCode: 200});
            } catch(err) {
                const errorMessage = `DB error fetching orgCenter list`;
                this.loggerInstance.error(`${errorMessage} ${err}`);
                return res.json({data: err, message: errorMessage, statusCode: 500});
            }
        }
    }

    async getById(id, res) {
        try{
            const data = await this.orgCenterModel.findById(id);
            const SuccessMessage = `Retrieved OrgCenter Success`;
            this.loggerInstance.info(SuccessMessage);
            return res.json({data, message: SuccessMessage, statusCode: 200});
        } catch(err) {
            const errorMessage = `DB error fetching orgCenter`;
            this.loggerInstance.error(`${errorMessage} ${err}`);
            return res.json({data: err, message: errorMessage, statusCode: 500});
        }
    }

    create(req, res) {
        req.body.clientId = mongoose.Types.ObjectId(req.body.clientId);
        let newOrgCenter = new this.orgCenterModel(req.body);
        newOrgCenter.save().then(async data => {
            console.log("data : ", data);
            this.loggerInstance.info("OrgCenter created successfully");
            await this.clientControllerInstance.addCenter(data);
            return res.json({data, message: "OrgCenter created successfully", statusCode: 200});
        }).catch(err => {
            this.loggerInstance.error(`Error creating orgCenter ${err}`);
            return res.json({data: err, message: 'Error creating orgCenter', statusCode: 500});
        });
    }

    update(req, res) {
        delete req.body._id;
        let id = req.params.id;
        this.orgCenterModel.findById(id)
        .then(data => {
            if (!data) {
                this.loggerInstance.debug("Not found orgCenter");
                return res.json({data: null, message: 'Not found orgCenter', statusCode: 500});
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

    /*getCentersByClient(clientId) {
        this.orgCenterModel.
    }*/
}

export function getOrgCenterControllerInstance() {
    OrgCenterControllerInstance = OrgCenterControllerInstance || new OrgCenterController(loggerInstance, config, getClientControllerInstance());
    return OrgCenterControllerInstance;
}