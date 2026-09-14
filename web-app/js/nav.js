const base = new URL('..', document.currentScript.src).href;
const LINKS = [
  ['index.html', 'Home'],
  ['contracts.html', 'Contracts'],
  ['stats/index.html', 'Stats'],
  ['admin/contracts.html', 'Admin'],
];

const here = location.href;
const nav = document.createElement('nav');
nav.className = 'top-nav';
nav.innerHTML = `
  <a class="brand" href="${base}index.html">Bathouse Hockey League</a>
  <div class="links">
    ${LINKS.map(([path, label]) => {
      const href = base + path;
      return `<a href="${href}"${here.startsWith(href) ? ' aria-current="page"' : ''}>${label}</a>`;
    }).join('')}
  </div>
  <a class="legacy" href="${base}v1/index.html">Old site</a>`;
document.body.prepend(nav);
