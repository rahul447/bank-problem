'use strict'

let helperFunctions = {
    sortArrayByUpdatedAt : function(arr) {
        arr.sort((a, b) => {
            if (!a.updatedAt) return 1;
            if (!b.updatedAt) return -1;
            return (b.updatedAt - a.updatedAt);
        });
    }
};

module.exports = helperFunctions;