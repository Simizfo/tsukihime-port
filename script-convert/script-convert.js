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

// split texts with '\' in the middle, split instructions with ':'
const colonRegexp = /^\s?\w([^"`:]*"[^"`]*")*[^"`:]*:/
function splitInstructions(scriptLines) {
    const result = [];
    let match
    for (let line of scriptLines) {

        if (line.length == 0)
            result.push(line)
        
        while (line.length > 0) {
            if (line.startsWith(('`'))) {
                let index = line.search(/\\(?!$)/); // '\' before end of line
                if (index == -1) {
                    result.push(line);
                    break;
                } else {
                    result.push(line.substring(0, index+1));
                    line = `\`${line.substring(index+1)}`;
                }
            } else if (match = line.match(colonRegexp)) {
                const index = match[0].length-1;
                result.push(line.substring(0, index).trimEnd());
                line = line.substring(index+1).trimStart();
            } else {
                result.push(line)
                break
            }
        }
    }
    return result;
}

const ignoredLabels = [
    'imagemode', 'gameopt', 'option',
    'endinglist', 'gamestart_menu',
    'regard_check', 'endofplay',
    'checks', ];
const ignoredLabelRegexps = [
    //tsukihime
    /^[a-z]+_gallery(_check)?$/,
    /^[a-z]+_effectspeed$/,
    /^gallery\d?$/, /^eggs\d?$/,
    /^title/, /^next\d?$/,
    /^\d{4,}$/, /^debug/,
    //kt
    /^mp_play/, /^musicplayer/
    ];
//write a txt file in folder "scenes" for each scene
//a scene is defined by a line that starts with *s and is followed by a number
function writeScenes(scriptLines, dir) {
    let sceneId = undefined;
    const logicFileLines = [];
    let scene = logicFileLines;
    for (const line of scriptLines) {
        if (line.startsWith('*')) {
            const label = line.substring(1)
            if (m = label.match(/^s(?<id>\d+a?)$/)) { // scenes
                sceneId = `scene${m.groups.id}`
                scene = []
            } else if (["openning", "ending", "eclipse"].includes(label)
                    || label.startsWith("mm")) { // easter eggs
                if (label.endsWith("click")) { // ignore '*xxxclick' labels
                    scene.push(line)
                } else {
                    sceneId = label
                    scene = []
                }
            } else if (ignoredLabels.includes(label)
                    || ignoredLabelRegexps.some(re=>re.test(label))) {
                sceneId = undefined
                scene = undefined
            } else if (!sceneId) {
                scene = logicFileLines
                scene?.push(line)
            }
        } else if (sceneId && (line == "return" || line.startsWith("goto"))) {
            scene.push(line)
            if (line.startsWith("goto"))
                scene.push("return")
            fs.writeFileSync(`${dir}/${sceneId}.txt`, scene.join('\n')+"\n");
            sceneId = undefined
            scene = logicFileLines
        } else {
            scene?.push(line)
        }
    }
    fs.writeFileSync(`${dir}/scene0.txt`, logicFileLines.join('\n').trimEnd());
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
        lines = splitInstructions(lines)
        lines = replacePipeByEllipsis(lines)
        writeScenes(lines, dir)
    }
}

main()
