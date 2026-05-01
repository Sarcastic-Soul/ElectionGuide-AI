const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'src', 'public', 'js');

// 1. Refactor csrf.js
let csrf = fs.readFileSync(path.join(jsDir, 'csrf.js'), 'utf8');
csrf = csrf.replace('const CSRF = (() => {', '');
csrf = csrf.replace('  return { getToken, headers };\n})();', 'export { getToken, headers };');
csrf = csrf.replace(/  const /g, 'const ');
fs.writeFileSync(path.join(jsDir, 'csrf.js'), csrf);

// 2. Refactor app.js
let app = fs.readFileSync(path.join(jsDir, 'app.js'), 'utf8');
app = "import { loadIfNeeded as loadTimeline } from './timeline.js';\n" + app;
app = app.replace('const App = (() => {', '');
app = app.replace('  return { switchTab, announce, renderMarkdown, state };\n})();', 'export { switchTab, announce, renderMarkdown, state };');
app = app.replace(/  const /g, 'const ');
app = app.replace('Timeline.loadIfNeeded()', 'loadTimeline()');
app = app.replace(/typeof Timeline !== 'undefined'/g, 'true');
app = app.replace("document.addEventListener('DOMContentLoaded', init);", "document.addEventListener('DOMContentLoaded', init);");
fs.writeFileSync(path.join(jsDir, 'app.js'), app);

// Helper function for the rest
function refactorModule(filename, name, imports) {
  let content = fs.readFileSync(path.join(jsDir, filename), 'utf8');
  content = imports + '\n' + content;
  content = content.replace(`const ${name} = (() => {`, '');
  content = content.replace(/  return \{ .* \};\n\}\)\(\);/, '');
  content = content.replace(/  const /g, 'const ');
  content = content.replace(/  let /g, 'let ');
  content = content.replace(/App\.announce/g, 'announce');
  content = content.replace(/App\.renderMarkdown/g, 'renderMarkdown');
  content = content.replace(/CSRF\.headers/g, 'headers');
  content = content.replace(/App\.state/g, 'state');
  fs.writeFileSync(path.join(jsDir, filename), content);
}

refactorModule('chat.js', 'Chat', "import { announce, renderMarkdown } from './app.js';\nimport { headers } from './csrf.js';\nimport { synthesizeAudio } from './accessibility.js';");
refactorModule('quiz.js', 'Quiz', "import { announce, renderMarkdown } from './app.js';\nimport { headers } from './csrf.js';");
refactorModule('timeline.js', 'Timeline', "import { announce } from './app.js';\nimport { headers } from './csrf.js';\nexport { loadIfNeeded };");
refactorModule('accessibility.js', 'Accessibility', "import { announce } from './app.js';\nimport { headers } from './csrf.js';\nexport { synthesizeAudio };");
refactorModule('i18n.js', 'I18n', "import { announce, state } from './app.js';\nimport { headers } from './csrf.js';");

