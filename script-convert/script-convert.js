const fs = require('fs');

//if not exist create a folder "scenes"
function createDir(dirName) {
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
    }
}

//script that take edited-script.txt and remove all lines that start with ;
function filterLines(scriptLines, regexp) {
    return scriptLines.filter(line=>regexp.test(line))
}

//take all numalias flgJ,118 and create a json file with the key being the number and the value being the alias
function extractNumAliasJson(scriptLines, fileName) {

    const regex = /^numalias (\w+),(\d+)/;

    let numAlias = {};

    const remainingLines = []
    for(const line of scriptLines) {
        if (regex.test(line)) {
            let alias = line.match(regex)[1];
            let num = line.match(regex)[2];
            numAlias[num] = alias;
        } else {
            remainingLines.push(line)
        }
    }

    fs.writeFileSync(fileName, JSON.stringify(numAlias));
    return remainingLines
}

//take all stralias se6,"wave\se_07.wav" and create a json file with the key being the number and the value being the alias
function extractStrAliasJson(scriptLines, fileName) {

    const regex = /^stralias (\w+),"(.+)"/;

    let strAlias = {};

    const remainingLines = []
    for(const line of scriptLines) {
        if (regex.test(line)) {
            let alias = line.match(regex)[1];
            let str = line.match(regex)[2];
            strAlias[alias] = str;
        } else {
            remainingLines.push(line)
        }
    }

    fs.writeFileSync(fileName, JSON.stringify(strAlias));
    return remainingLines
}

//replace each | by a …
function replacePipeByEllipsis(scriptLines) {
    for (let [i, line] of scriptLines.entries()) {
        if (line.startsWith('`') && line.includes('|')) {
            line = line.replaceAll('|', '…')
            scriptLines[i] = line
        }
    }
    return scriptLines
}

//write a txt file in folder "scenes" for each scene
//a scene is defined by a line that starts with *s and is followed by a number
function writeScenes(scriptLines, dir) {
    const regex = /^\*(s(?<scene>\d+a?)|(?<op>openn?ing)|(?<ed>ending))/;
    let scene = [];
    let sceneId = '0';
    scriptLines.forEach((line) => {
        if (regex.test(line)) {
            fs.writeFileSync(`${dir}/scene${sceneId}.txt`, scene.join('\n'));
            scene = [];
            // Extract the next scene id
            const groups = line.match(regex).groups
            sceneId = groups['scene'] ?? groups['op'] ?? groups['ed'];
        } else {
            scene.push(line);
        }
    });
}

function main() {
    const scripts = {
        'full-script.txt': "",
        'full-script-kt.txt': "-kt"
    }
    for (const [file, suffix] of Object.entries(scripts)) {
        const dir = `scenes${suffix}`
        createDir(dir)
        let script = fs.readFileSync(file, 'utf8');
        let lines = script.split(/\r?\n/);
        lines = filterLines(lines, /^(?!;)/); // remove comments
        lines = filterLines(lines, /^(?!numalias )/); // remove num aliases
        lines = filterLines(lines, /^(?!effect )/); // remove effects aliases
        lines = extractStrAliasJson(lines, `stralias${suffix}.json`)
        lines = replacePipeByEllipsis(lines)
        writeScenes(lines, dir)
    }
}

main()
