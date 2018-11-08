"use strict";

export default class ApiError {

  constructor(message, status) {
    this.message = message;
    this.status = status;
  }
}
