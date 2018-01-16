"use strict";
import bunyan from "bunyan";

let protectedLoggerInstance;

class logger {

    constructor(config) {
        if (!config || !config.name || !config.streams) {
            const loggerConfig = Object.freeze(require("../../config/development"));
            console.log("Missing Configuration for logger", config);
            this.log = bunyan.createLogger(loggerConfig);
        } else {
            this.log = bunyan.createLogger(config);
        }
    }

    debug(msg, obj) {
        if (typeof obj !== "undefined") {
            this.log.debug(msg, obj);
        } else {
            this.log.debug(msg);
        }
    }

    error(msg, obj) {
        if (typeof obj !== "undefined") {
            this.log.error(msg, obj);
        } else {
            this.log.error(msg);
        }
    }

    trace(msg, obj) {
        if (typeof obj !== "undefined") {
            this.log.trace(msg, obj);
        } else {
            this.log.trace(msg);
        }
    }

    info(msg, obj) {
        if (typeof obj !== "undefined") {
            this.log.info(msg, obj);
        } else {
            this.log.info(msg);
        }
    }

    warn(msg, obj) {
        if (typeof obj !== "undefined") {
            this.log.warn(msg, obj);
        } else {
            this.log.warn(msg);
        }
    }

    fatal(msg, obj) {
        if (typeof obj !== "undefined") {
            this.log.fatal(msg, obj);
        } else {
            this.log.fatal(msg);
        }
    }

}

function getLoggerInstance(config) {
    protectedLoggerInstance = protectedLoggerInstance || new logger(config);
    return protectedLoggerInstance;
}

let nodeEnv = process.env.NODE_ENV || "development",
  config = require("../../config/" + nodeEnv),
  loggerOptions = config.logger || {},
  loggerInstance = getLoggerInstance(loggerOptions);

export default loggerInstance;
