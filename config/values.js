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
    features: [],     // {endpoint: '', message: 'not valid'}     //api endpoints
    contentTypes: ['AUDIO', 'VIDEO', 'STUDYMATERIAL', 'QUESTION']
};
module.exports = values;