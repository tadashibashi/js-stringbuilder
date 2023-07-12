export const StringBuilderMinSize: number = 24;

/**
 * A dynamic string builder for efficient char manipulation.
 * - Stores data in a contiguous ArrayBuffer not unlike C++ strings or
 * Java/C# StringBuilder.
 * - Provides optimization buffer for rapid repetitive prepends
 * - All arguments representing index may use negative numbers like in Python.
 */
export class StringBuilder {
    // ===== Class variables ==================================================

    /**
     * Static decoder to convert buffer to utf-16 strings
     */
    protected static decoder: TextDecoder;


    // ===== Instance variables ===============================================

    /**
     * Internal string buffer, JS String uses utf-16 encoding
     */
    private _str: Uint16Array | Uint8Array;

    private readonly _type: Uint8ArrayConstructor | Uint16ArrayConstructor;

    /**
     * "Pointer" to end of string, since buffer is usually larger
     */
    private _length: number;

    /**
     * Temp buffer for efficient prepending, left undefined, it
     * will go unused.
     */
    private readonly _toPrepend?: StringBuilder;

    // These temp vars make it efficient to call str() multiple times
    // without having to convert the string with decoder every time.
    // May remove later, since it adds complexity to the code...
    /**
     * Temporary string stored for quick reaccess.
     */
    private _temp: string;

    /**
     * Flagged when string has changed, signals necessary update to
     * `_temp` in calls to str()
     */
    private _isDirty: boolean;


    // ===== constructor ======================================================

    /**
     * @param strOrSize - initial string to set, or initial size of the buffer
     * @param usePrependBuffer - whether to use prepend buffer optimization;
     * @param type - type of buffer to store
     * default: `true`
     */
    constructor(strOrSize: string | number = StringBuilderMinSize, type: Uint16ArrayConstructor | Uint8ArrayConstructor = Uint16Array, usePrependBuffer = true) {
        this._length = 0;
        this._isDirty = false;
        this._temp = "";
        this._type = type;

        if (usePrependBuffer)
            this._toPrepend = new StringBuilder(StringBuilderMinSize, type, false);
        else {
            // leave `this._toPrepend` unset/undefined
        }


        if (typeof strOrSize === "string") { // set the string
            this._str = new this._type(Math.max((strOrSize.length + 1) * 2, StringBuilderMinSize));
            this.str(strOrSize);
        } else {                             // set the size
            this._str = new this._type(Math.max(strOrSize, StringBuilderMinSize));
        }


        // init static decoder if not yet created
        if (!StringBuilder.decoder) {
            StringBuilder.decoder = new TextDecoder(type === Uint16Array ? "utf-16" : "utf-8");
        }
    }


    // ===== Mutating/setter functions ========================================


    /**
     * Append characters to the end of the StringBuilder.
     * @param strOrArray - may be a string or array or characters or char codes.
     * @returns This Stringbuilder for chained calls.
     */
    append(strOrArray: string | number | ArrayLike<number> | ArrayLike<string>): StringBuilder {
        if (typeof strOrArray === "number") {

            this._expand(this.length + 1);
            this._str[this._length] = strOrArray;

            ++this._length;
            this._isDirty = true;
            return this;
        }

        if (strOrArray.length === 0) return this;

        this._expand(this.length + strOrArray.length);

        if (typeof strOrArray === "string") {
            this._writeString(strOrArray, this._length);
        } else {
            this._writeArray(strOrArray, this._length);
        }

        this._length += strOrArray.length;
        this._isDirty = true;
        return this;
    }


    /**
     * Clear the string, effectively setting its length to 0.
     * @returns This StringBuilder to chain calls.
     */
    public clear() {
        if (this._length !== 0) {
            this._length = 0;

            this._isDirty = false;
            this._temp = "";
        }

        return this;
    }


    /**
     * Copy and insert a given string or array at a specified index.
     * @param index - character index at which to insert –
     * negative values count backward from end: `length + index`
     * @param strOrArray - string or array to insert.
     */
    insert(index: number, strOrArray: string | number | ArrayLike<string> | ArrayLike<number>): StringBuilder {
        if (index === 0 && this._toPrepend)
            this.prepend(strOrArray);
        else
            this.splice(index, 0, strOrArray);

        return this;
    }


    /**
     * Calls {@link String.match} on the current string.
     * @param query
     */
    match(query: string | RegExp) {
        return this.str().match(query);
    }


    /**
     * Prepend a string to the beginning of the StringBuilder.
     * @param strOrArray - string or array to prepend
     * @returns this StringBuilder instance for chained calls
     */
    prepend(strOrArray: string | number | ArrayLike<string> | ArrayLike<number>): StringBuilder {
        let objLength: number;
        if (typeof strOrArray !== "number") {
            if (strOrArray.length === 0) return this;
            objLength = strOrArray.length;


        } else {
            objLength = 1;
        }

        if (!this._toPrepend) { return this.insert(0, strOrArray); }

        this._toPrepend._expand(this._toPrepend._length + objLength);

        if (typeof strOrArray === "string") {
            for (let i = 0; i < objLength; ++i) {
                this._toPrepend._str[this._toPrepend._length + i] = strOrArray.charCodeAt(objLength-1-i);
            }
        } else if (typeof strOrArray === "number") {
            this._toPrepend._str[this._toPrepend._length] = strOrArray;
        } else {
            if (typeof strOrArray[0] === "string") {
                for (let i = 0; i < objLength; ++i) {
                    this._toPrepend._str[this._toPrepend._length + i] =
                        (strOrArray[objLength-1-i] as string).charCodeAt(0);
                }
            } else {
                for (let i = 0; i < strOrArray.length; ++i) {
                    this._toPrepend._str[this._toPrepend._length + i] = strOrArray[objLength-1-i] as number;
                }
            }
        }

        this._toPrepend._length += objLength;
        this._isDirty = true;
        return this;
    }


    /**
     * Replace first occurrence of a query with a string
     * @param query - string or RegExp to search for.
     * @param value - replace occurrence of found query with this string value.
     * @param startAt - index to start searching at.
     * @param end     - index to search until (exclusively, does not search this index).
     * @returns This StringBuilder to chain calls.
     * @throws RangeError if startAt is out of range.
     */
    replace(query: string | RegExp, value: string, startAt: number = 0, end?: number) {
        this._applyPrepend();

        if (typeof query === "string") {
            if (query.length === 0) return this;

            const idx = this.search(query, startAt, end);
            if (idx === -1)
                return this;

            const newLength = this._length + value.length - query.length

            this._expand(newLength);
            this._str.copyWithin(idx + value.length - query.length,
                idx + query.length, this._length);

            for (let i = 0; i < value.length; ++i) {
                this._str[i + idx] = value.charCodeAt(i);
            }

            this._length = newLength;
            this._isDirty = true;
        } else {
            this.str(this.str().replace(query, value));
        }

        return this;
    }


    /**
     * Ensures internal buffer will fit at least `size` number of chars.
     * This helps prevent dynamic size increase if the intended string length
     * is known in advance.
     * @param size - number of characters to fit
     * @returns This StringBuilder instance for chained calls
     */
    reserve(size: number): StringBuilder {
        this._applyPrepend(); // <- not sure if we should remove this?
        this._expand(size);
        return this;
    }


    /**
     * Removes characters, and optionally splice some into the StringBuilder.
     * @param index - index of buffer from which to splice
     * @param delCount - number of chars to delete, any value higher than
     * `length-index` will simply delete all chars from index until end.
     * Specify `0` if you only intend on inserting.
     * @param toAdd - any string or array of char/codes to add
     * @returns this StringBuilder instance for chained calls.
     * Delete indices
     * ```js
     * const sb = new StringBuilder("01234");
     *
     * sb.splice(2, 1);
     *
     * console.log(sb); // "0134"
     * ```
     *
     * Splice in indices
     * ```js
     * const sb = new StringBuilder("01234");
     *
     * sb.splice(2, 0, "abc");
     *
     * console.log(sb); // "01abc234"
     * ```
     */
    splice(index: number, delCount: number, toAdd: string | number | ArrayLike<string> | ArrayLike<number> = ""): StringBuilder {
        this._applyPrepend(); // TODO: optimize so that we don't need this call

        const objLength = typeof toAdd === "number" ? 1 : toAdd.length;

        if (delCount !== 0)
            delCount = Math.max(Math.min(this._length-index, delCount), 0);

        index = this._validateIndex(index, true);

        const newSize = this._length - delCount + objLength;
        this._expand(newSize);

        // shift data
        this._str.copyWithin(index + objLength,
            index + delCount, this._length);

        // write new data
        if (objLength) {
            switch(typeof toAdd) {
                case "string":
                    this._writeString(toAdd, index);
                    break;
                case "number":
                    this._str[index] = toAdd;
                    break;
                default:
                    this._writeArray(toAdd, index);
                    break;
            }
        }

        this._length = newSize;
        this._isDirty = true;
        return this;
    }


    /**
     * Shrinks buffer to fit current string.
     * Intended use case: if string becomes significantly shorter and remaining buffer is huge,
     * free buffer memory to the GC.
     * @returns This StringBuilder to chain calls.
     */
    shrink() {
        if (this._toPrepend)
            this._toPrepend.shrink();

        // Use length getter to include prepend buffer length.
        // We don't want the next call to str to cause reallocation
        const newBufLength = Math.max(StringBuilderMinSize, (this.length + 1) * 2);
        if (this._str.length < newBufLength) return this;

        const temp = this._str;
        this._str = new this._type(newBufLength);
        this._str.set(temp.subarray(0, this._length));

        return this;
    }


    /**
     * Convert the current buffer to a string.
     * There is no performance cost if string is unchanged between calls
     * to this function.
     */
    str(): string; // interface left as function to let user know it costs to call this function.
    /**
     * Set the string.
     * @param str
     */
    str(str: string): StringBuilder;
    str(str?: string): string | StringBuilder {
        if (str === undefined) {
            this._applyPrepend();
            // Get inner string
            if (this._isDirty) {
                this._temp = StringBuilder.decoder.decode(
                    this._str.subarray(0, this._length));
            }
            return this._temp;
        } else {
            // Set to string
            this._expand(str.length);
            for (let i = 0; i < str.length; ++i) {
                this._str[i] = str.charCodeAt(i);
            }
            this._length = str.length;

            if (this._toPrepend)
                this._toPrepend.clear();

            this._temp = str; // okay to set here since str primitive is most likely already somewhere in memory.
            this._isDirty = false;
            return this;
        }
    }


    /**
     * Write data directly into the buffer, overwriting any underlying data.
     * If write exceeds the {@link StringBuilder.bufferLength}, it will automatically expand.
     * @param index - index to start writing to
     * @param strOrArray - string or array to write into the buffer
     * @returns This StringBuilder for chained calls.
     *
     * Simple write
     * ```js
     * const sb = new StringBuilder("012345");
     *
     * sb.write(2, "abc");
     *
     * console.log(sb); // "01abc5"
     * ```
     *
     * Overflow is okay
     * ```js
     * const sb = new StringBuilder("012345");
     *
     * sb.write(5, "abc");
     *
     * console.log(sb); // "01234abc"
     * ```
     */
    write(index: number, strOrArray: string | ArrayLike<string> | ArrayLike<number>): StringBuilder {
        if (strOrArray.length === 0) return this;

        this._applyPrepend(); // TODO: Write into prepend buffer if necessary, then remove this call to _applyPrepend

        const newLength = Math.max(index + strOrArray.length, this._length);
        this._expand(newLength);

        if (typeof strOrArray === "string") {
            this._writeString(strOrArray, index);
        } else {
            this._writeArray(strOrArray, index);
        }

        this._length = newLength;
        this._isDirty = true;
        return this;
    }


    /**
     * Take anything in the prepend buffer and apply it to the main buffer.
     * Empties prepend buffer after operation is performed.
     */
    private _applyPrepend() {
        if (!this._toPrepend) return;

        if (this._toPrepend._length) {
            this._expand(this._toPrepend._length + this._length);
            this._str.copyWithin(this._toPrepend._length, 0, this._length);

            for (let i = 0; i < this._toPrepend._length; ++i) {
                this._str[i] = this._toPrepend._str[this._toPrepend._length-1-i];
            }

            this._length += this._toPrepend._length;

            this._isDirty = true;
            this._toPrepend.clear();
        }
    }


    /**
     * Expand the buffer to fit at least `size` indices.
     * @param size - min number of utf-16 chars to hold.
     */
    private _expand(size: number) {
        if (size > this._str.length) {
            const temp = this._str;
            this._str = new this._type((size + 1) * 2);
            this._str.set(temp);
        }
    }


    /**
     * Copy an array into the buffer at given start index.
     * Assumes buffer is large enough. Overwrites information at indices.
     * @param array - array to copy, containing charCode or single char per item.
     * @param start - starting index of this StringBuffer at which to begin copying.
     */
    private _writeArray(array: ArrayLike<number> | ArrayLike<string>, start: number) {
        if (typeof array[0] === "number") {
            this._str.set(array as ArrayLike<number>, start);
        } else {
            for (let i = 0; i < array.length; ++i) {
                this._str[i + start] = (array[i] as string).charCodeAt(0);
            }
        }
    }


    /**
     * Copy a string into the buffer at a given index.
     * Assumes buffer is large enough, overwriting information at indices.
     * @param str - string to copy.
     * @param index - index at which to start copying string.
     */
    private _writeString(str: string, index: number) {
        for (let i = 0; i < str.length; ++i) {
            this._str[i + index] = str.charCodeAt(i);
        }
    }



    // ===== Get / Read =======================================================

    *[Symbol.iterator]() {
        for (let i = 0; i < this._length; ++i) {
            yield this.charAt(i);
        }
    }

    get buffer() {
        this._applyPrepend();
        return this._str.subarray(0, this._length);
    }

    /**
     * The length of the internal buffer in chars.
     */
    get bufferLength(): number {
        return this._str.length + (this._toPrepend ? this._toPrepend._str.length : 0);
    }

    get bufferBytes(): number {
        return this.bufferLength * this.bytesPerChar;
    }

    get bytesPerChar(): number {
        return this._type === Uint16Array ? 2 : 1;
    }


    /**
     * Get character at the given index.
     * For character code see {@link StringBuilder.charCodeAt}.
     * @param index - character index in string –
     * negative numbers count backward from last index: `length + index`
     * @returns The character at the index
     * @throws RangeError on invalid index
     */
    charAt(index: number): string {
        index = this._validateIndex(index);

        if (this._toPrepend) {
            return (index < this._toPrepend._length) ?
                this._toPrepend.charAt(this._toPrepend._length-1-index) :
                String.fromCharCode(this._str[index - this._toPrepend._length]);
        } else {
            return String.fromCharCode(this._str[index]);
        }
    }

    /**
     * Get character code at the given index.
     * For character string see {@link StringBuilder.charAt}.
     * @param index - character code index in string –
     * negative numbers count backward from last index: `length + index`
     * @throws RangeError on invalid index
     */
    charCodeAt(index: number): number {
        index = this._validateIndex(index);

        if (this._toPrepend) {
            return (index < this._toPrepend._length) ?
                this._toPrepend._str[this._toPrepend._length-1-index] :
                this._str[index - this._toPrepend._length];
        } else {
            return this._str[index];
        }
    }

    /**
     * Check for equality.
     * @param value
     */
    equals(value: string | StringBuilder | ArrayLike<number> | ArrayLike<string>): boolean {

        if (value.length !== this.length) return false;
        if (value.length === 0 && this.length === 0) return true;

        if (value instanceof StringBuilder || typeof value === "string") {
            if (Object.is(this, value)) return true;

            for (let i = 0; i < value.length; ++i) {
                if (value.charCodeAt(i) !== this.charCodeAt(i))
                    return false;
            }
        } else {
            if (isNumArr(value)) {
                for (let i = 0; i < value.length; ++i) {
                    if (value[i] !== this.charCodeAt(i))
                        return false;
                }
            } else {
                for (let i = 0; i < value.length; ++i) {
                    if (value[i].charCodeAt(0) !== this.charCodeAt(i))
                        return false;
                }
            }
        }

        return true;

        function isNumArr(arr: ArrayLike<unknown>): arr is ArrayLike<number> {
            return (typeof arr[0] === "number");
        }
    }


    /**
     * Iterates over a callback for each character in the string.
     * @param callback - called for each character, if it returns -1, it will break the loop.
     * @param context  - optional context to bind `this` to; assumes callback is a Function
     * @returns This StringBuilder to chain calls.
     * ```js
     * stringBuilder.forEach(function(char, i) {
     *      if (char === 'q')
     *          return -1; // break from loop
     *
     *      // ... do something
     *
     * }, myObj); // myObj becomes `this`
     * ```
     */
    forEach(callback: (char: string, index?: number, sb?: StringBuilder) => unknown, context?: unknown) {
        if (context) {
            callback = callback.bind(context);
        }

        for (let i = 0; i < this._length; ++i) {
            if (callback(this.charAt(i), i, this) === -1)
                break;
        }

        return this;
    }


    /**
     * @description Length of the string.
     * For buffer length, see {@link StringBuilder.bufferLength}
     */
    get length(): number {
        return this._length + (this._toPrepend ? this._toPrepend._length : 0);
    }


    /**
     * Get a substring from the StringBuilder.
     * @param start - index at which substring will begin.
     * @param end - one past the last index to be copied. If not specified,
     * it will automatically be set to `length`. If larger than `length`, it
     * will be set to `length`.
     *
     * @returns Substring slice copy.
     * @throws RangeError if `start` is out of range.
     * ```js
     * const sb = new StringBuilder("0123456789");
     *
     * let sub = sb.substring(2, 5);
     *
     * console.log(sub); // "234"
     * ```
     */
    substring(start: number, end?: number): string {
        this._applyPrepend();

        try {
            start = this._validateIndex(start);
        } catch(err) {
            if (err instanceof RangeError)
                console.error("[StringBuilder.substring: start]", err.message);
            throw err;
        }


        if (end === undefined) {
            end = this._length;
        } else {
            if (end > this._length) end = this._length;

            try {
                end = this._validateIndex(end, true);
            } catch(err) {
                if (err instanceof RangeError)
                    console.error("[StringBuilder.substring: end]", err.message);
                throw err;
            }
        }

        return StringBuilder.decoder.decode(
            this._str.subarray(start, end));
    }


    /**
     * Split string into an array of individual characters
     * @returns New array of characters. Warning: creates garbage,
     * use sparingly.
     * ```js
     * const sb = new StringBuilder("012345");
     *
     * const arr = sb.toArray(); // ["0", "1", "2", "3", "4", "5"];
     * ```
     */
    toArray(): Array<string> {
        const ret = new Array<string>(this.length);
        const length = this._length;

        for (let i = 0; i < length; ++i) {
            ret[i] = this.charAt(i);
        }

        return ret;
    }


    /**
     * Implemented to convert to StringBuilder to string in type-coerced contexts.
     * In any case, please call {@link StringBuilder.str} instead.
     * ```js
     * const sb = new StringBuilder("abc");
     *
     * // Equivalent evaluations
     * conosle.log(sb.toString()); // "abc"
     * console.log(sb)             // "abc"
     * ```
     */
    toString(): string {
        return this.str();
    }


    /**
     * Get the index of the first occurrence of a string or RegExp.
     * @param query - query to find
     * @param startAt - start position to search from. Default: 0
     * @param end - index to search up to (exclusively, does not count this index).
     * Left unspecified, the function will search until the end of the string.
     * @returns index of the first occurrence of `query` or `-1` if it does not exist.
     * @throws RangeError if `startingAt` is out of range; `end` may exceed range.
     */
    search(query: RegExp | string, startAt = 0, end?: number): number {
        if (this.length === 0) return -1;

        // validate `startAt`
        try {
            startAt = this._validateIndex(startAt, false);
        } catch(err: unknown) {
            if (err instanceof RangeError)
                console.error("[StringBuilder#search: startAt]", err.message);
            throw err;
        }

        // Differing behavior for `string` & `RegExp`
        if (typeof query === "string") {   // String

            // validation checks
            if (query.length === 0) return -1;

            // set and validate `end`
            if (end === undefined) {
                end = this.length - query.length + 1;
            } else {
                end = Math.min(end, this.length - query.length + 1);
            }

            try {
                end = this._validateIndex(end, true);
            } catch(err: unknown) {
                if (err instanceof RangeError)
                    console.error("[StringBuilder#search: end]", err.message);
                throw err;
            }

            // manually check for matches
            for (let i = startAt; i < end; ++i) {
                let match = true;
                for (let j = 0; j < query.length; ++j) {
                    if (this.charCodeAt(i + j) !== query.charCodeAt(j)) {
                        match = false;
                        break;
                    }
                }

                if (match)
                    return i;
            }

            // no match was found...
            return -1;
        } else {          // RegExp behavior

            // set and validate `end`
            if (end === undefined)
                end = this.length;
            else {
                try {
                    end = this._validateIndex(end, true);
                } catch (err) {
                    if (err instanceof RangeError)
                        console.error("[StringBuilder.search: end]", err.message);
                    throw err;
                }
            }

            // directly use `String.search`
            const res = this.substring(startAt, end).search(query); // substring calls _applyPrepend
            return res === -1 ? -1 : res + startAt;
        }
    }


    /**
     * Helper to validate and properly set negative indices.
     * Only use on public API, since it is more efficient to use direct indices privately.
     * @param index - index to validate
     * @param allowEnd - whether to allow the last index (default: false)
     * @throws RangeError if index is out of range.
     */
    private _validateIndex(index: number, allowEnd = false): number {
        if (index < 0)
            index += this.length;

        if (index >= this.length + (allowEnd ? 1 : 0) || index < 0)
            throw RangeError(`index ${index} is out of range.`);
        return index;
    }
}

export default StringBuilder;
