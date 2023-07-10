import {StringBuilder} from "../../StringBuilder";

describe("replace", () => {
    test("Hello World", () => {
        const stringBuilder = new StringBuilder("Hello world!");

        // mutates internal string
        stringBuilder.replace(/world/, "StringBuilder");

        expect(stringBuilder.str()).toBe("Hello StringBuilder!");
    });
});
