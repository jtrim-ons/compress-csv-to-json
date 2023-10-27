import fs from "fs";
import { decompressData } from './index.js';

const startTime = performance.now();

const compressedFilename = 'oa21-data.json';
const fileContent = fs.readFileSync(compressedFilename, {encoding: "utf8", flag: "r"});
const compressedData = JSON.parse(fileContent);
const decompressedData = decompressData(compressedData, (columns, rowNumber) => ({
    oa21cd: columns[0].data[rowNumber],
    lsoa21cd: columns[1].data[rowNumber],
    msoa21cd: columns[2].data[rowNumber],
    ltla21cd: columns[3].data[rowNumber],
    lng: columns[4].data[rowNumber],
    lat: columns[5].data[rowNumber],
    population: columns[6].data[rowNumber]
}));

const endTime = performance.now();

console.log(`Elapsed time: ${endTime - startTime} ms`)

console.log(decompressedData.slice(0, 2));
console.log(decompressedData.columns);
