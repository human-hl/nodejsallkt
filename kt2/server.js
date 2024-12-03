const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');

const categories = ['business', 'economics', 'finance', 'politics'];

app.get('/:count/news/for/:category', async (req, res) => {
    const { count, category } = req.params;

    if (!categories.includes(category)) {
        return res.status(400).send('Некорректная категория. Доступные категории: business, economic, finances, politics.');
    }
    if (isNaN(count) || parseInt(count) <= 0) {
        return res.status(400).send('Количество новостей должно быть положительным числом.');
    }

    try {
        const rssUrl = `https://www.vedomosti.ru/rss/rubric/${category}`;
        const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
        const response = await axios.get(apiUrl);
        const newsItems = response.data.items.slice(0, parseInt(count)); 
        res.render('news', { count, category, newsItems });
    } catch (error) {
        console.error('Ошибка при получении новостей:', error.message);
        res.status(500).send('Ошибка при получении новостей');
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
