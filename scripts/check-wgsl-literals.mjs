#!/usr/bin/env node
// A backtick inside a shader template literal silently terminates the shader
// source, and the only symptom is a JS parse error naming a shader identifier
// (Unexpected identifier 'loose'), which points nowhere useful. Markdown-style
// `code quotes` in shader comments are the usual culprit.
// Usage: node scripts/check-wgsl-literals.mjs <files...>
//
// Any literal whose name ends in SHADER/shader counts, tagged /* wgsl */ or
// not — WGSL in the vgpu sketches, GLSL in the three.js ones, and the
// `vertexShader:`/`fragmentShader:` properties of an inline ShaderMaterial.
// Matching only the tagged form is how this check quietly passed a file that
// was already broken.
//
// It also balances parens per shader function, because an edit that leaves a
// stray signature line makes the compiler report the error at the *next*
// function, which sends you looking in the wrong place entirely.
import { readFileSync } from 'node:fs';

// `NAME = ` or `name: `, optionally tagged, with the literal opening at the
// end of the line — which is how every shader in this repo is written.
//
// Two ways in, because neither alone covers the repo: a shader-ish *name*
// (`fragmentShader:`, `FIELD_WGSL =`) or an explicit `/* wgsl */` tag. Keying
// only on names ending in SHADER meant every shader in the vert-bars sketches
// — COMMON, FIELD_WGSL, BLUR_WGSL, COMPOSITE_WGSL — went unchecked, and the
// script reported itself clean while looking at nothing at all. Anything
// broader would have to match bare template literals, which would drag
// ordinary JS through the paren balancing below and report errors in it.
// Case-insensitive, because the camelCase property form an inline
// ShaderMaterial takes — `vertexShader:` — matches neither SHADER nor shader,
// so the foundation and yarn shaders in prototypes/farsh went unchecked.
const NAMED = /(?:shader|wgsl|glsl)\s*[=:]\s*(?:\/\*\s*(?:wgsl|glsl)\s*\*\/\s*)?`$/i;
const TAGGED = /\/\*\s*(?:wgsl|glsl)\s*\*\/\s*`$/;
const isOpen = (line) => NAMED.test(line) || TAGGED.test(line);
const CLOSE = /^`[,;)]*$/;
const SIGNATURE = /^\s*(?:fn |void |vec[234] |float |bool |int )\w/;

let bad = 0;
let checked = 0;

for (const file of process.argv.slice(2)) {
  let inside = false;
  let depth = 0;
  readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    const where = `${file}:${i + 1}`;
    if (!inside) {
      if (isOpen(line.trimEnd())) { inside = true; depth = 0; checked++; }
      return;
    }
    if (CLOSE.test(line.trim())) { inside = false; return; }
    if (line.includes('`')) {
      console.error(`${where}: backtick inside shader literal — ${line.trim()}`);
      bad++;
    }
    if (SIGNATURE.test(line) && depth !== 0) {
      console.error(`${where}: previous declaration left ${depth} paren(s) open — ${line.trim()}`);
      bad++;
      depth = 0;
    }
    const code = line.split('//')[0];
    depth += (code.match(/\(/g) || []).length - (code.match(/\)/g) || []).length;
  });
  if (inside) {
    console.error(`${file}: a shader literal is never closed — a backtick inside it probably ended it early`);
    bad++;
  }
}

if (bad) {
  console.error(`\n${bad} problem(s) would break the shader source.`);
  process.exit(1);
}
console.log(`shader literals clean (${checked} checked).`);
