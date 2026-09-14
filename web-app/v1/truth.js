document.addEventListener('DOMContentLoaded', function() {
    const container = document.querySelector('.container');
    const gifContainer = document.createElement('div');
    gifContainer.style.position = 'absolute';
    gifContainer.style.display = 'none';
    gifContainer.classList.add('gif-container');

    const img = document.createElement('img');
    img.src = 'assets/thetruth.gif';
    img.alt = 'The Truth';
    img.style.width = '200px';
    img.style.height = 'auto';

    gifContainer.appendChild(img);
    document.body.appendChild(gifContainer);

    container.addEventListener('click', function() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const gifWidth = 200;
        const gifHeight = 200;

        const randomX = Math.floor(Math.random() * (windowWidth - gifWidth));
        const randomY = Math.floor(Math.random() * (windowHeight - gifHeight));

        gifContainer.style.left = `${randomX}px`;
        gifContainer.style.top = `${randomY}px`;
        gifContainer.style.display = 'block';
        gifContainer.classList.add('ripple');

        setTimeout(function() {
            gifContainer.style.display = 'none';
            gifContainer.classList.remove('ripple');
        }, 2000);
    });
});