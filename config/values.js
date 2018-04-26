const values = {
    tagAssociationTypes: [
        'datepicker',
        'listpicker',
        'number',
        'text',

        //content types below
        'question',
        'test',
        'video',
        'audio',
        'studyMaterial',
        'formula',
        'file',
        'course'
    ],
    contentStatus: {
        values: [
            'DRAFT',
            'PUBLISHED',
            'DELETED'
        ],
        default: 'DRAFT'
    },
    validAccessTypes: ['CREATE', 'UPDATE', 'DELETE', 'SHARE', 'VIEW', 'PUBLISH'],
    featureTypes: ['COURSE', 'TEST', 'FORMULA', 'PACKAGE', 'TAG', 'LANGUAGE', 'GRADE', 'TESTTYPE', 'AUDIO', 'VIDEO', 'STUDYMATERIAL', 'QUESTION'],
    courseItemTypes: ['scheduledTests', 'sampleTests', 'syllabus', 'testGroup']
};
module.exports = values;