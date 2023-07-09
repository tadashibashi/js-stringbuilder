# JavaScript StringBuilder

A dynamic string class for efficient manipulation
- Array-like flexibility to control strings
- Automatic memory management with ability to allocate or shrink space as needed.
- Convenient API
    - negative indices behave like Python
    - extends the String interface (work in-progress)

## Why
JavaScript strings are immutable primitives that create garbage for every unique 
sequence generated via concatenation, slicing, etc.

StringBuilder attempts to provide an efficient way to dynamically 
build JavaScript strings, friendly toward the garbage collector.

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

## Performance Comparison

|                        | StringBuilder                              | String                                    | Array\<string\>                           |
|------------------------|--------------------------------------------|-------------------------------------------|-------------------------------------------|
| 500,000 char appends   | <span style="color:green">5.26ms</span>    | 22.55ms                                   | 17.65ms                                   |
| 500,000 mid-insertions | <span style="color:green">2465.29ms</span> | <span style="color:red">20761.87ms</span> | 9658.66ms                                 |
| 500,000 char prepends  | <span style="color:green">7.38ms</span>    | 25.65ms                                   | <span style="color:red">19334.63ms</span> |

These metrics were tested in Node v20.3.1 on an ARM MacOS 13.

Please feel free to run the tests on your own machine via `yarn test` or `npm run test`

## To-do
- [x] search
- [x] incorporate regexp
- [ ] documentation
