const values = {
    tagAssociationTypes: [
        'datepicker',
        'listpicker',
        'number',
        'text',
        'question',
        'test',
        'video',
        'audio',
        'studyMaterial',
        'formula',
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