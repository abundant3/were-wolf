import express from 'express';

const app = express();

app.use(express.static('public'));
app.use('/static', express.static('static'));

app.listen(4000, '0.0.0.0', () => {
    console.log('Server is running on http://localhost:4000');
});