const base = new URL('..', document.currentScript.src).href;
const LINKS = [
  ['index.html', 'Home'],
  ['contracts.html', 'Contracts'],
  ['admin/contracts.html', 'Admin'],
  ['v1/index.html', 'Old site'],
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
  </div>`;
document.body.prepend(nav);
