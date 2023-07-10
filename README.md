![logo](https://raw.githubusercontent.com/tadashibashi/js-stringbuilder/main/logo.png)

### *A dynamic string class for efficient manipulation*

- Array-like flexibility to control strings
- Automatic memory management with ability to allocate or shrink space as needed.
- Convenient API
    - negative indices behave like Python
    - extends the String interface (work in-progress)

Main repository hosted on [GitHub](https://github.com/tadashibashi/js-stringbuilder).

## Tools

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Typedoc](https://img.shields.io/badge/TypeDoc-a?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAA21BMVEUAAAD///+WAP8MNk+ZzP+WAP8MNk+ZzP+WAP8MNk+ZzP+WAP8MNk+ZzP+WAP+ZzP8MNk+WAP8MNk+ZzP+WAP8MNk+ZzP+WAP8MNk+ZzP+WAP8MNk+ZzP+WAP+ZzP8MNk+WAP8MNk+ZzP8MNk+ZzP+WAP8VM1q1TP+ubP+FB+mNA/SaCv+zR/+zVP9IHpygrP+iHf+ipP+eE/+gGP9AIpGYBf8vKXsdL2WbxP+cr/+dvP+knP+mJv+nK/+njP+pMP+phP+rfP+tOf90DtOxQ/+yXP9RG6diFL1rEcjgV5TeAAAAI3RSTlMAABAQECAgIEBAQGBgYICAgI+Pj5+fn7+/v8/Pz9/f3+/v765wmakAAADxSURBVHhehdPXUsMwEIZR4yTgFJwEAoE0nOzKTu/03nn/J4o0Yw07Yr18d5o9l/q9vX8ywCP5Pn39BWEUhQIod5WuW84AQUultQIGBE1FagYOKDSUU6NAgF9XTHXfgjBSbFGYgsdLHoznKUimDwwZf8VgQZJMly74jgF+ge5jQ8HPNegIML2tLXi/AmCAJhMDRvZMge15MtoCCOD1NgYBDO8QIRsMF4gC+FwhCmB2jyiA2dMNSuBFn0VQHfCgX0uBlz/mwFGOfLmDUxec7Du7KJ1TcFZkdlHqWNAuZgznsGfARUWYXnXQr4nb9PI5ZrxiO45CUxeYFr2zAAAAAElFTkSuQmCC&color=gray)

## Interest in StringBuilder
JavaScript strings are immutable primitives that create garbage for every unique 
sequence generated via concatenation, slicing, etc.

StringBuilder attempts to provide an efficient way to dynamically 
build JavaScript strings, friendly toward the garbage collector.

## Installation
### Build JavaScript file

with yarn:
```shell
yarn install
yarn build
```

with npm:
```shell
npm i
npm run build
```

## Example Usage

### Create a StringBuilder string

```js
// Set initial character length if you know its size ahead of time,
const stringBuilder = new StringBuilder(1000000);

// or later via `reserve`.
stringBuilder.reserve(1000000);

// Efficient for lots of appending,
for (let i = 0; i < 1000000; ++i)
    stringBuilder.append((i % 10).toString());

// then retrieve the final value.
let str = stringBuilder.str(); // "01234567890123..."
```

### Insertion and deletion via `splice`

```js
const stringBuilder = new StringBuilder("01234");

stringBuilder.splice(0, 1, "abc");

let str = stringBuilder.str(); // "0abc234"
```

### Find & replace

```js
const stringBuilder = new StringBuilder("Hello world!");

// mutates internal string
stringBuilder.replace(/world/, "StringBuilder");

console.log(stringBuilder.str()); // "Hello StringBuilder!"
```

## Documentation

Hosted here: https://code.aaronishibashi.com/js-stringbuilder


## Performance Comparison


|                         | StringBuilder                               | String                                     | Array\<string\>                            |
|-------------------------|---------------------------------------------|--------------------------------------------|--------------------------------------------|
| 500,000 char appends    | <span style="color:green">5.26ms</span>     | 22.55ms                                    | 17.65ms                                    |
| 500,000 mid-insertions  | <span style="color:green">2,465.29ms</span> | <span style="color:red">20,761.87ms</span> | 9,658.66ms                                 |
| 500,000 char prepends   | <span style="color:green">7.38ms</span>     | 25.65ms                                    | <span style="color:red">19,334.63ms</span> |



|                          | StringBuilder                            | String                                     | Array\<string\>                            |
|--------------------------|------------------------------------------|--------------------------------------------|--------------------------------------------|
| 1 million char appends   | <span style="color:green">6.90ms</span>  | 51.77ms                                    | 30.11ms                                    |
| 1 million mid-insertions | 9,735.18ms                               | <span style="color:red">72,645.41ms</span> | <span style="color:red">88,937.65ms</span> |
| 1 million char prepends  | <span style="color:green">38.18ms</span> | 52.75ms                                    | <span style="color:red">80,454.23ms</span> |


These metrics were tested in Node v20.3.1 on an ARM MacOS 13.

To run the tests on your own machine use: `yarn test:perf` or `npm run test:perf`

Please let me know if there is any performance issue on your system :-)

## Roadmap
- [x] search
- [x] incorporate regexp
- [x] documentation
- [ ] implement replaceAll
- [ ] extensive testing
