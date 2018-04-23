"use strict";
import elasticsearch from "elasticsearch";
import {MigrateController} from "../endpoints/migrate/migrate.controller";

let protectedElasticInstance;

class ElasticDB {

    constructor(config) {
        this.elasticClient = new elasticsearch.Client({
            host: `${config.elasticConnection.hostname}:${config.elasticConnection.port}`,
            log: 'trace'
        });
    }

    checkElasticCluster() {
        this.elasticClient.ping({ requestTimeout: 1000 }, error => {
            error ? this.loggerInstance.error(`elasticsearch cluster is down!`): this.loggerInstance.info(`elasticsearch cluster is up`);
        });
    }

    async checkIndexExists(index) {
        return await this.elasticClient.indices.exists({ index: index })
    }

    createIndex(index, settings = {}, mappings = {}) {
        let indexCreateObject = {};
        indexCreateObject.index = index;
        Object.keys(settings).length > 0 ? (!indexCreateObject.hasOwnProperty('body') ? indexCreateObject.body = {}: '', indexCreateObject.body.settings = settings): '';

        Object.keys(mappings).length > 0 ? (!indexCreateObject.hasOwnProperty('body') ? indexCreateObject.body = {}: '', indexCreateObject.body.mappings = mappings): '';

        return new Promise((resolve, reject) => {
            this.elasticClient.indices.create(indexCreateObject, (err, resp, status) => {
                console.log("err : ", err);
                console.log("resp : ", resp);
                console.log("status : ", status);
                err ? reject(err): resolve(resp);
            });
        });
    }

    bulkPushToElastic(index, maxRetries, body) {
        return new Promise((resolve, reject) => {
            this.elasticClient.bulk({
                maxRetries: maxRetries,
                index: index,
                body: body
            }, (err, resp, status) => {
                err ? reject(err): resolve(resp);
            })
        });
    }

    addDocToIndex(index, type, body) {
        return new Promise((resolve, reject) => {
            this.elasticClient.create({
                index: index,
                type: type,
                id: body._id,
                body: body
            }, (error, response) => {
                error ? reject(error): resolve(response);
            });
        });
    }

    updateDocInIndex(index, type, idToUpdate, propsToUpdate) {

        let doc = {};
        for(let prop in propsToUpdate) {
            doc[prop] = propsToUpdate[prop];
        }

        return new Promise((resolve, reject) => {
            this.elasticClient.update({
                index: index,
                type: type,
                id: idToUpdate,
                body: {
                    // put the partial document under the `doc` key
                    doc: doc
                }
            }, (error, response) => {
                error ? reject(error): resolve(response);
            });
        });
    }

    deleteDocFromIndex(index, type, docId) {
        return new Promise((resolve, reject) => {
            this.elasticClient.delete({
                index: index,
                type: type,
                id: docId
            }, (error, response) => {
                error ? reject(error) : resolve(response);
            });
        })
    }

}

function getElasticInstance(config) {
    protectedElasticInstance = protectedElasticInstance || new ElasticDB(config);
    return protectedElasticInstance;
}

let nodeEnv = process.env.NODE_ENV || "staging",
    config = require("../../config/" + nodeEnv),
    loggerOptions = config.logger || {},
    elasticInstance = getElasticInstance(loggerOptions);

export default elasticInstance;
