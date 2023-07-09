import {StringBuilder} from "../StringBuilder";

let RandText = "";
{
    const ITERATIONS = 1000000;
    for (let i = 0; i < ITERATIONS; ++i) {
        RandText += String.fromCharCode(Math.floor(Math.random() * 26) + 'a'.charCodeAt(0));
    }
}


test("append string vs StringBuilder.append", () => {

    const strStart = performance.now();
    let s = '';
    for (let i = 0; i < RandText.length; ++i) {
        s += RandText[i];
    }
    const strTotal = performance.now() - strStart;

    const strArrStart = performance.now();
    let sArr = new Array<string>(RandText.length);
    for (let i = 0; i < RandText.length; ++i) {
        sArr[i] = RandText[i];
    }
    const s1 = sArr.join('');
    const strArrTotal = performance.now() - strArrStart;


    const sbStart = performance.now();
    const sb = new StringBuilder(RandText.length);
    for (let i = 0; i < RandText.length; ++i) {
        sb.append( RandText[i] );
    }

    const s2 = sb.toString();

    const sbTotal = performance.now() - sbStart;

    console.log("append: sb:", sbTotal, "string:", strTotal, "Array<string>:", strArrTotal);

    expect(s2).toBe(s);
    expect(s1).toBe(s);
    expect(sbTotal < strTotal);
});

// Poorer performance for StringBuilder since large blocks of memory are shifted
// every iteration. JS strings are optimized for this task.
test("StringBuilder#insert beginning vs string", () => {
    const ITERATIONS = 10000;
    // string append to beginning
    const strStart = performance.now();
    let str = '';
    for (let i = 0; i < ITERATIONS; ++i) {
        str = RandText[i] + str;
    }
    const strTotal = performance.now() - strStart;

    // string array append to beginning
    const strArrStart = performance.now();
    let strArr = new Array<string>;
    for (let i = 0; i < ITERATIONS; ++i) {
        strArr.unshift(RandText[i]);
    }
    const str1 = strArr.join('');
    const strArrTotal = performance.now() - strArrStart;

    // StringBuilder append to beginning
    const sbStart = performance.now();
    const sb = new StringBuilder(ITERATIONS);
    for (let i = 0; i < ITERATIONS; ++i) {
        sb.insert(0, RandText[i]);
    }
    const str2 = sb.toString();
    const sbTotal = performance.now() - sbStart;

    console.log("insert at 0: sb:", sbTotal, "string:", strTotal, "Array<string>:", strArrTotal);

    //expect(strTotal).toBeGreaterThan(sbTotal);
    expect(str).toBe(str2);
    expect(str1).toBe(str);
});


// Inserting data into the middle of buffer results in significantly
// better performance for StringBuilder
test("StringBuilder#insert middle vs string", () => {
    const ITERATIONS = RandText.length/4;

    // string insert to middle
    const strStart = performance.now();
    let str = '';
    for (let i = 0; i < ITERATIONS; ++i) {
        const pos = Math.floor(str.length/2);
        str = str.slice(0, pos) + RandText[i] + str.slice(pos);
    }
    const strTotal = performance.now() - strStart;

    // string insert to middle
    const strArrStart = performance.now();
    let strArr = new Array<string>;
    for (let i = 0; i < ITERATIONS; ++i) {
        const pos = Math.floor(strArr.length/2);
        strArr.splice(pos, 0, RandText[i]);
    }
    const str1 = strArr.join('');
    const strArrTotal = performance.now() - strArrStart;

    // StringBuilder append to beginning
    const sbStart = performance.now();
    const sb = new StringBuilder(ITERATIONS);
    for (let i = 0; i < ITERATIONS; ++i) {
        sb.insert(Math.floor(sb.length/2), RandText[i]);
    }
    const str2 = sb.toString();
    const sbTotal = performance.now() - sbStart;

    console.log("insert middle: sb:", sbTotal, "string:", strTotal, "strArr:", strArrTotal);

    expect(strTotal).toBeGreaterThan(sbTotal);
    expect(str).toBe(str2);
    expect(str1).toBe(str2);
});
