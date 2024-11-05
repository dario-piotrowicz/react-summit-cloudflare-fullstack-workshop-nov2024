/**
 *************************** IMPORTANT **************************
 *
 * This script is only for the authors of the workshop (and it nicely
 * re-tags all commits and prepares the git history for the workshop)
 *
 * If you are not one of the authors please ignore this file.
 *
 * If you are one of the authors, here's a few notes:
 *  - the script assumes this git history:
 *    - some __TO IGNORE__ commits
 *    - the `start` commit
 *    - the various exercise commits
 *    - a potential workshop-reset commit
 *
 *  - run this script when you've rebased and ready to push changes up
 *  - after running the script run:
 *    - `git push --force-with-lease` to force push your changes
 *    - `git push origin --delete $(git tag -l)` to delete all the remote tags
 *    - `git push --tags` to push all the new tags
 *    - for convenience: `git push --force-with-lease && git push origin --delete $(git tag -l) && git push --tags`
 *                       (the script also can run the command for you)
 * Also:
 *  - this script assumes that all the exercise commits are the latest in the history, so make sure to have any
 *    none workshop related commit earlier in the history
 *  - the reset workshop commit that this script adds is removed automatically if already present
 *  - commits starting with `__TO IGNORE__` get ignored by the script
 *  - were the script to fail for whatever reason the state of your local git repo is not guaranteed, DO NOT PUSH
 *    ANYTHING UP and do a hard remote reset! (`git reset --hard origin/main`)
 *
 * ***************************************************************
 */

// @ts-check

import nodeChildProcess from "node:child_process";
import nodeReadline from "node:readline";
import nodeUtil from "node:util";

const exec = nodeUtil.promisify(nodeChildProcess.exec);

console.log();

const commits = await collectCommits();

validateCommitTitles();

await deleteWorkshopResetCommitIfPresent();

await deleteAllExistingTags();

const newTags = await collectAllTagsToCreate(commits);
await createNewTags(newTags);

await resetWorkshopToStartingState();

await optionallyPushEverythingUp();

async function collectCommits() {
    const { stdout } = await exec('git log --oneline');
    const commits = stdout.split('\n').filter(Boolean).map(commit => {
        const match = commit.match(/^([a-z0-9]{7})\s(.*?)$/);
        if (match?.length !== 3) {
            throw new Error('Something went wrong, could not correctly parse git commits, aborting');
        }
        return {
            sha: match[1],
            title: match[2]
        };
    });
    return commits;
}

function validateCommitTitles() {
    const unexpectedCommit = commits.find(({ title }) => {
        if (title.startsWith('start of the workshop')) return false;
        if (title.startsWith('__TO IGNORE__')) return false;
        if (title === 'initial commit') return false;
        if (title.startsWith('exr')) return false;
        return true;
    });
    if (unexpectedCommit) {
        throw new Error(`Found an unexpected commit in the git history: ${unexpectedCommit.title}, aborting`);
    }
}

async function deleteAllExistingTags() {
    const { stdout } = await exec('git tag --list');
    const allExistingTags = stdout.split('\n').filter(Boolean);
    for (const tag of allExistingTags) {
        await exec(`git tag -d ${tag}`);
        console.log(`Deleted old tag \`${tag}\``);
    }
    console.log('\nDeleted all existing tags\n');
}

/**
 * 
 * @param {{ sha: string; title: string; }[]} commits
 * @returns {Promise<{ sha: string; tag: string; }[]>}
 */
async function collectAllTagsToCreate(commits) {
    const tags = commits.flatMap(({ title, sha }) => {
        /** @type string[] */
        let commitTags = [];

        const exerciseStart = title.match(/(exr\d+\sstart)/);
        if (exerciseStart?.length === 2) {
            const exerciseStartTag = exerciseStart[0];
            commitTags.push(exerciseStartTag);
        }

        const exerciseDone = title.match(/(exr\d+\sdone)/);
        if (exerciseDone?.length === 2) {
            const exerciseDoneTag = exerciseDone[0];
            commitTags.push(exerciseDoneTag);
        }

        const exerciseStep = title.match(/(exr\d+\sstep\s\d+)/);
        if (exerciseStep?.length === 2) {
            const exerciseStepTag = exerciseStep[0];
            commitTags.push(exerciseStepTag);
        }

        return commitTags.map(tag => ({
            sha,
            tag: tag.replace(/\s/g, '_'),
        }));
    });
    return tags;
}

/**
 * @param {{ sha: string; tag: string; }[]} tags
 */
async function createNewTags(tags) {
    for (const tag of tags) {
        await exec(`git tag '${tag.tag}' ${tag.sha}`);
        console.log(`Created tag \`${tag.tag}\` (commit sha: ${tag.sha})`);
    }
    console.log('\nCreated all tags\n');
}

async function deleteWorkshopResetCommitIfPresent() {
    const { stdout } = await exec('git log --oneline -1 ');

    if (stdout.includes('start of the workshop (exrcs reset)')) {
        await exec('git reset --hard HEAD^');
    }
}

async function resetWorkshopToStartingState() {
    const firstWorkshopTag = newTags.find(t => t.tag === 'exr01_start');

    await exec(`git revert ${firstWorkshopTag?.sha}..HEAD --no-commit`);
    await exec(`git commit -m 'start of the workshop (exrcs reset)'`);
}

async function optionallyPushEverythingUp() {
    const readline = nodeReadline.createInterface({ input: process.stdin, output: process.stdout });

    let shouldPush = null;

    while (shouldPush === null) {
        /** @type {boolean|null} */
        shouldPush = await new Promise(resolve => {
            readline.question('\nDo you want to push everything? (Y/n) > ', answer => {
                if (!answer) {
                    return resolve(true);
                }
                answer = answer.toLowerCase().trim();
                if (answer === 'y' || answer === 'yes') {
                    return resolve(true);
                }
                if (answer === 'n' || answer === 'no') {
                    return resolve(false);
                }

                console.error('\x1b[31mPlease type either `y` or `n`\x1b[0m');
                resolve(null);
            })
        });
    }

    if (shouldPush) {
        console.log(`\nPushing everything up\n`);
        await exec('git push --force-with-lease && git push origin --delete $(git tag -l) && git push --tags');
        console.log('\nEverything has been pushed\n');
    }

    readline.close();
}