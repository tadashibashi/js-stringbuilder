const StringBuilderMinSize = 24;

/**
 * A dynamic string builder for efficient char manipulation.
 * - Efficient memory usage, light on the garbage collector.
 * - Stores data in a contiguous ArrayBuffer not unlike C++ strings or
 * Java/C# StringBuilder.
 * - All arguments representing index may use negative numbers à la Python.
 */
export class StringBuilder {
    // ===== Class variables ==================================================

    // Static decoder to convert buffer to utf-16 strings
    protected static decoder: TextDecoder;


    // ===== Instance variables ===============================================

    // Internal string buffer, JS String uses utf-16 encoding
    private _str: Uint16Array;

    // "Pointer" to end of string, since buffer is usually larger
    private _length: number;

    // Temp buffer for efficient prepending, left undefined, it
    // will go unused.
    private readonly _toPrepend?: StringBuilder;

    // These temp vars make it efficient to call str() multiple times
    // without having to regenerate string with decoder every time.
    private _temp: string;     // temp string stored for easy access
    private _isDirty: boolean; // flagged when string has changed, signals
                               // necessary update to `_temp` in calls to str()


    // ===== constructor ======================================================

    /**
     * @param strOrSize - initial string to set, or initial size of the buffer
     * @param usePrependBuffer - whether to use prepend buffer optimization;
     * default: `true`
     */
    constructor(strOrSize?: string | number, usePrependBuffer = true) {
        this._length = 0;
        this._isDirty = false;
        this._temp = "";

        if (usePrependBuffer)
            this._toPrepend = new StringBuilder(StringBuilderMinSize, false);
        else {
            // leave `this._toPrepend` unset/undefined
        }


        if (strOrSize) {
            if (typeof strOrSize === "string") {
                this._str = new Uint16Array(Math.max((strOrSize.length + 1) * 2, StringBuilderMinSize));
                this.str(strOrSize);
            } else {
                this._str = new Uint16Array(Math.max(strOrSize, StringBuilderMinSize));
            }
        } else {
            this._str = new Uint16Array(StringBuilderMinSize);
        }

        if (!StringBuilder.decoder) {
            StringBuilder.decoder = new TextDecoder("utf-16");
        }
    }


    // ===== Mutating/setter functions ========================================


    /**
     * Append characters to the end of the StringBuilder.
     * @param strOrArray - may be a string or array or characters or char codes.
     * @returns This Stringbuilder for chained calls.
     */
    append(strOrArray: string | ArrayLike<number> | ArrayLike<string>): StringBuilder {
        if (strOrArray.length === 0) return this;
        this._applyPrepend();
        this._expand(this._length + strOrArray.length);

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
     * Copy and insert a given string or array at a specified index.
     * If inserting at position 0, please use {@link StringBuilder.prepend} instead.
     * @param index - character index at which to insert –
     * negative values count backward from end: `length + index`
     * @param strOrArray - string or array to insert.
     */
    insert(index: number, strOrArray: string | ArrayLike<string> | ArrayLike<number>): StringBuilder {
        return this.splice(index, 0, strOrArray);
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
    prepend(strOrArray: string | ArrayLike<string> | ArrayLike<number>): StringBuilder {
        if (strOrArray.length === 0) return this;
        if (!this._toPrepend) { return this.insert(0, strOrArray); }

        this._toPrepend._expand(this._toPrepend._length + strOrArray.length);

        const inputLen = strOrArray.length;
        if (typeof strOrArray === "string") {
            for (let i = 0; i < inputLen; ++i) {
                this._toPrepend._str[this._toPrepend._length + i] = strOrArray.charCodeAt(inputLen-1-i);
            }
        } else {
            if (typeof strOrArray[0] === "string") {
                for (let i = 0; i < strOrArray.length; ++i) {
                    this._toPrepend._str[this._toPrepend._length + i] =
                        (strOrArray[inputLen-1-i] as string).charCodeAt(0);
                }
            } else {
                for (let i = 0; i < strOrArray.length; ++i) {
                    this._toPrepend._str[this._toPrepend._length + i] = strOrArray[inputLen-1-i] as number;
                }
            }
        }
        this._toPrepend._length += inputLen;
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
    public replace(query: string | RegExp, value: string, startAt: number = 0, end?: number) {
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
        this._applyPrepend();
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
     */
    splice(index: number, delCount: number, toAdd: string | ArrayLike<string> | ArrayLike<number> = ""): StringBuilder {
        if (delCount === 0 && toAdd.length === 0) return this;

        this._applyPrepend();

        if (delCount !== 0)
            delCount = Math.max(Math.min(this._length-index, delCount), 0);

        index = this._validateIndex(index, true);

        const newSize = this._length - delCount + toAdd.length;
        this._expand(newSize);

        // shift data
        this._str.copyWithin(index + toAdd.length,
            index + delCount, this._length);

        // write new data
        if (toAdd.length) {
            if (typeof toAdd === "string") {
                this._writeString(toAdd, index);
            } else {
                this._writeArray(toAdd, index);
            }
        }

        this._length = newSize;
        this._isDirty = true;
        return this;
    }


    /**
     * Write data into the buffer (overwrites any underlying data).
     * If write exceeds the {@link StringBuilder.bufferLength}, it will automatically expand.
     * will increase its size.
     * @param index - index to start writing to
     * @param strOrArray - string or array to write into the buffer
     */
    write(index: number, strOrArray: string | ArrayLike<string> | ArrayLike<number>): StringBuilder {
        if (strOrArray.length === 0) return this;

        this._applyPrepend();

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
     * Shrinks buffer to fit current string.
     * Intended use case: if string becomes significantly shorter and remaining buffer is huge,
     * free buffer memory to the GC.
     * @returns This StringBuilder to chain calls.
     */
    shrink() {
        this._applyPrepend();

        const newBufLength = Math.max(StringBuilderMinSize, (this._length + 1) * 2);
        if (this._str.length < newBufLength) return this;

        const temp = this._str;
        this._str = new Uint16Array(newBufLength);
        this._str.set(temp.subarray(0, this._length));

        if (this._toPrepend)
            this._toPrepend.shrink();

        return this;
    }


    /**
     * Convert the current buffer to a string.
     * There is no performance cost if string is unchanged between calls
     * to this function.
     */
    public str(): string; // interface left as function to let user know it costs to call this function.
    /**
     * Set the string.
     * @param str
     */
    public str(str: string): StringBuilder;
    public str(str?: string): string | StringBuilder {
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
            this._str = new Uint16Array((size + 1) * 2);
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
        this._applyPrepend();

        for (let i = 0; i < str.length; ++i) {
            this._str[i + index] = str.charCodeAt(i);
        }
    }



    // ===== Get / Read =======================================================


    /**
     * The length of the internal buffer in utf-16 chars.
     * To get byte size: `bufferLength * 2`
     */
    get bufferLength(): number {
        this._applyPrepend();

        return this._str.length;
    }


    /**
     * Get character at the given index.
     * For character code see {@link StringBuilder.charCodeAt}.
     * @param index - character index in string –
     * negative numbers count backward from last index: `length + index`
     * @throws RangeError on invalid index
     */
    charAt(index: number): string {
        this._applyPrepend();
        index = this._validateIndex(index);
        return String.fromCharCode(this._str[index]);
    }

    /**
     * Get character code at the given index.
     * For character string see {@link StringBuilder.charAt}.
     * @param index - character code index in string –
     * negative numbers count backward from last index: `length + index`
     * @throws RangeError on invalid index
     */
    charCodeAt(index: number): number {
        this._applyPrepend();
        index = this._validateIndex(index);
        return this._str[index];
    }

    /**
     * Check for equality.
     * @param value
     */
    equals(value: string | StringBuilder | ArrayLike<number> | ArrayLike<string>): boolean {
        this._applyPrepend();

        if (value.length !== this._length) return false;
        if (value.length === 0 && this._length === 0) return true;

        if (value instanceof StringBuilder || typeof value === "string") {
            if (Object.is(this, value)) return true;

            for (let i = 0; i < value.length; ++i) {
                if (value.charCodeAt(i) !== this._str[i])
                    return false;
            }
        } else {
            if (isNumArr(value)) {
                for (let i = 0; i < value.length; ++i) {
                    if (value[i] !== this._str[i])
                        return false;
                }
            } else {
                for (let i = 0; i < value.length; ++i) {
                    if (value[i].charCodeAt(0) !== this._str[i])
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
     * @param context  - optional context to bind `this` to.
     * @returns This StringBuilder to chain calls.
     * @example ```js
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
            if (callback(String.fromCharCode(this._str[i]), i, this) === -1)
                break;
        }

        return this;
    }


    /**
     * @description Length of the string.
     * For buffer length, see {@link StringBuilder.bufferLength}
     */
    get length(): number {
        this._applyPrepend();
        return this._length;
    }


    /**
     * Get a substring from the StringBuilder.
     * @param start - index at which substring will begin.
     * @param end - one past the last index to be copied. If not specified,
     * it will automatically be set to `length`. If larger than `length`, it
     * will be set to `length`.
     * @throws RangeError if `start` is out of range.
     */
    substring(start: number, end?: number): string {
        this._applyPrepend();

        try {
            start = this._validateIndex(start);
        } catch(err) {
            console.error("[StringBuilder.substring: start]", err);
            throw err;
        }


        if (end === undefined) {
            end = this._length;
        } else {
            if (end > this._length) end = this._length;

            try {
                end = this._validateIndex(end, true);
            } catch(err) {
                console.error("[StringBuilder.substring: end]", err);
                throw err;
            }
        }

        return StringBuilder.decoder.decode(
            this._str.subarray(start, end));
    }


    /**
     * Split string into an array of individual characters
     */
    toArray(): Array<string> {
        this._applyPrepend();

        const ret = new Array<string>(this.length);
        const length = this._length;

        for (let i = 0; i < length; ++i) {
            ret[i] = String.fromCharCode(this._str[i]);
        }

        return ret;
    }


    /**
     * Implemented to convert to StringBuilder to string in type-coerced contexts.
     * In any case, please call {@link StringBuilder.str} instead.
     * @example ```js
     * const sb = new StringBuilder("abc");
     * console.log(sb) // "abc"
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
        if (this._length === 0) return -1;

        // validate `startAt`
        try {
            startAt = this._validateIndex(startAt, false);
        } catch(err: unknown) {
            console.error("[StringBuilder#search: startAt]", err);
            throw err;
        }

        // Differing behavior for `string` & `RegExp`
        if (typeof query === "string") {
            // string behavior

            // validation checks
            if (query.length === 0 || this._length === 0) return -1;

            if (end === undefined) {
                end = this._length - query.length + 1;
            } else {
                end = Math.min(end, this._length - query.length + 1);
            }

            try {
                end = this._validateIndex(end, true);
            } catch(err: unknown) {
                console.error("[StringBuilder#search: end]", err);
                throw err;
            }

            // manually check for matches
            for (let i = startAt; i < end; ++i) {
                let match = true;
                for (let j = 0; j < query.length; ++j) {
                    if (this._str[i + j] !== query.charCodeAt(j)) {
                        match = false;
                        break;
                    }
                }

                if (match)
                    return i;
            }

            // no match was found...
            return -1;
        } else {
            // RegExp behavior

            // set and validate `end`
            if (end === undefined)
                end = this._length;
            else {
                try {
                    end = this._validateIndex(end, true);
                } catch (e) {
                    console.error("[StringBuilder.search: end]", e);
                    throw e;
                }
            }

            // directly use `String.search`
            const res = this.substring(startAt, end).search(query);
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
            index += this._length;

        if (index >= this._length + (allowEnd ? 1 : 0) || index < 0)
            throw RangeError(`StringBuilder index ${index} is out of range.`);
        return index;
    }
}
