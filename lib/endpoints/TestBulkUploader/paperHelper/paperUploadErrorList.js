exports.ErrorList=[
    {code:"PAPER_CREATED",typeString:"No error"},
    {code:"DOC_FOUND",typeString:"Doc File found. Docx required."},
    {code:"FILE_NOT_EXIST",typeString:"File does not Exist"},
    {code:"FORMAT_EQ",typeString:"Equation Format is faulty"},
    {code:"FORMAT_HTML",typeString:"HTML format is empty"},
    {code:"SQL_ID_NOT_FOUND",typeString:"SQL Id not found"},
    {code:"MISSING_KEY",typeString:"Missing key"},
    {code:"NO_VALUE_KEY",typeString:"Value not found"},
    {code:"INVALID_VALUE_KEY",typeString:"Invalid value"},
    {code:"INVALID_IMG",typeString:"Invalid image format"},
    {code:"QUESTION_NO_VALUE_KEY",typeString:"Value not found in question"},
    {code:"QUESTION_MISSING_KEY",typeString:"Missing key in question"},
    {code:"QUESTION_TYPE",typeString:"Question type not found"},
    {code:"MISSING_SECTION",typeString:"Section not found"},
    {code:"MISSING_SUB_SECTION",typeString:"Subsection not found"},
    {code:"CONCEPT_ISSUE",typeString:"Concept not in mongodb"},
    {code:"TEST_CODE_ISSUE",typeString:"Test not found in db"},
    {code:"TEST_ALREADY_CREATED",typeString:"Test already upto date"},
    {code:"NEW_TEST_CREATED",typeString:"New test created"},
    {code:"UNIQUEID_NOT_FOUND",typeString:"uniqueId not found"}
];

 exports.createErrorObj = function (code, errorString) {
     var typestring;
     for (i = 0; i < exports.ErrorList.length; i++) {
         if(code==exports.ErrorList[i].code){
             typestring=exports.ErrorList[i].typeString;
         }
     }
     if (errorString == null || typeof (errorString) == 'undefined') {
         errorString = typestring; //TODO Same as typestring
     }
     return {
         "code": code,
         "errorString": errorString,
         "typeString": typestring //TODO
     }
 }