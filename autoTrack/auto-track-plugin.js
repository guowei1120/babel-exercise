const { declare } = require('@babel/helper-plugin-utils');
const importModule = require('@babel/helper-module-imports');

const autoTrackPlugin = declare((api, options, dirname) => {
    api.assertVersion(7);

    return {
        visitor: {
            Program: {
                enter (path, state) {
                    path.traverse({
                        // 遍历 ImportDeclaration，如果引入了 tracker 模块，就记录 id 到 state，并用 path.stop 来终止后续遍历；没有就引入 tracker 模块，用 generateUid 生成唯一 id，然后放到 state
                        ImportDeclaration (curPath) {
                            const requirePath = curPath.get('source').node.value;
                            console.log('++++++',requirePath);
                            if (requirePath === options.trackerPath) {
                                const specifierPath = curPath.get('specifiers.0');
                                console.log(specifierPath)
                                if (specifierPath.isImportSpecifier()) {
                                    state.trackerImportId = specifierPath.toString();
                                } 
                                path.stop();
                            }
                        }
                    });
                    if (!state.trackerImportId) {
                        state.trackerImportId  = importModule.addDefault(path, 'tracker',{
                            nameHint: path.scope.generateUid('tracker')
                        }).name;
                        state.trackerAST = api.template.statement(`${state.trackerImportId}()`)();
                    }
                }
            },
            'ClassMethod|ArrowFunctionExpression|FunctionExpression|FunctionDeclaration'(path, state) {
                const bodyPath = path.get('body');
                 // 有函数体就在开始插入埋点代码
                if (bodyPath.isBlockStatement()) {
                    bodyPath.node.body.unshift(state.trackerAST);
                }
            }
        }
    }
});
module.exports = autoTrackPlugin;