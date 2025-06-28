// create a random arraybuffer, fill it with values and return it

const result = new ArrayBuffer(numCount * Int32Array.BYTES_PER_ELEMENT);
const view = new Int32Array(result);    

for (let i=0; i<numCount; i++) {
    view[i] = Math.floor((Math.random() * 1000) - 500);
}

return {
    someString: "Buffer",
    result: result
}