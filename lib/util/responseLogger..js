"use strict";
const Response = require('./response.controller');
import loggerInstance from './apiLogger'; 

const sendClientError = (params) => {
    let {
        res, statusCode, responseMessage, responseObject
    } = params;
    statusCode = statusCode || 400;
    responseMessage = responseMessage || 'Client error calling API';
    loggerInstance.debug(responseMessage);
    return res.status(statusCode).json({
        statusCode, responseMessage, responseObject
    });
}

const sendServerError = (params) => {
    let {
        res, statusCode, responseMessage, responseObject
    } = params;
    statusCode = statusCode || 500;
    responseMessage = responseMessage || 'Server error calling API';
    loggerInstance.error(responseMessage);
    return res.status(statusCode).json({
        statusCode, responseMessage, responseObject
    });
}

const sendSuccess = (params) => {
    let {
        res, statusCode, responseMessage, responseObject
    } = params;
    statusCode = statusCode || 200;
    responseMessage = responseMessage || 'Successfully called API';
    loggerInstance.info(responseMessage);
    return res.status(statusCode).json({
        statusCode, responseMessage, responseObject
    });
}

module.exports = {
    sendClientError,
    sendServerError,
    sendSuccess
}