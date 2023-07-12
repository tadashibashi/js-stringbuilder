import StringBuilder from "../../StringBuilder";

describe("iterator tests", () => {
    test("for of test", () => {
        const TARGET_STRING = "abcdefg"
        const sb = new StringBuilder(TARGET_STRING);

        let str = "";

        // @ts-ignore
        for (let c of sb) {
            str += c;
        }

        expect(str).toBe(TARGET_STRING);
    });
});
