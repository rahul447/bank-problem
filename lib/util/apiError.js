"use strict";

export default class ApiError {

  constructor(errorType, messages, innerError, statusCode) {

    this.errorType = errorType;

    this.messages = messages;

    this.innerError = innerError;

    this.statusCode = statusCode;
  }
}
