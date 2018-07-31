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
    courseItemTypes: ['scheduledTests', 'sampleTests', 'syllabus', 'testGroup', 'orgTests'],
    testTypes: ['full', 'part', 'practice', 'combined', 'sample', 'concept', 'chap'],
    testStatuses: ['Live'],
    validAccessTypes: ["CREATE", "UPDATE", "DELETE", "SHARE", "VIEW", "PUBLISH", "EDIT", "VALIDATE"],
    featureTypes: ['COURSE', 'TEST', 'FORMULA', 'PACKAGE', 'TAG', 'LANGUAGE', 'GRADE', 'TESTTYPE', 'AUDIO', 'VIDEO', 'STUDYMATERIAL', 'QUESTION', 'CONTENT', 'TAGS', 'RULES', 'CLIENT', 'CONTENTSETTING', 'COURSESYLLABUS', "USER", "RULE"],
    permissionType: ['PARTIAL', 'ALL']
};
module.exports = values;