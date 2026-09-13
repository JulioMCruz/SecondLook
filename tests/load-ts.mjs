import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
export function loadTs(file, globals = {}) {
  const filename = path.resolve(file);
  const exports = {};
  const localRequire = name => name.startsWith('.') ? loadTs(path.resolve(path.dirname(filename), name + '.ts'), globals) : require(name);
  const code = ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  vm.runInNewContext(code,{exports,require:localRequire,process,console,Date,URL,AbortSignal,structuredClone,fetch,setTimeout,clearTimeout,Buffer,...globals},{filename});
  return exports;
}
