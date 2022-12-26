const simpleGit = require("simple-git/promise");
const fs = require("fs");

async function cloneAndCopyCommits(username, token) {
    // Get the original repository URL and the new repository path from environment variables
    const originalRepoUrl = process.env.ORIGINAL_REPO_URL;
    const newRepoPath = process.env.NEW_REPO_PATH;

    // Clone the original repository
    await simpleGit().clone(originalRepoUrl, newRepoPath, {
        username: username,
        password: token,
    });

    // Open the new repository
    const newRepo = simpleGit(newRepoPath);

    // Get the list of commits in the original repository
    const commits = await simpleGit().log({
        username: username,
        password: token,
    });

  // Check if the progress file exists
    if (fs.existsSync("./progress.json")) {
    // Read the progress file
        const progress = JSON.parse(fs.readFileSync("./progress.json"));

        // Set the starting index for the commits
        let i = progress.index;
    } else {
        // Set the starting index for the commits to 0
        let i = 0;
    }

    // Iterate through the commits
    while (i < commits.all.length) {
        // Checkout the commit
        await newRepo.checkout(commits.all[i].hash);

        // Add all the files in the commit
        await newRepo.add(".");

        // Create a new commit in the new repository
        await newRepo.commit(commits.all[i].message);

        // Increment the index
        i++;

        // Check if we have reached the limit of two commits per day
        if (i % 2 == 0) {
            // Save the progress
            fs.writeFileSync(
                "./progress.json",
                JSON.stringify({ index: i })
            );

            // Push the new repository to a remote
            await newRepo.push("origin", "master", {
                username: username,
                password: token,
            });

            // Break the loop
            break;
        }
    }
}

// Clone and copy the commits from the original repository to the new repository
cloneAndCopyCommits(
    process.env.USERNAME,
    process.env.TOKEN
);
