import {writeFileSync, readFileSync} from "fs";
import {exec} from "child_process";

import {parseArgs} from "./cmdline";
import {StringBuilder} from "../StringBuilder"; // using our own StringBuilder! yay


// Builds and deploys docs
// unignores docs/ folder temporarily -> builds docs -> deploys via gh-pages -> then re-ignores docs/
async function main() {
    const args = parseArgs();

    const gitignorePath = args.flags["i"] ? args.flags["i"] : "./.gitignore";
    const docsPath = args.flags["d"] || "docs";

    // read file
    const file = readFileSync("./.gitignore");
    const sb = new StringBuilder(file.length, Uint8Array);
    sb.append(file);

    const index = sb.search(new RegExp("^.*" + docsPath, "m"));
    if (index !== -1) {
        if (sb.charAt(index-1) !== "#") {
            sb.insert(index, "#");
        }
    }

    writeFileSync(gitignorePath, sb.buffer);

    exec("typedoc --options typedoc.json", (err, stdout, stderr) => {
        if (!err) {
            console.log(stdout);
            console.error(stderr);
            exec(`gh-pages -d ${docsPath}`, (err, stdout, stderr) => {
                if (!err) {
                    sb.splice(index, 1);
                    console.log(stdout);
                    console.error(stderr);
                    writeFileSync(gitignorePath, sb.buffer);
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
