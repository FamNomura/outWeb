document.addEventListener('DOMContentLoaded', () => {
    const searchBox = document.getElementById('search-box');
    const articleList = document.getElementById('article-list');
    const searchResults = document.getElementById('search-results');
    let searchIndex = [];

    if (!searchBox) return;

    fetch('search_index.json')
        .then(response => response.json())
        .then(data => {
            searchIndex = data;
        });

    searchBox.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (query.length === 0) {
            articleList.style.display = 'block';
            searchResults.style.display = 'none';
            return;
        }

        const results = searchIndex.filter(item => 
            item.title.toLowerCase().includes(query) || 
            item.content.toLowerCase().includes(query)
        );

        articleList.style.display = 'none';
        searchResults.style.display = 'block';
        searchResults.innerHTML = '<h2>検索結果</h2><ul>' + 
            results.map(r => `<li><a href="${r.url}">${r.title}</a></li>`).join('') + 
            '</ul>';
    });
});