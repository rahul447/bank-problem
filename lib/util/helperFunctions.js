'use strict';
import Excel from "exceljs";

let helperFunctions = {
    sortArrayByUpdatedAt : function(arr) {
        arr.sort((a, b) => {
            if (!a.updatedAt) return 1;
            if (!b.updatedAt) return -1;
            return (b.updatedAt - a.updatedAt);
        });
    },
    readExcel: async (filename) => {
        const workbook = new Excel.Workbook();
        return await workbook.xlsx.readFile(filename);
    }
};

module.exports = helperFunctions;