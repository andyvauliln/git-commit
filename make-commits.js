const simpleGit = require("simple-git");
const fs = require("fs");
const dotenv = require('dotenv');
const path = require("path");

dotenv.config();

async function cloneAndCopyCommits(username, password, originalRepoUrl, targetRepoUrl) {
    console.log("Cloning and copying commits...", username, password, originalRepoUrl, targetRepoUrl);

    await simpleGit().clone(originalRepoUrl, "./orginial-repo");
    const orginialRepo = simpleGit("./orginial-repo");
    const commitsOrinial = await simpleGit("./orginial-repo").log();
    console.log("cloned original repo")

    const remote = `https://${username}:${password}@${targetRepoUrl}`;
    await simpleGit().clone(remote, "./target-repo");
    const targetRepo = simpleGit("./target-repo");
    console.log("cloned target repo")

    let j = 0;
    if (fs.existsSync("./target-repo/progress.json")) {
    // Read the progress file
        const progress = JSON.parse(fs.readFileSync("./target-repo/progress.json"));
        console.log("progress readded from file", progress.index);
        // Set the starting index for the commits
        let j = progress.index;
    } 
    const commits = commitsOrinial.all.reverse();
    for (let i = j; i < j + 2 && i < commits.length; i++) {

        console.log("getting commit number: ", i, commits[i].message);

        await orginialRepo.commit(commits[i].message);

        await deleteFolderRecursive("./target-repo");

        console.log("deleted files in target repo");

        copyRecursiveSync("./orginial-repo", "./target-repo");
        console.log("copied files from original repo to target repo");
        fs.writeFileSync(
            "./target-repo/progress.json",
            JSON.stringify({ index: j + 1 })
        );
        console.log("wrote progress file")
        simpleGit("./target-repo")
            .addConfig("user.name", username)
            .addConfig("user.email", "andy.vaulin@gmail.com")
            .addRemote('origin', remote)
            .add('./*')
            .commit(commits[i].message)
            .push("-u", "origin", "main");

        console.log("pushed commit to target repo");
    }

}

// Clone and copy the commits from the original repository to the new repository
cloneAndCopyCommits(
    process.env.USERNAME,
    process.env.PASSWORD,
    process.env.ORIGINAL_REPO_URL,
    process.env.TARGET_REPO_URL
);

var copyRecursiveSync = function (src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (dest !== "./target-repo") {
            fs.mkdirSync(dest);
        }

        fs.readdirSync(src).forEach(function (childItemName) {
            if (childItemName !== ".git") {
                copyRecursiveSync(path.join(src, childItemName),
                    path.join(dest, childItemName));
            }
        });
    } else {
        fs.copyFileSync(src, dest);
    }
};

// const deleteFolderRecursive = async function (directory) {
//     for (const file of await fs.promises.readdir(directory)) {
//         if (file !== ".git") {
//             await fs.promises.unlink(path.join(directory, file));
//         }

//     }
// };

var deleteFolderRecursive = function (dir) {
    if (fs.existsSync(dir)) {
        fs.readdirSync(dir).forEach(function (file) {
            var curdir = dir + "/" + file;
            if (fs.lstatSync(curdir).isDirectory()) { // recurse
                deleteFolderRecursive(curdir);
            } else { // delete file
                fs.unlinkSync(curdir);
            }
        });
        if (dir !== "./target-repo" && dir.indexOf(".git") === -1) {
            fs.rmdirSync(dir);
        }

    }
};

// function copyFileSync(source, target) {

//     var targetFile = target;

//     // If target is a directory, a new file with the same name will be created
//     if (fs.existsSync(target)) {
//         if (fs.lstatSync(target).isDirectory()) {
//             targetFile = path.join(target, path.basename(source));
//         }
//     }

//     fs.writeFileSync(targetFile, fs.readFileSync(source));
// }

// function copyFolderRecursiveSync(source, target) {
//     var files = [];

//     // Check if folder needs to be created or integrated
//     var targetFolder = path.join(target, path.basename(source));
//     if (!fs.existsSync(targetFolder)) {
//         fs.mkdirSync(targetFolder);
//     }

//     // Copy
//     if (fs.lstatSync(source).isDirectory()) {
//         files = fs.readdirSync(source);
//         files.forEach(function (file) {
//             var curSource = path.join(source, file);
//             if (fs.lstatSync(curSource).isDirectory() && file !== ".git") {
//                 copyFolderRecursiveSync(curSource, targetFolder);
//             } else {
//                 copyFileSync(curSource, targetFolder);
//             }
//         });
//     }
// }