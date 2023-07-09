import {StringBuilder} from "../StringBuilder";

test("constructor: string", () => {
    const sb = new StringBuilder("01234");
    expect(sb.toString()).toBe("01234");
});

test("constructor: number", () => {
    const sb = new StringBuilder(40);
    expect(sb.bufferLength >= 40);
});
