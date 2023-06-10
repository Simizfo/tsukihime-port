const fs = require('fs');

let script = fs.readFileSync('full-script.txt', 'utf8');

//if not exist create a folder "scenes"
function createScenesFolder() {
    if (!fs.existsSync('scenes')) {
        fs.mkdirSync('scenes');
    }
}
createScenesFolder();

//script that take edited-script.txt and remove all lines that start with ;
function removeComments(script) {
    const lines = script.split(/\r?\n/);

    const regex = /^;/;

    let newLines = [];

    lines.forEach((line) => {
        if (!regex.test(line)) {
            newLines.push(line);
        }
    });

    return newLines.join('\n');
}

script = removeComments(script);

//take all numalias flgJ,118 and create a json file with the key being the number and the value being the alias
function createNumAliasJson(script) {
    const lines = script.split(/\r?\n/);

    const regex = /^numalias (\w+),(\d+)/;

    let numAlias = {};

    lines.forEach((line) => {
        if (regex.test(line)) {
            let alias = line.match(regex)[1];
            let num = line.match(regex)[2];
            numAlias[num] = alias;
        }
    });

    fs.writeFileSync('numalias.json', JSON.stringify(numAlias));
}
createNumAliasJson(script);

//take all stralias se6,"wave\se_07.wav" and create a json file with the key being the number and the value being the alias
function createStrAliasJson(script) {
    const lines = script.split(/\r?\n/);

    const regex = /^stralias (\w+),"(.+)"/;

    let strAlias = {};

    lines.forEach((line) => {
        if (regex.test(line)) {
            let alias = line.match(regex)[1];
            let str = line.match(regex)[2];
            strAlias[alias] = str;
        }
    });

    fs.writeFileSync('stralias.json', JSON.stringify(strAlias));
}
createStrAliasJson(script);

//replace each | by a …
function replacePipeByEllipsis(script) {
    const lines = script.split(/\r?\n/);

    const search = '|';
    const replacement = '…';

    let newLines = [];

    lines.forEach((line) => {
        if (line.includes(search)) {
            newLines.push(line.replaceAll(search, replacement));
        } else {
            newLines.push(line);
        }
    });

    return newLines.join('\n');
}
script = replacePipeByEllipsis(script);

//write a txt file in folder "scenes" for each scene
//a scene is defined by a line that starts with *s and is followed by a number
function writeScenes(script) {
    const lines = script.split(/\r?\n/);
    const regex = /^\*s(\d+)/;
    let scene = [];
    let sceneNumber = 0;
    lines.forEach((line) => {
        if (regex.test(line)) {
            fs.writeFileSync(`scenes/scene${sceneNumber}.txt`, scene.join('\n'));
            scene = [];
            // Extract the scene number
            sceneNumber = parseInt(line.match(regex)[1], 10);
        } else {
            scene.push(line);
        }
    });
}

writeScenes(script);