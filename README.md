# JavaScript StringBuilder

A dynamic string class for efficient manipulation

## Why
JavaScript strings are immutable primitives that create garbage for every unique sequence generated via assignment, concatenation, slicing, etc.

This StringBuilder class attempts to provide an efficient solution, light on the 
garbage collector for dynamically building JavaScript strings. 

Under the hood it uses a contiguous block of memory
not unlike C++ strings, or C#/Java StringBuilder.

## Example Usage

Create a StringBuilder and retrieve its inner string.
```js
// You can set the initial buffer size if you know its size ahead of time...
const stringBuilder = new StringBuilder(1000000);

// or later via `reserve`.
stringBuilder.reserve(1000000);

// Efficient for lots of appending...
for (let i = 0; i < 1000000; ++i)
    stringBuilder.append((i % 10).toString());

// then retrieve the final value.
let str = stringBuilder.str(); // "01234567890123..."
```

Quick insertion and deletion via `splice`.

```js
const stringBuilder = new StringBuilder("01234");

stringBuilder.splice(0, 1, "abc");

let str = stringBuilder.str(); // "0abc234"
```

## Known Issues

In the case of prepending a string (insertion at index 0), 
StringBuilder is slower compared to JavaScript strings due to a trade-off of 
using a contiguous block of memory. Namely, that we must shift the entire 
block after the point of insertion every time new data is inserted.

On the other hand, StringBuilder is significantly faster at other
operations, such as mid-string insertion and appending. It also does not
generate as much garbage, especially if string size is anticipated in advance.

## Performance Comparison

|                        | StringBuilder                              | String                                    | Array\<string\>                           |
|------------------------|--------------------------------------------|-------------------------------------------|-------------------------------------------|
| 500,000 char appends   | <span style="color:green">3.98ms</span>    | 6.07ms                                    | 24.86ms                                   |
| 500,000 mid-insertions | <span style="color:green">2462.58ms</span> | <span style="color:red">20876.14ms</span> | 9699.25ms                                 |
| 500,000 char prepends  | 4796.53ms                                  | <span style="color:green">25.91ms</span>  | <span style="color:red">19722.63ms</span> |

These metrics were tested in Node v20.3.1 on an ARM MacOS 13.

Please feel free to run the tests on your own machine via `yarn test` or `npm run test`
