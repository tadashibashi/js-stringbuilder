import {StringBuilder, StringBuilderMinSize} from "../../StringBuilder";

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

         // current algo: (length + 1) * 2 + include the Prepend Buffer size <-- this kind of hardcoded test is bad?!...
         expect(sb.bufferLength).toBe((newStr.length + 1) * 2 + StringBuilderMinSize);
         expect(sb.str()).toBe(newStr);
         expect(sb.length).toBe(newStr.length);
     });

    test("shrinks buffer size, and prepend buffer size", () => {
        const newStr = "abcdefghijklmnopqrstuvwxyz";
        const sb = new StringBuilder(newStr);

        const PREPEND = "012345678901234567890123456789";
        sb.prepend(PREPEND);

        sb.shrink();
        expect(sb.bufferLength).toBe((newStr.length + 1) * 2 + (PREPEND.length + 1) * 2); // current algo: (length + 1) * 2
    });
});

