document.addEventListener('DOMContentLoaded', function() {
    const baseUrl = 'https://gist.githubusercontent.com/Jukkstacode/97d49aa64854740eb8c7157d86eee589/raw/news.txt';

    // By adding the current timestamp, we create a unique URL to prevent the browser from caching the file.
    const newsUrl = `${baseUrl}?t=${new Date().getTime()}`;

    fetch(newsUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(text => {
            const newsScrollContent = document.getElementById('news-scroll-content');
            if (newsScrollContent) {
                newsScrollContent.textContent = text;
            }
        })
        .catch(error => {
            console.error('Error fetching news:', error);
            const newsScrollContent = document.getElementById('news-scroll-content');
            if (newsScrollContent) {
                newsScrollContent.textContent = 'Could not load the latest news.';
            }
        });
});