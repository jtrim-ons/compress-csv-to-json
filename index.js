function multiplyAndDeltaEncode(lines, columnTypes) {
	for (const {key, colType} of columnTypes) {
		if (typeof colType !== 'number') {
			continue;
		}

		let previous = 0;
		for (const line of lines) {
			if (line[key] === null) {
				continue;
			}

			const multiplied = Math.round(line[key] * colType);
			line[key] = multiplied - previous;
			previous = multiplied;
		}
	}
}

function getDataByColumn(lines, columnTypes) {
	const dataByColumn = [];
	for (const {key, colType} of columnTypes) {
		dataByColumn.push({
			name: key,
			type: typeof colType === 'number' ? 'delta' : colType,
			multiplier: typeof colType === 'number' ? colType : null,
			data: lines.map(line => line[key]),
		});
	}

	return dataByColumn;
}

export function compressData(lines, columnTypes) {
	lines = JSON.parse(JSON.stringify(lines));

	const internedStrings = {};
	let internedStringsLength = 0;

	for (const line of lines) {
		for (const {key, colType} of columnTypes) {
			if (colType === 'interned_string') {
				const s = line[key];
				if (!(s in internedStrings)) {
					internedStrings[s] = {string: s, count: 1};
					++internedStringsLength;
				} else {
					++internedStrings[s].count;
				}
			} else if (colType === 'int' || colType === 'float') {
				line[key] = Number(line[key]);
			} else if (colType !== 'string') {
				line[key] = line[key] === '' || line[key] === null ? null : Number(line[key]);
			}
		}
	}

	const internedStringsArray = Array.from({length: internedStringsLength});
	Object.keys(internedStrings)
		.map(key => internedStrings[key])
		.sort((a, b) => b.count - a.count)
		.forEach((d, i) => {
			internedStrings[d.string] = i;
			internedStringsArray[i] = d.string;
		});

	for (const line of lines) {
		for (const {key, colType} of columnTypes) {
			if (colType === 'interned_string') {
				line[key] = internedStrings[line[key]];
			}
		}
	}

	multiplyAndDeltaEncode(lines, columnTypes);
	const dataByColumn = getDataByColumn(lines, columnTypes);

	return {internedStrings: internedStringsArray, columns: dataByColumn};
}

export function decompressData({internedStrings, columns}, objectFn) {
	const dummyDataForChecking = columns.map(column => [column.name]);
	const dataToCheck = objectFn(dummyDataForChecking, 0);
	if (Object.entries(dataToCheck).length !== columns.length) {
		throw new Error('Incorrect objectFn: number of fields doesn\'t match number of columns.');
	}

	for (const [key, value] of Object.entries(dataToCheck)) {
		if (key !== value) {
			throw new Error(`Incorrect objectFn: "${key}" !== "${value}".`);
		}
	}

	const columnData = [];

	for (const column of columns) {
		let data;
		if (column.type === 'delta') {
			let value = 0;
			data = new Array(column.data.length);
			for (let i = 0; i < column.data.length; i++) {
				data[i] = column.data[i] === null ? null : (value += column.data[i]) / column.multiplier;
			}
		} else if (column.type === 'interned_string') {
			data = new Array(column.data.length);
			for (let i = 0; i < column.data.length; i++) {
				data[i] = internedStrings[column.data[i]];
			}
		} else {
			data = column.data;
		}

		columnData.push(data);
	}

	// D3.dsv has a fancy objectConverter function for speed,
	// https://github.com/d3/d3-dsv/blob/a2facce660bb4895b56c62a655d0f252efc3d99f/src/dsv.js#L7-L11
	// but it creates a new function from a string in a way that I'm nervous about

	const decompressedData = columns[0].data.map((_, rowNumber) => objectFn(columnData, rowNumber));

	decompressedData.columns = columns.map(d => d.name);

	return decompressedData;
}

export function generateDecompressionCode(columnNames) {
	let result = 'const decompressedData = decompressData(compressedData, (columnData, rowNumber) => ({\n';
	for (let i=0; i<columnNames.length; i++) {
		const name = columnNames[i];
		result += `    ${name}: columnData[${i}][rowNumber],\n`;
	}

	result += '}));'
	return result;
}
