const LINKS = [
  ['index.html', 'Home'],
  ['contracts.html', 'Contracts'],
  ['v1/index.html', 'Old site'],
];

const here = location.pathname.split('/').pop() || 'index.html';
const nav = document.createElement('nav');
nav.className = 'top-nav';
nav.innerHTML = `
  <a class="brand" href="index.html">Bathouse Hockey League</a>
  <div class="links">
    ${LINKS.map(([href, label]) =>
      `<a href="${href}"${href === here ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
  </div>`;
document.body.prepend(nav);
