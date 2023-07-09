import {StringBuilder} from "../StringBuilder";

describe("prepend", () => {
    test("followed by call to str returns text correctly", () => {
        const sb = new StringBuilder();
        sb.prepend("hello");

        expect(sb.length).toBe("hello".length);
        expect(sb.str()).toBe("hello");
    });
});
