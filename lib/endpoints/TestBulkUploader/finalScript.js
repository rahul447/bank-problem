var dsl = require("./paperHelper/dsl");
var fs = require('fs');
var mammoth = require("./mammoth/lib");
var AWS = require('aws-sdk');
var async = require('async');
var mongoose = require('mongoose');
var TestModel = require('../test/tests.model');
var readFun = require('./paperHelper/NReader');
var errorReporter = require('./paperHelper/paperUploadErrorList');
var valFun = require('./paperHelper/validate');
var xlsxj = require("xlsx-to-json");
var _ = require('lodash');
var request = require('request');
var excelbuilder = require('msexcel-builder');
var multer = require('multer');
var awsCli = require("aws-cli-js");

let {NODE_ENV} = process.env,
    nodeEnv = NODE_ENV || "staging",
    config = Object.freeze(require("../../../config/" + nodeEnv));

AWS.config.update(config.awsDetailsBulkUploader);

var DBFlag = 1; //0 for summary 1 for updation in the db
var dir ="./uploads";

var Bucket = 'question-uploader';
var s3 = new AWS.S3();
var validationOptions = {
    convertImage: mammoth.images.inline(function (image) {
        var str = image.contentType;
        var type = str.substr(str.indexOf("/") + 1);
        if (type == "jpg" || type == "png" || type == "jpeg") {
            return {
                src: "OK"
            };
        }
        else {
            return {
                src: "Wrong Type"
            };
        }
    })
};
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}


async function moveFileFromS3ToLocal(file) {
    let path = "uploads";
    const comm = `s3 cp "s3://${this.config.testBulk.bucket}/${file}" "${path}"`;
    console.log("comm : ", comm);
    return await runCommand(comm);
}


function runCommand(command) {

    let awsCliOptions = awsCli.Options;
    let awsCliInstance = new awsCli.Aws(new awsCliOptions(this.config.awsDetailsBulkUploader.accessKeyId, this.config.awsDetailsBulkUploader.secretAccessKey, null));
    return new Promise((resolve, reject) => {
        awsCliInstance.command(command)
        .then((data) => {
            console.log("command data : ", data);
            resolve(data);
        })
        .catch(err => {
            console.log("err : ", err);
            reject(err);
        });
    });
}


function mamothWork(filepath, body) {
    mammoth.convertToHtml({path: filepath}, validationOptions)
        .then(function (result) {
            async.waterfall([
                function (formatCallback) {
                    readFun.formatEquation(result.value, function (err, html) {
                        if (err) {
                            var errA = [];
                            errA.push(errorReporter.createErrorObj("FORMAT_EQ"));
                            formatCallback(errA);
                        }
                        else {
                            formatCallback(null, html);
                        }
                    });
                },
                function (html, formatCallback) {
                    readFun.formatHtml(html, function (err, final) {
                        if (err) {
                            var errA = [];
                            errA.push(errorReporter.createErrorObj("FORMAT_HTML"));
                            formatCallback(errA);
                        }
                        else {
                            //console.log(final);
                            formatCallback(null, final);
                        }
                    })
                }, function (result, formatCallback) {
                    //console.log(result);
                    valFun.validate(result, function (ids, errArray) {
                        if (errArray.length > 0) {
                            formatCallback(errArray);
                        }
                        else if (errArray.length == 0 && DBFlag == 1) {
                            // console.log(ids.hasOwnProperty("TestId"));
                            // console.log(ids.hasOwnProperty("ScheduleId"));


                            dsl.getTestObj(body.uniqueId, function (err, display, testArray) {
                                if (err) {
                                    formatCallback(err); //TODO convert to array
                                }
                                else if (testArray.length == 0) {
                                    var errA = [];
                                    //console.log(display);
                                    errA.push(errorReporter.createErrorObj(display));
                                    formatCallback(errA);
                                }
                                else {
                                    var key = testArray[0]._id;
                                    // if (ids.hasOwnProperty("TestId")) {
                                    //     key = ids.TestId;
                                    //     previewTestObj._id = ids.TestId;
                                    // }
                                    // else if (ids.hasOwnProperty("ScheduleId")) {
                                    //     previewTestObj._id = test._id;
                                    //     key = test._id;
                                    //     previewTestObj.scheduleId = ids.ScheduleId;
                                    // }
                                    var docOptions = {
                                        convertImage: mammoth.images.inline(function (image) {
                                            return image.read("base64").then(function (imageBuffer) {
                                                var str = image.contentType;
                                                var type = str.substr(str.indexOf("/") + 1);
                                                var name = "Question" + Date.now() + Math.ceil(Math.random() * 1000) + "." + type;
                                                var source = "https://" + Bucket + ".s3-us-west-2.amazonaws.com/TestPapers/" + key + '/' + name;
                                                console.log(source);
                                                base64_decode(imageBuffer, name);
                                                return {
                                                    src: source
                                                };
                                            })
                                        })
                                    };
                                    var base64_decode = function (base64str, file) {
                                        // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
                                        var bitmap = new Buffer(base64str, 'base64');
                                        //write buffer to file
                                        fs.writeFileSync(dir + "/" + file, bitmap);
                                        fs.readFile(dir + "/" + file, function (err, data) {
                                            if (err) {
                                                console.log("error in reading file");
                                            }
                                            else {
                                                var base64data = new Buffer(data, 'binary');
                                                s3.putObject({
                                                    'Bucket': Bucket,
                                                    'Key': "TestPapers/" + key + '/' + file,
                                                    'Body': base64data,
                                                    'ACL': 'public-read'
                                                }, function (resp) {
                                                    //console.log(resp);
                                                    fs.unlink(dir + "/" + file, function (err) {
                                                        if (err) {
                                                            console.log(err);
                                                        }
                                                    });
                                                });
                                            }
                                        })
                                    };
                                    mammoth.convertToHtml({path: filepath}, docOptions)
                                        .then(function (results) {
                                            async.waterfall([function (formatInsideCallback) {
                                                readFun.formatEquation(results.value, function (err, htmls) {
                                                    if (err) {
                                                        formatInsideCallback(err); //TODO
                                                    }
                                                    else {
                                                        formatInsideCallback(null, htmls);
                                                    }
                                                });
                                            }, function (htmls, formatInsideCallback) {
                                                readFun.formatHtml(htmls, function (err, finals) {
                                                    if (err) {
                                                        formatInsideCallback(err); //TODO
                                                    }
                                                    else {
                                                        formatInsideCallback(null, finals);
                                                    }
                                                })
                                            }, function (valueHtml, formatInsideCallback) {
                                                //TODO Need to add to above
                                                readFun.generateConcept(valueHtml, function (err, htmlConcept) {
                                                    if (err) {
                                                        formatInsideCallback(err); //TODO
                                                    }
                                                    else {
                                                        formatInsideCallback(null, valueHtml, htmlConcept);
                                                    }
                                                })
                                            }, function (resultHtml, concepts, formatInsideCallback) {
                                                //each test
                                                async.eachSeries(testArray, function (test, testCallback) {
                                                    var tempTest = new TestModel();
                                                    test.data = tempTest.data;
                                                    var uploadDetailObj = {
                                                        uniqueId: '',
                                                        sheetName: '',
                                                        paperName: '',
                                                        fileLocation: ''
                                                    };
                                                    test.name = body.testName;
                                                    test.displayName = body.testName;
                                                    test.testType = body.testType;
                                                    uploadDetailObj.uniqueId = body.uniqueId;
                                                    uploadDetailObj.fileLocation = body.file[0];
                                                    test["uploadDetail"] = uploadDetailObj;
                                                    //Final Write to DB
                                                    readFun.readFile(test, resultHtml, concepts, function (err) {
                                                        if (!err) {
                                                            console.log("paper created");
                                                            testCallback(null);
                                                        }
                                                        else {
                                                            testCallback(err); //TODO
                                                        }
                                                    })
                                                }, function (err) {
                                                    if (err) {
                                                        formatInsideCallback(err); //TODO
                                                    }
                                                    else {
                                                        formatInsideCallback(null);
                                                    }
                                                })
                                            }], function (err, resultfinals) {
                                                if (err) {
                                                    formatCallback(err); //TODO
                                                }
                                                else {
                                                    formatCallback(null);
                                                }
                                            })
                                        })
                                }
                            })
                        }
                        else {
                            formatCallback(null);
                        }
                    });
                }], function (err, result) {
                if (err) {
                    console.log(err);
                    //saveStatus(i, err);
                }
                else {
                    var errA = [];
                    errA.push(errorReporter.createErrorObj("PAPER_CREATED", 'Paper created'));
                    //saveStatus(i, errA);
                }
            })
        })
}

exports.createPaper = async function (req, res) {
    await moveFileFromS3ToLocal(req.body.bucketKey);
    const filepath = `uploads/${req.body.bucketKey}`;
    const result = mamothWork(filepath, req.body);
    console.log(" result : ", result);
};





