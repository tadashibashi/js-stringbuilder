/**
 * Interface for command line argument object that is
 * retrieved from the {@link parseArgs} function.
 */
export interface CommandLineArgs {
    /** Copy of the argument Array */
    argv: string[];

    /** Contains all non-flag args that are not paired with a flag */
    _: string[];

    /** Path to the program, the first cli argument */
    program: string;

    /** list of flags and the paired argument.
     If there is no arg, "true" is set. */
    flags: { [key: string]: string; }
}

/**
 * Parses flags from an array of arguments
 * @param args - array of string args, no whitespace
 */
export function parseArgs(args: string | string[] = process.argv) {
    function stripFlag(str: string) {
        let i = 0;
        while (str[i] === '-')
            ++i;

        return str.substring(i);
    }

    if (typeof args === "string") {
        args = args.split(/\s+/);
    }

    const res: CommandLineArgs = {
        program: args[0],
        _: [],
        flags: {},
        argv: args
    };
    const length = args.length;

    // Parse arguments
    let lastFlag = null;
    for (let i = 1; i < length; ++i) {
        const isFlag = args[i][0] === '-';
        const arg = isFlag ? stripFlag(args[i]) : args[i];

        if (lastFlag === null) {
            if (isFlag)
                lastFlag = arg;
            else
                res["_"].push(arg);
        } else {
            if (isFlag) {
                res.flags[lastFlag] = "true";
                lastFlag = arg;
            } else {
                res.flags[lastFlag] = arg;
                lastFlag = null;
            }
        }
    }

    // last argument was a flag, set it to true
    if (lastFlag)
        res.flags[lastFlag] = "true";

    return res;
}
