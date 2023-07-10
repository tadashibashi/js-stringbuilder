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
     * @param str - initial string to copy into buffer
     */
    constructor(str?: string);
    /**
     * @param size - initial size of the buffer
     * @param __usePrependBuffer - for library use only
     */
    constructor(size?: number, __usePrependBuffer?: boolean);
    constructor(strOrSize?: string | number, __usePrependBuffer: boolean = true) {
        this._length = 0;
        this._isDirty = false;
        this._temp = "";

        if (__usePrependBuffer)
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
     * Ensures buffer will fit at least `size` number of chars.
     * This prevents dynamic size increase if the necessary string length
     * is known in advance.
     * @param size - number of chars to fit
     * @returns this StringBuilder instance for chained calls
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
     * Prepend a sequence of char codes to the StringBuilder.
     * Please prefer to use this function rather than `insert(0, charCodes)`
     * @param charCodes - array of char codes to prepend
     * @returns this StringBuilder instance for chained calls
     */
    prepend(charCodes: ArrayLike<number>): StringBuilder;
    /**
     * Prepend a sequence of chars to the StringBuilder.
     * Please prefer to use this function rather than `insert(0, chars)`
     * @param chars - array of chars to prepend
     * @returns this StringBuilder instance for chained calls
     */
    prepend(chars: ArrayLike<string>): StringBuilder;
    /**
     * Prepend a string to the StringBuilder.
     * Please prefer to use this function rather than `insert(0, str)`
     * @param str - string to prepend
     * @returns this StringBuilder instance for chained calls
     */
    prepend(str: string): StringBuilder;
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
     * Insert an array of char codes within the StringBuilder.
     * Most efficient type to copy since strings must be converted into numbers first.
     * @param index - index within StringBuilder at which to insert char codes.
     * @param charCodes - array to copy.
     */
    insert(index: number, charCodes: ArrayLike<number>): StringBuilder;
    /**
     * Insert an array of char codes within the StringBuilder.
     * @param index - index within StringBuilder at which to insert chars.
     * @param chars - array to copy.
     */
    insert(index: number, chars: ArrayLike<string>): StringBuilder;
    /**
     * Insert a string within the StringBuilder.
     * @param index - index within StringBuilder at which to insert chars.
     * @param str - string to copy.
     */
    insert(index: number, str: string): StringBuilder;
    insert(index: number, strOrArray: string | ArrayLike<string> | ArrayLike<number>): StringBuilder;
    insert(index: number, strOrArray: string | ArrayLike<string> | ArrayLike<number>): StringBuilder {
        return this.splice(index, 0, strOrArray);
    }

    /**
     * Write into the buffer, overwriting any underlying data. Writes beyond StringBuilder's length
     * will increase its size.
     * @param index - index to start writing to
     * @param str - string to write into the buffer
     */
    write(index: number, str: string): StringBuilder;
    /**
     * Write into the buffer, overwriting any underlying data. Writes beyond StringBuilder's length
     * will increase its size.
     * @param index - index to start writing to
     * @param charCodes - array to write into the buffer
     */
    write(index: number, charCodes: ArrayLike<number>): StringBuilder;
    /**
     * Write into the buffer, overwriting any underlying data. Writes beyond StringBuilder's length
     * will increase its size.
     * @param index - index to start writing to
     * @param chars - array to write into the buffer
     */
    write(index: number, chars: ArrayLike<string>): StringBuilder;
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

    public replace(query: string | RegExp, value: string) {
        this._applyPrepend();

        if (typeof query === "string") {
            if (query.length === 0) return this;

            const idx = this.search(query);
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
     * Shrinks buffer to fit current string.
     * Intended use case: if string becomes significantly shorter and remaining buffer is huge,
     * free buffer memory to the GC.
     */
    public shrink() {
        this._applyPrepend();

        const newBufLength = Math.max(StringBuilderMinSize, (this._length + 1) * 2);
        if (this._str.length < newBufLength) return this;

        const temp = this._str;
        this._str = new Uint16Array(newBufLength);
        this._str.set(temp.subarray(0, this._length));

        return this;
    }

    public match(query: string | RegExp) {
        return this.str().match(query);
    }


    /**
     * Get the current buffer as a string.
     */
    public str(): string; // interface left as function to let user know it costs to call this function.
    /**
     * Set the string.
     * @param str - string to set
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
     * Append a string to the end of the StringBuilder.
     * @param str - string to add.
     */
    append(str: string): StringBuilder;
    /**
     * Append an array of utf-16 char codes to the end of the StringBuilder.
     * @param charCodes - array of single char codes to add.
     */
    append(charCodes: ArrayLike<number>): StringBuilder;
    /**
     * Append an array of chars to the end of the StringBuilder.
     * @param chars - array of single char strings to add.
     * Multi-char strings are okay, but only the first will be processed.
     */
    append(chars: ArrayLike<string>): StringBuilder;
    public append(str: string | ArrayLike<number> | ArrayLike<string>): StringBuilder {
        if (str.length === 0) return this;
        this._applyPrepend();
        this._expand(this._length + str.length);

        if (typeof str === "string") {
            this._writeString(str, this._length);
        } else {
            this._writeArray(str, this._length);
        }

        this._length += str.length;
        this._isDirty = true;
        return this;
    }

    /**
     * Clear the string, effectively setting its length to 0.
     */
    public clear() {
        if (this._length !== 0) {
            this._length = 0;

            this._isDirty = false;
            this._temp = "";
        }
    }


    /**
     * Copy an array into the buffer at given start index.
     * Assumes buffer is large enough. Overwrites information at indices.
     * @param array - array to copy, containing charCode or single char per item.
     * @param start - starting index of this StringBuffer at which to begin copying.
     * @private
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
     * @private
     */
    private _writeString(str: string, index: number) {
        this._applyPrepend();

        for (let i = 0; i < str.length; ++i) {
            this._str[i + index] = str.charCodeAt(i);
        }
    }

    /**
     * Expand the buffer to fit at least `size` indices.
     * @param size - min number of utf-16 chars to hold.
     * @private
     */
    private _expand(size: number) {
        if (size > this._str.length) {
            const temp = this._str;
            this._str = new Uint16Array((size + 1) * 2);
            this._str.set(temp);
        }
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

    // ===== Get / Read =======================================================

    /**
     * Length of the represented string (not the buffer).
     * For buffer length, use `StringBuilder#__buffer.length`
     */
    get length(): number {
        this._applyPrepend();
        return this._length;
    }

    /**
     * Gets character at the given index.
     * Negative numbers count from last index: length + index
     * @param index
     * @throws {RangeError} on invalid index
     */
    charAt(index: number): string {
        this._applyPrepend();
        index = this._validateIndex(index);
        return String.fromCharCode(this._str[index]);
    }

    /**
     * Gets character code at the given index.
     * Negative numbers count from last index: length + index
     * @param index
     * @throws {RangeError} on invalid index
     */
    charCodeAt(index: number): number {
        this._applyPrepend();
        index = this._validateIndex(index);
        return this._str[index];
    }

    /**
     * Check for equality
     * @param str
     */
    equals(str: string | StringBuilder): boolean {
        this._applyPrepend();

        if (str.length !== this.length) return false;
        if (Object.is(this, str)) return true;

        for (let i = 0; i < str.length; ++i) {
            if (str.charCodeAt(i) !== this._str[i])
                return false;
        }

        return true;
    }


    toString(): string {
        return this.str();
    }

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
     * Get a substring from the StringBuilder.
     * @param start - index at which substring will begin.
     * @param end - one past the last index to be copied. If not specified,
     * it will automatically be set to `length`. If larger than `length`, it
     * will be set to `length`.
     * @throws {RangeError} if `start` is out of range.
     */
    substring(start: number, end?: number): string {
        this._applyPrepend();

        start = this._validateIndex(start);

        if (end === undefined) {
            end = this._length;
        } else {
            if (end > this._length) end = this._length;

            end = this._validateIndex(end, true);
        }

        return StringBuilder.decoder.decode(
            this._str.subarray(start, end));
    }

    /**
     * The size of the internal buffer in utf-16 chars.
     * (Actual size in bytes is twice this number)
     */
    get bufferLength(): number {
        this._applyPrepend();

        return this._str.length;
    }

    /**
     * Get the index of the first occurrence of a string or RegExp.
     * @param query - query to find
     * @param startAt - start position to search from. Default: 0
     * @param end - optional end index to search until. Does not this search index.
     * Default: reaches end of string.
     * @returns index of the first occurrence or -1 if it does not exist.
     * @throws {RangeError} if `startingAt` is out of range. `end` may exceed range.
     */
    search(query: RegExp | string, startAt: number = 0, end?: number): number {
        if (this._length === 0) return -1;

        try {
            startAt = this._validateIndex(startAt, false);
        } catch(err: unknown) {
            console.error("[StringBuilder#search: startAt]", err);
            throw err;
        }

        if (typeof query === "string") {
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

            return -1;
        } else {
            if (end === undefined)
                end = this._length;
            else
                end = this._validateIndex(end, true);

            const res = this.substring(startAt, end).search(query);

            return res === -1 ? -1 : res + startAt;
        }
    }


    /**
     * Helper to validate and properly set negative indices.
     * Only use on public API, since it is more efficient to use direct indices privately.
     * @param index
     * @param allowEnd - whether to allow the last index (default: false)
     * @throws {RangeError} if index is out of range.
     * @private
     */
    private _validateIndex(index: number, allowEnd: boolean = false): number {

        if (index < 0)
            index += this._length;

        if (index >= this._length + (allowEnd ? 1 : 0) || index < 0)
            throw RangeError(`StringBuilder index ${index} is out of range.`);
        return index;
    }
}
