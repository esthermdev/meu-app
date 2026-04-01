#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = process.cwd();
const DEFAULT_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SKIP_DIRS = new Set(['.git', '.expo', '.next', 'android', 'ios', 'dist', 'build', 'node_modules', 'supabase']);

function parseArgs(argv) {
  const result = {
    write: false,
    check: false,
    targets: [],
  };

  for (const arg of argv) {
    if (arg === '--write') {
      result.write = true;
      continue;
    }

    if (arg === '--check') {
      result.check = true;
      continue;
    }

    result.targets.push(arg);
  }

  if (!result.write && !result.check) {
    result.write = true;
  }

  return result;
}

function walkDirectory(dirPath, files) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) {
        continue;
      }

      walkDirectory(fullPath, files);
      continue;
    }

    const ext = path.extname(entry.name);
    if (DEFAULT_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }
}

function collectFiles(targets) {
  const files = [];
  const resolvedTargets = targets.length > 0 ? targets : ['app', 'components', 'hooks', 'utils'];

  for (const target of resolvedTargets) {
    const fullTarget = path.resolve(root, target);

    if (!fs.existsSync(fullTarget)) {
      continue;
    }

    const stat = fs.statSync(fullTarget);
    if (stat.isDirectory()) {
      walkDirectory(fullTarget, files);
      continue;
    }

    if (stat.isFile() && DEFAULT_EXTENSIONS.has(path.extname(fullTarget))) {
      files.push(fullTarget);
    }
  }

  return files;
}

function traverse(node, visitor) {
  visitor(node);
  ts.forEachChild(node, (child) => traverse(child, visitor));
}

function findStyleSheetVars(sourceFile) {
  const vars = [];

  traverse(sourceFile, (node) => {
    if (!ts.isVariableDeclaration(node)) {
      return;
    }

    if (!ts.isIdentifier(node.name) || !node.initializer || !ts.isCallExpression(node.initializer)) {
      return;
    }

    const call = node.initializer;
    if (!ts.isPropertyAccessExpression(call.expression)) {
      return;
    }

    if (call.expression.expression.getText(sourceFile) !== 'StyleSheet') {
      return;
    }

    if (call.expression.name.getText(sourceFile) !== 'create') {
      return;
    }

    if (call.arguments.length !== 1 || !ts.isObjectLiteralExpression(call.arguments[0])) {
      return;
    }

    vars.push({
      name: node.name.text,
      objectLiteral: call.arguments[0],
    });
  });

  return vars;
}

function collectStyleUsageOrder(sourceFile, styleVarName, objectLiteralStartPos) {
  const orderedKeys = [];
  const seen = new Set();

  const pushKey = (key) => {
    if (!key || seen.has(key)) {
      return;
    }

    seen.add(key);
    orderedKeys.push(key);
  };

  traverse(sourceFile, (node) => {
    if (node.pos >= objectLiteralStartPos) {
      return;
    }

    if (ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression)) {
      if (node.expression.text === styleVarName) {
        pushKey(node.name.text);
      }
      return;
    }

    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === styleVarName &&
      node.argumentExpression &&
      ts.isStringLiteralLike(node.argumentExpression)
    ) {
      pushKey(node.argumentExpression.text);
    }
  });

  return orderedKeys;
}

function getPropertyKeyName(property, sourceFile) {
  if (!property.name) {
    return null;
  }

  if (ts.isIdentifier(property.name)) {
    return property.name.text;
  }

  if (ts.isStringLiteralLike(property.name) || ts.isNumericLiteral(property.name)) {
    return property.name.text;
  }

  return property.name.getText(sourceFile);
}

function getIndentAtPosition(sourceText, pos) {
  const lineStart = sourceText.lastIndexOf('\n', pos - 1) + 1;
  const lineText = sourceText.slice(lineStart, pos);
  const match = lineText.match(/^[\t ]*/);
  return match ? match[0] : '';
}

function normalizePropertyIndent(propertyText) {
  const lines = propertyText.split('\n');
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);

  if (nonEmptyLines.length === 0) {
    return propertyText;
  }

  const minIndent = nonEmptyLines.reduce((min, line) => {
    const indent = line.match(/^[\t ]*/)[0].length;
    return Math.min(min, indent);
  }, Number.MAX_SAFE_INTEGER);

  return lines.map((line) => line.slice(minIndent)).join('\n');
}

function reorderStyleObjectText(sourceText, sourceFile, styleVar) {
  const objectLiteral = styleVar.objectLiteral;
  const allProperties = objectLiteral.properties;

  if (allProperties.length <= 1) {
    return { changed: false, output: sourceText };
  }

  const usageOrder = collectStyleUsageOrder(sourceFile, styleVar.name, objectLiteral.pos);
  const usageRank = new Map(usageOrder.map((key, index) => [key, index]));

  const sortableProperties = [];
  for (let i = 0; i < allProperties.length; i += 1) {
    const prop = allProperties[i];

    if (!ts.isPropertyAssignment(prop) && !ts.isShorthandPropertyAssignment(prop)) {
      continue;
    }

    const key = getPropertyKeyName(prop, sourceFile);
    sortableProperties.push({
      key,
      index: i,
      text: prop.getText(sourceFile),
      rank: key != null && usageRank.has(key) ? usageRank.get(key) : Number.MAX_SAFE_INTEGER,
      node: prop,
    });
  }

  if (sortableProperties.length <= 1 || usageOrder.length === 0) {
    return { changed: false, output: sourceText };
  }

  const sorted = [...sortableProperties].sort((a, b) => {
    if (a.rank !== b.rank) {
      return a.rank - b.rank;
    }
    return a.index - b.index;
  });

  const changed = sorted.some((item, idx) => item.index !== sortableProperties[idx].index);
  if (!changed) {
    return { changed: false, output: sourceText };
  }

  const objectStart = objectLiteral.getStart(sourceFile);
  const objectEnd = objectLiteral.getEnd();
  const indent = getIndentAtPosition(sourceText, objectStart);
  const innerIndent = `${indent}  `;

  const lines = ['{'];
  for (const item of sorted) {
    const normalized = normalizePropertyIndent(item.text);
    const indented = normalized
      .split('\n')
      .map((line) => `${innerIndent}${line}`)
      .join('\n');
    lines.push(`${indented},`);
  }
  lines.push(`${indent}}`);

  const newObject = lines.join('\n');
  const updated = sourceText.slice(0, objectStart) + newObject + sourceText.slice(objectEnd);

  return { changed: true, output: updated };
}

function processFile(filePath, write) {
  const original = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, original, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const styleVars = findStyleSheetVars(sourceFile);

  if (styleVars.length === 0) {
    return { changed: false, filePath };
  }

  let nextText = original;
  let anyChanged = false;

  for (const styleVar of styleVars) {
    const latestSourceFile = ts.createSourceFile(filePath, nextText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);

    const refreshedVars = findStyleSheetVars(latestSourceFile);
    const refreshedVar = refreshedVars.find((v) => v.name === styleVar.name);

    if (!refreshedVar) {
      continue;
    }

    const result = reorderStyleObjectText(nextText, latestSourceFile, refreshedVar);
    if (result.changed) {
      anyChanged = true;
      nextText = result.output;
    }
  }

  if (anyChanged && write) {
    fs.writeFileSync(filePath, nextText, 'utf8');
  }

  return {
    changed: anyChanged,
    filePath,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const files = collectFiles(args.targets);

  if (files.length === 0) {
    console.log('No matching files found.');
    process.exit(0);
  }

  const changedFiles = [];

  for (const file of files) {
    const result = processFile(file, args.write);
    if (result.changed) {
      changedFiles.push(result.filePath);
    }
  }

  if (changedFiles.length === 0) {
    console.log('No style reordering needed.');
    process.exit(0);
  }

  const relativePaths = changedFiles.map((file) => path.relative(root, file));
  const mode = args.write ? 'Updated' : 'Would update';

  console.log(`${mode} ${changedFiles.length} file(s):`);
  for (const rel of relativePaths) {
    console.log(`- ${rel}`);
  }

  if (args.check) {
    process.exit(1);
  }
}

main();
