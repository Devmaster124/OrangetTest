// Usage: node build.js   (needs: npm i typescript)
// Turns app.jsx into plain JavaScript (app.js) so browsers do not have to compile 6 MB of JSX on every visit.
const fs = require('fs'), ts = require('typescript')
const out = ts.transpileModule(fs.readFileSync('app.jsx', 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.React, target: ts.ScriptTarget.ES2020 }, fileName: 'app.jsx', reportDiagnostics: true })
if (out.diagnostics && out.diagnostics.length) { console.error('Syntax errors:', out.diagnostics.length); process.exit(1) }
const js = out.outputText.replace(/^"use strict";\s*/, '') // the game was written for sloppy mode (it ran that way under Babel), so keep it that way
fs.writeFileSync('app.js', js); console.log('app.js written,', js.length, 'bytes')
