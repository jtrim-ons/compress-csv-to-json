import fs from 'node:fs';
import {csvParse} from 'd3-dsv';
import {compressData, generateDecompressionCode} from './index.js';

const csvFilename2 = 'oa21-data.csv';
const fileContent2 = fs.readFileSync(csvFilename2, {encoding: 'utf8', flag: 'r'});
const csvLines2 = csvParse(fileContent2);
const columns = [
	{key: 'oa21cd', colType: 'string'},
	{key: 'lsoa21cd', colType: 'string'},
	{key: 'msoa21cd', colType: 'string'},
	{key: 'ltla21cd', colType: 'string'},
	{key: 'lng', colType: 10_000},
	{key: 'lat', colType: 10_000},
	{key: 'population', colType: 'int'},
];
const compressed2 = compressData(csvLines2, columns);
fs.writeFileSync('oa21-data.json', JSON.stringify(compressed2));

console.log('Wrote JSON file.');

const decompressionCode = generateDecompressionCode(columns.map(c => c.key));
console.log('You can use this code to decompress the JSON data:');
console.log(decompressionCode);
