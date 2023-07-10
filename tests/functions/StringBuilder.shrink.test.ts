import {StringBuilder} from "../../StringBuilder";

const testLength = 250_000;
let testStr = '';
for (let i = 0; i < testLength; ++i) {
    testStr += String.fromCharCode(i % 256);
}

describe("shink", () => {
     test("shrinks buffer size, while maintaining shortened string", () => {
         const sb = new StringBuilder(testStr);
         expect(sb.bufferLength).toBeGreaterThanOrEqual(testLength);
         expect(sb.toString()).toBe(testStr);

         const newStr = "abcdefghijklmnopqrstuvwxyz";
         sb.str(newStr);
         expect(sb.bufferLength).toBeGreaterThanOrEqual(testLength); // maintain size until shrink

         sb.shrink();
         expect(sb.bufferLength).toBe(54); // current algo: (length + 1) * 2
         expect(sb.str()).toBe(newStr);
         expect(sb.length).toBe(newStr.length);
     });
});

