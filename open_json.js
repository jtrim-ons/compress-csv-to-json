import fs from "fs";
import { decompressData } from './index.js';

const startTime = performance.now();

const compressedFilename = 'oa21-data.json';
const fileContent = fs.readFileSync(compressedFilename, {encoding: "utf8", flag: "r"});
const compressedData = JSON.parse(fileContent);
const decompressedData = decompressData(compressedData, (columnData, rowNumber) => ({
    oa21cd: columnData[0][rowNumber],
    lsoa21cd: columnData[1][rowNumber],
    msoa21cd: columnData[2][rowNumber],
    ltla21cd: columnData[3][rowNumber],
    lng: columnData[4][rowNumber],
    lat: columnData[5][rowNumber],
    population: columnData[6][rowNumber]
}));

const endTime = performance.now();

console.log(`Elapsed time: ${endTime - startTime} ms`)

console.log(decompressedData.slice(0, 2));
console.log(decompressedData.columns);
