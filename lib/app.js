import express from "express";
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
import mwErrorHandler from "./middlewares/mwErrorHandler";
import domain from "express-domain-middleware";

var helmet = require('helmet');

import {dbConnect} from "./db";

import transactionRouter from "./endpoints/transactions/transaction.router";

let app = express(),
    {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../config/" + nodeEnv)),
    urlPrefix = config.urlPrefix;

app.use(helmet());
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb'}));
app.use(cookieParser());
app.use(mwErrorHandler);
app.use(domain);

app.use(urlPrefix + "/healthcheck", (req, res) => {
    res.status(200).send("OK");
});

app.use(urlPrefix + "/", transactionRouter);

app.set("port", config.http.port);

dbConnect(config);

/// catch 404 and forwarding to error handler
app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    return res.status(404).json({ code: 404, message: "not found", data: {} });
});


app.listen(app.get('port'), () => {
    console.log(new Date(), "Server has started and is listening on port: " + app.get("port"));
    console.log("============Welcome to Bank Problem===============");
    console.log("Mode:", config.mode);
});

module.exports = app;
