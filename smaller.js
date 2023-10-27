import fs from "fs";
import { csvParse } from "d3-dsv";
import { compressData } from './index.js';

const csvFilename2 = 'oa21-data.csv';
const fileContent2 = fs.readFileSync(csvFilename2, {encoding: "utf8", flag: "r"});
const csvLines2 = csvParse(fileContent2);
let compressed2 = compressData(csvLines2, [
    {key: 'oa21cd', col_type: 'string'},
    {key: 'lsoa21cd', col_type: 'string'},
    {key: 'msoa21cd', col_type: 'string'},
    {key: 'ltla21cd', col_type: 'string'},
    {key: 'lng', col_type: 10000},
    {key: 'lat', col_type: 10000},
    {key: 'population', col_type: 'int'}
]);
fs.writeFileSync('oa21-data.json', JSON.stringify(compressed2))

