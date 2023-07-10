import {writeFileSync, readFileSync} from "fs";

import {StringBuilder} from "./StringBuilder";
import {exec} from "child_process";

async function main() {
    const file = readFileSync("./.gitignore");

    // read lines
    const sb = new StringBuilder(file.length, Uint8Array);
    sb.append(file);

    const index = sb.search(/docs/);

    if (index !== -1) {
        if (sb.charAt(index-1) !== "#") {
            sb.insert(index, "#");
        }
    }

    writeFileSync("./.gitignore", sb.buffer);

    exec("typedoc --options typedoc.json", (err, stdout, stderr) => {
        if (!err) {
            console.log(stdout);
            console.error(stderr);
            exec("gh-pages -d docs", (err, stdout, stderr) => {
                if (!err) {
                    sb.splice(index, 1);
                    console.log(stdout);
                    console.error(stderr);
                    writeFileSync("./.gitignore", sb.buffer);
                } else {
                    console.error(err);
                }
            });
        } else {
            console.error(err);
        }
    });

}

main()
    .catch(err => console.error("Error!:", err));
