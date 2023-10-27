function multiply_and_delta_encode(lines, column_types) {
    for (let {key, col_type} of column_types) {
        if (typeof col_type !== "number") continue;
        let prev = 0;
        for (let line of lines) {
            if (line[key] == null) continue;
            let multiplied = Math.round(line[key] * col_type);
            line[key] = multiplied - prev;
            prev = multiplied;
        }
    }
}

function get_data_by_column(lines, column_types) {
    let data_by_column = [];
    for (let {key, col_type} of column_types) {
        data_by_column.push({
            "name": key,
            "type": typeof col_type === "number" ? "delta" : col_type,
            "multiplier": typeof col_type === "number" ? col_type : null,
            "data": lines.map(line => line[key])
        })
    }
    return data_by_column;
}

export function compressData(lines, column_types) {
    lines = JSON.parse(JSON.stringify(lines));

    let interned_strings = {};
    let interned_strings_len = 0;

    for (let line of lines) {
        for (let {key, col_type} of column_types) {
            if (col_type === "interned_string") {
                let s = line[key];
                if (!(s in interned_strings)) {
                    interned_strings[s] = interned_strings_len;
                    interned_strings_len++;
                }
                line[key] = interned_strings[s];
            } else if (col_type === "int" || col_type === "float") {
                line[key] = +line[key];
            } else if (col_type !== "string") {
                if (line[key] === '' || line[key] === null) {
                    line[key] = null;
                } else {
                    line[key] = +line[key];
                }
            }
        }
    }

    multiply_and_delta_encode(lines, column_types)
    let data_by_column = get_data_by_column(lines, column_types)

    let interned_strings_arr = Array(interned_strings_len);
    for (let [s, i] of Object.entries(interned_strings)) {
        interned_strings_arr[i] = s;
    }

    return {"interned_strings": interned_strings_arr, "columns": data_by_column};
}

export function decompressData({interned_strings, columns}, objectFn) {
    const dummyDataForChecking = columns.map(column => [column.name]);
    const dataToCheck = objectFn(dummyDataForChecking, 0);
    if (Object.entries(dataToCheck).length !== columns.length) {
        throw new Error("Incorrect objectFn: number of fields doesn't match number of columns.")
    }
    for (let [key, val] of Object.entries(dataToCheck)) {
        if (key !== val) {
            throw new Error(`Incorrect objectFn: "${key}" !== "${val}".`)
        }
    }

    const columnData = [];

    for (const column of columns) {
    	let data;
        if (column.type === 'delta') {
            let val = 0;
            data = column.data.map(d => d === null ? null : (val += d) / column.multiplier);
        } else if (column.type === 'interned_string') {
            data = column.data.map(d => interned_strings[d]);
        } else {
        	data = column.data;
		}
    	columnData.push(data);
    }

    // d3.dsv has a fancy objectConverter function for speed,
    // https://github.com/d3/d3-dsv/blob/a2facce660bb4895b56c62a655d0f252efc3d99f/src/dsv.js#L7-L11
    // but it creates a new function from a string in a way that I'm nervous about

    const decompressedData = columns[0].data.map((_, rowNumber) => objectFn(columnData, rowNumber));

    decompressedData.columns = columns.map(d => d.name);

    return decompressedData;
}
