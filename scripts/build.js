const path = require('path');
const fse = require('fs-extra');

const babylon = require('babylon');

const rules = ['index', 'react', 'vue', 'typescript', 'typescript-react'];

rules.forEach((rule) => {
    buildRuleComments(rule);
    copyRules(rule);
    buildRuleTests(rule);
});

function buildRuleComments(filename) {
    const fileContent = fse.readFileSync(path.resolve(__dirname, `../${filename}.js`), 'utf-8');
    const fileAST = babylon.parse(fileContent);

    // 将每条规则对应的注释保存在这个对象中
    let ruleComments = {};
    let rulesStart = false;
    // 临时存储当前的注释
    let commentLines = [];

    fileAST.tokens.forEach((token) => {
        // 从 rules 开始遍历
        if (token.value === 'rules') {
            rulesStart = true;
        }
        if (rulesStart) {
            if (token.type === 'CommentLine') {
                // 如果是注释，则存储在 commentLines 中
                commentLines.push(token.value.trim());
                // 如果时空行注释，则清除当前存储的注释
                if (token.value === '') {
                    commentLines = [];
                }
            // 如果某一行不是注释，并且之前存储过了注释，则说明该行是一条规则
            } else if (commentLines.length > 0) {
                ruleComments[token.value] = commentLines.join('\n');
                commentLines = [];
            }
        }
    });

    fse.outputFileSync(path.resolve(__dirname, `../docs/rule-comments/${filename}.json`), JSON.stringify(ruleComments, null, 4), 'utf-8');
}

function copyRules(filename) {
    fse.copySync(path.resolve(__dirname, `../${filename}.js`), path.resolve(__dirname, `../docs/rules/${filename}.js`));
}

function buildRuleTests(dirname) {
    let prefix = '';
    if (dirname === 'react' || dirname === 'vue' || dirname === 'typescript') {
        prefix = `${dirname}/`;
    }
    const ruleTests = {};
    const dirnameList = fse.readdirSync(path.resolve(__dirname, `../test/${dirname}`));
    dirnameList.forEach((subDirname) => {
        let good;
        let bad;
        const subDirpath = path.resolve(__dirname, `../test/${dirname}/${subDirname}`);
        if (!fse.lstatSync(subDirpath).isDirectory()) {
            return;
        }
        fse.readdirSync(subDirpath).forEach((filename) => {
            if (filename.indexOf('good') === 0) {
                good = fse.readFileSync(path.resolve(subDirpath, filename), 'utf-8');
            } else if (filename.indexOf('bad') === 0) {
                bad = fse.readFileSync(path.resolve(subDirpath, filename), 'utf-8');
            }
        });
        ruleTests[`${prefix}${subDirname}`] = {
            good,
            bad
        };
    });

    fse.outputFileSync(path.resolve(__dirname, `../docs/rule-tests/${dirname}.json`), JSON.stringify(ruleTests, null, 4), 'utf-8');
}
