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
    courseItemTypes: ['scheduledTests', 'sampleTests', 'syllabus', 'testGroup'],
    testTypes: ['full', 'part', 'practice', 'combined', 'sample', 'concept'],
    testStatuses: ['Live'],
    validAccessTypes: ['CREATE', 'UPDATE', 'DELETE', 'SHARE', 'VIEW', 'PUBLISH', 'EDIT'],
    featureTypes: ['COURSE', 'TEST', 'FORMULA', 'PACKAGE', 'TAG', 'LANGUAGE', 'GRADE', 'TESTTYPE', 'AUDIO', 'VIDEO', 'STUDYMATERIAL', 'QUESTION', 'CONTENT', 'TAGS', 'RULES']
};
module.exports = values;