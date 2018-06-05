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
var excelbuilder = require('msexcel-builder');
var multer = require('multer');

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


exports.createPaper = function (i,uniqueId,sheetName,paperName, testCode, filepath, saveStatus) {
    mammoth.convertToHtml({ path: filepath }, validationOptions)
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
                    valFun.validate(testCode, result, function (ids, errArray) {
                        if (errArray.length > 0) {
                            formatCallback(errArray);
                        }
                        else if (errArray.length == 0 && DBFlag == 1) {
                            // console.log(ids.hasOwnProperty("TestId"));
                            // console.log(ids.hasOwnProperty("ScheduleId"));


                            dsl.getTestObj(uniqueId, function (err,display, testArray) {
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
                                    console.log(testCode);
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
                                                var source = "https://" + Bucket + ".s3-us-west-2.amazonaws.com/TestPapers/"+ key + '/' + name;
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
                                                s3.putObject({ 'Bucket': Bucket, 'Key': "TestPapers/"+key + '/' + file, 'Body': base64data, 'ACL': 'public-read' }, function (resp) {
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
                                    mammoth.convertToHtml({ path: filepath }, docOptions)
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
                                                    var uploadDetailObj = {uniqueId:'',sheetName:'',paperName:'',fileLocation:''};
                                                    uploadDetailObj.uniqueId=uniqueId;
                                                    uploadDetailObj.sheetName=sheetName;
                                                    uploadDetailObj.paperName=paperName;
                                                    uploadDetailObj.fileLocation=filepath;
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
                        saveStatus(i, err);
                    }
                    else {
                        var errA = [];
                        errA.push(errorReporter.createErrorObj("PAPER_CREATED", 'Paper created'));
                        saveStatus(i, errA);
                    }
                })
        })
}

exports.createPaperMain = function(req, res) {
    console.log(" req body: ", req.body); return false;
    //createPaper(i,uniqueId,sheetName,paperName, testCode, filepath, saveStatus);

    var dateUpload = Date.now();
    console.log(dateUpload);
    var Storage = multer.diskStorage({
        destination: function (req, file, callback) {
            callback(null, "./uploads");
        },
        filename: function (req, file, callback) {
            // //(file);
            callback(null, "BulkUpload" + dateUpload + '.docx');
        }
    });

    var testBulkUpload = multer({storage: Storage}).single("file");

    testBulkUpload(req, res, function (err) {
        var originalFileName=req.file.originalname.split(".");
        var ofExt = originalFileName[originalFileName.length-1];
        if (err) {
            return res.status(400).send({
                data: {
                    code: 400,
                    success: false,
                    message: ["File is corrupted or some internal error occured"]
                }
            });
        }
        else if(ofExt!="docx"){
            fs.unlinkSync(dir + "/BulkUpload" + dateUpload + '.docx');
            return res.status(400).send({
                data: {
                    code: 400,
                    success: false,
                    message: ["Please upload docx file"]
                }
            });
        }
        else {
            var fileName = "BulkUpload" + dateUpload + '.docx';
            mammoth.convertToHtml({ path: dir + "/" + fileName }, validationOptions)
                .then(function (result) {
                    async.waterfall([
                        function (formatCallback) {
                            readFun.formatEquation(result.value, function (err, html) {
                                if (err) {
                                    formatCallback(err);
                                }
                                else {
                                    formatCallback(null, html);
                                }
                            });
                        },
                        function (html, formatCallback) {
                            readFun.formatHtml(html, function (err, final) {
                                if (err) {
                                    formatCallback(err);
                                }
                                else {
                                    //console.log(final);
                                    formatCallback(null, final);
                                }
                            })
                        }], function (err, result) {
                        //console.log(result);
                        valFun.validate(result, function (ids,val) {
                            if (val.length > 0) {
                                var errorList = val.map(function(singleObj){return singleObj.errorString});
                                fs.unlinkSync(dir+"/"+fileName);
                                return res.status(400).send({
                                    data: {
                                        code: 400,
                                        success: false,
                                        message: errorList
                                    }
                                });
                            }
                            else if (val.length == 0) {
                                console.log(ids.hasOwnProperty("TestId"));
                                console.log(ids.hasOwnProperty("ScheduleId"));
                                dsl.getTestObj(function (err, test) {
                                    if (err) {
                                        fs.unlinkSync(dir+"/"+fileName);
                                        return res.status(400).send({
                                            data: {
                                                code: 400,
                                                success: false,
                                                message: ["Internal error occured"]
                                            }
                                        });
                                    }
                                    else {
                                        var key;
                                        if (ids.hasOwnProperty("TestId")) {
                                            key=ids.TestId;
                                            previewTestObj._id = ids.TestId;
                                        }
                                        else if (ids.hasOwnProperty("ScheduleId")) {
                                            previewTestObj._id = test._id;
                                            key = test._id;
                                            previewTestObj.scheduleId = ids.ScheduleId;
                                        }
                                        var docOptions = {
                                            convertImage: mammoth.images.inline(function (image) {
                                                return image.read("base64").then(function (imageBuffer) {
                                                    var str = image.contentType;
                                                    var type = str.substr(str.indexOf("/") + 1);
                                                    var name = "Question" + Date.now() + Math.ceil(Math.random() * 1000) + "." + type;
                                                    var source = "https://" + Bucket + ".s3-us-west-2.amazonaws.com/" + key + '/' + name;
                                                    console.log(source);
                                                    base64_decode(imageBuffer, name);
                                                    return {
                                                        style: "width:100%;",
                                                        src: source
                                                    };
                                                })
                                            })
                                        };
                                        var base64_decode = function (base64str, file) {
                                            // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
                                            var bitmap = new Buffer(base64str, 'base64');
                                            // write buffer to file
                                            fs.writeFileSync(dir+"/"+file, bitmap);
                                            fs.readFile(dir+"/"+file, function (err, data) {
                                                if (err) {
                                                    console.log("error in reading file");
                                                }
                                                else {
                                                    var base64data = new Buffer(data, 'binary');
                                                    s3.putObject({ 'Bucket': Bucket, 'Key': key + '/' + file, 'Body': base64data, 'ACL': 'public-read' }, function (resp) {
                                                        fs.unlink(dir+"/"+file, function (err) {
                                                            if (err) {
                                                                console.log(err);
                                                            }
                                                        });
                                                    });
                                                }

                                            })
                                        };
                                        mammoth.convertToHtml({ path: dir + "/" + fileName }, docOptions)
                                            .then(function (results) {
                                                async.waterfall([function (formatCallback) {
                                                    readFun.formatEquation(results.value, function (err, htmls) {
                                                        if (err) {
                                                            formatCallback(err);
                                                        }
                                                        else {
                                                            formatCallback(null, htmls);
                                                        }
                                                    });
                                                }, function (htmls, formatCallback) {
                                                    readFun.formatHtml(htmls, function (err, finals) {
                                                        if (err) {
                                                            formatCallback(err);
                                                        }
                                                        else {
                                                            formatCallback(null, finals);
                                                        }
                                                    })
                                                }], function (err, resultfinals) {
                                                    //console.log(resultfinals);
                                                    readFun.readFile(previewTestObj, resultfinals, function (test,sectionArray,err) {
                                                        if (!err) {
                                                            console.log("preview called");
                                                            //console.dir(sectionArray,{depth:null});
                                                            fs.unlinkSync(dir+"/"+fileName);
                                                            return res.status(200).send({
                                                                data: {
                                                                    code: 200,
                                                                    success: true,
                                                                    test: test,
                                                                    sections:sectionArray
                                                                }
                                                            })
                                                        }
                                                        else {
                                                            fs.unlinkSync(dir+"/"+fileName);
                                                            return res.status(400).send({
                                                                data: {
                                                                    code: 400,
                                                                    success: false,
                                                                    message: ["Error occured"]
                                                                }
                                                            })
                                                        }
                                                    })
                                                })
                                            })
                                    }
                                })
                            }

                        })
                    })
                })
        }
    });

};




