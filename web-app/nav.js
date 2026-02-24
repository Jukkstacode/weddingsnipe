// Determine path prefix based on how this script was loaded.
// '' when loaded as 'nav.js', '../' when loaded as '../nav.js'
const _navPrefix = (() => {
    const src = document.currentScript.getAttribute('src');
    const lastSlash = src.lastIndexOf('/');
    return lastSlash === -1 ? '' : src.substring(0, lastSlash + 1);
})();

document.addEventListener('DOMContentLoaded', () => {
    fetch(_navPrefix + 'nav.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('nav-placeholder').innerHTML = data;

            // Adjust link paths when loaded from a subdirectory
            if (_navPrefix) {
                document.querySelectorAll('.top-nav a[href]').forEach(a => {
                    const href = a.getAttribute('href');
                    if (href && !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('/')) {
                        a.setAttribute('href', _navPrefix + href);
                    }
                });
            }

            const hamburger = document.querySelector('.hamburger');
            const navLinks = document.querySelector('.nav-links');

            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('nav-active');
                hamburger.classList.toggle('active');
                document.body.classList.toggle('menu-open');
            });

            // Close drawer when a link is clicked (mobile)
            document.querySelectorAll('.top-nav a').forEach(link => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('nav-active');
                    hamburger.classList.remove('active');
                    document.body.classList.remove('menu-open');
                });
            });

            setActiveNavLink();
        })
        .catch(error => console.error('Error fetching navigation:', error));
});

function setActiveNavLink() {
    let currentPath = window.location.pathname;
    if (currentPath.endsWith('/')) currentPath += 'index.html';

    document.querySelectorAll('.top-nav a[href]').forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('#')) return;

        // Resolve to absolute path so 'over-time/index.html' won't false-match 'index.html'
        let linkPath = new URL(href, window.location.href).pathname;
        if (linkPath.endsWith('/')) linkPath += 'index.html';

        if (linkPath === currentPath) {
            link.classList.add('active');
        }
    });
}
