const fs = require('fs');
const path = require('path');

const CONFIG = {
  buildDir: 'build',
  manifestFileName: 'asset-manifest.json',
  cssFileName: 'main.css',
  faviconPath: 'assets/favicons/favicon.ico',
  staticPagesLayoutsDir: 'src/layouts/static-pages',
  htmlFiles: ['access-denied.html', 'service-maintenance.html']
};

const buildPath = (filePath) => path.join(CONFIG.buildDir, filePath);
const layoutsPath = (filePath) => path.join(CONFIG.staticPagesLayoutsDir, filePath);

const injections = {
  '<!--ASSETS_INJECTION-->': `${getFavicon()}\n  ${getCss()}`,
  '<!--HEADER_INJECTION-->': getFileContent(layoutsPath('header.html')),
  '<!--FOOTER_INJECTION-->': getFileContent(layoutsPath('footer.html'))
};

function exitWithError(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}

function getFileContent(filePath, encoding = 'utf8') {
  if (!fs.existsSync(filePath)) {
    exitWithError(`${filePath} not found!`);
  }
  return fs.readFileSync(filePath, encoding);
}

function injectContentIntoHTML(htmlFilePath, injections) {
  let htmlContent = getFileContent(htmlFilePath);

  for (const [placeholder, content] of Object.entries(injections)) {
    htmlContent = htmlContent.replace(placeholder, content);
  }

  fs.writeFileSync(htmlFilePath, htmlContent, 'utf8');
  console.log(`✅ Updated ${path.basename(htmlFilePath)}`);
}

function getCss() {
  const manifestPath = buildPath(CONFIG.manifestFileName);
  const manifest = JSON.parse(getFileContent(manifestPath));
  const cssFilePath = manifest.files?.[CONFIG.cssFileName];
  if (!cssFilePath) {
    exitWithError(`No ${CONFIG.cssFileName} found in ${CONFIG.manifestFileName}`);
  }

  return `<link rel="stylesheet" href="${cssFilePath}">`;
}

function getFavicon() {
  const filePath = buildPath(CONFIG.faviconPath);
  const faviconData = getFileContent(filePath, 'base64');

  return `<link rel="icon" type="image/x-icon" href="data:image/x-icon;base64,${faviconData}">`;
}

CONFIG.htmlFiles.forEach((file) => injectContentIntoHTML(buildPath(file), injections));