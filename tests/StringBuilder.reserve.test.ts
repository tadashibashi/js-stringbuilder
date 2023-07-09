import {StringBuilder} from "../StringBuilder";

describe("reserving", () => {
    test("1000 increases buffer length to 1000 or more", () => {
        const str = "012345";
        const sb = new StringBuilder(str);
        sb.reserve(1000);

        expect(sb.bufferLength).toBeGreaterThanOrEqual(1000);
    });

    test("less than previously set has no effect", () => {
        const sb = new StringBuilder(400);

        expect(sb.bufferLength).toBeGreaterThanOrEqual(400);
        sb.reserve(0);
        expect(sb.bufferLength).toBeGreaterThanOrEqual(400);
    });
});
