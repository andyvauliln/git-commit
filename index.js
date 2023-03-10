const simpleGit = require("simple-git");
const fs = require("fs");
const fsp = require("fs/promises");
const dotenv = require('dotenv');
const path = require("path");

dotenv.config();

async function cloneAndCopyCommits(commitsAcmount, username, email, token, originalRepoUrl, targetRepoUrl) {
    await simpleGit().clone(originalRepoUrl, "./orginal-repository");
    const orginialRepo = simpleGit("./orginal-repository");
    const commitsOrinial = await simpleGit("./orginal-repository").log();
    console.log("cloned original repo")

    const remote = `https://${token}@${targetRepoUrl}`;
    await simpleGit().clone(remote, "./target-repository");
    const targetRepo = simpleGit("./target-repository");
    console.log("cloned target repo")


    let j = 0;
    if (fs.existsSync("./target-repository/progress.json")) {
        // Read the progress file
        const progress = JSON.parse(fs.readFileSync("./target-repository/progress.json"));
        console.log("progress readded from file", progress.index);
        // Set the starting index for the commits
        j = progress.index;
    }
    const commits = commitsOrinial.all.reverse();
    for (let i = j; i < j + commitsAcmount && i < commits.length; i++) {
        console.log("getting commit number: ", i, commits[i].message);
        if (commits[i].message.indexOf("Merge pull request") >= 0) {
            continue;
        }

        await orginialRepo.checkout(commits[i].hash);

        await deleteFolderRecursive("./target-repository");

        console.log("deleted files in target repo");

        copyRecursiveSync("./orginal-repository", "./target-repository");
        console.log("copied files from original repo to target repo");
        fs.writeFileSync(
            "./target-repository/progress.json",
            JSON.stringify({ index: i + 1 })
        );
        console.log("wrote progress file")
        await targetRepo
            .addConfig("user.name", username)
            .addConfig("user.email", email)
            .add('./*')
            .commit(commits[i].message)
            .push("-u", "origin", "main", "--verbose", "--porcelain");

        console.log("pushed commit to target repo");
    }

}


cloneAndCopyCommits(
    parseInt(process.env.COMMITS),
    process.env.USERNAME,
    process.env.EMAIL,
    process.env.TOKEN,
    process.env.ORIGINAL_REPO_URL,
    process.env.TARGET_REPO_URL
);

var copyRecursiveSync = function (src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
        if (dest !== "./target-repository") {
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

var deleteFolderRecursive = function (dir) {
    if (fs.existsSync(dir) && dir.indexOf(".git") === -1) {
        fs.readdirSync(dir).forEach(function (file) {
            var curdir = dir + "/" + file;
            if (fs.lstatSync(curdir).isDirectory()) { // recurse
                deleteFolderRecursive(curdir);
            } else { // delete file
                fs.unlinkSync(curdir);
            }
        });
        if (dir !== "./target-repository") {
            fs.rmdirSync(dir);
        }

    }
};
