const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const types = require('@babel/types');

const sourceCode = `
    console.log(1);
    function func() {
        console.info(2);
    }
    export default class Clazz {
        say() {
            console.debug(3);
        }
        render() {
            return <div>{console.error(4)}</div>
        }
    }
`;

// unambiguous  根据内容是否包含 import、export 来自动设置 moduleType。
// 带有ES6 import和export的文件被视为"module"，否则是"script"。
const ast = parser.parse(sourceCode, {
    sourceType: 'unambiguous',
    plugins: ['jsx']
});


// path用来获取父节点信息、以及对AST增删改
// path.node当前AST节点
traverse(ast, {
    CallExpression(path, state) {
        console.log(path.node);
        const isMember = types.isMemberExpression(path.node.callee) 
        const isConsole = path.node.callee.object.name === 'console' 
        const isLog=['log', 'info', 'error', 'debug'].includes(path.node.callee.property.name) 
        if ( isMember&&isConsole&& isLog) {
            const { line, column } = path.node.loc.start;
            path.node.arguments.unshift(types.stringLiteral(`filename: (${line}, ${column})`))
        }
    }
});

const { code } = generate(ast);
console.log(code);