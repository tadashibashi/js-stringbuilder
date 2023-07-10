import {StringBuilder} from "../../StringBuilder";

test("equals: empty string", () => {
    const sb = new StringBuilder();

    expect(sb.equals("")).toBe(true);
    expect(sb.equals("a")).toBe(false);
});


test("equals: one char", () => {
    const sb = new StringBuilder("a");

    expect(sb.equals("a")).toBe(true);
    expect(sb.equals("")).toBe(false);
    expect(sb.equals("ab")).toBe(false);
});


test("equals: string", () => {
    const str = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const sb = new StringBuilder(str);

    expect(sb.equals(str)).toBe(true);
    expect(sb.equals("")).toBe(false);
    expect(sb.equals("abcdefg")).toBe(false);
});

test("equals: StringBuilder empty", () => {
   const str = "";
   const a = new StringBuilder(str);
   const b = new StringBuilder(str);
   const diff = new StringBuilder("abc");

   expect(a.equals(b)).toBe(true);
   expect(b.equals(a)).toBe(true);
   expect(a.equals(a)).toBe(true);

   expect(a.equals(diff)).toBe(false);
   expect(b.equals(diff)).toBe(false);
   expect(diff.equals(a)).toBe(false);
   expect(diff.equals(b)).toBe(false);
   expect(diff.equals(diff)).toBe(true);
});

test("equals: StringBuilder one char", () => {
    const str = "a";
    const a = new StringBuilder(str);
    const b = new StringBuilder(str);
    const diff = new StringBuilder("abc1234567");

    expect(a.equals(b)).toBe(true);
    expect(b.equals(a)).toBe(true);
    expect(a.equals(a)).toBe(true);

    expect(a.equals(diff)).toBe(false);
    expect(b.equals(diff)).toBe(false);
    expect(diff.equals(a)).toBe(false);
    expect(diff.equals(b)).toBe(false);
    expect(diff.equals(diff)).toBe(true);
});

test("equals: StringBuilder string", () => {
    const str = "abc123";
    const a = new StringBuilder(str);
    const b = new StringBuilder(str);
    const diff = new StringBuilder("abc1234567");

    expect(a.equals(b)).toBe(true);
    expect(b.equals(a)).toBe(true);
    expect(a.equals(a)).toBe(true);

    expect(a.equals(diff)).toBe(false);
    expect(b.equals(diff)).toBe(false);
    expect(diff.equals(a)).toBe(false);
    expect(diff.equals(b)).toBe(false);
    expect(diff.equals(diff)).toBe(true);
});
