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
    }
};
module.exports = values;