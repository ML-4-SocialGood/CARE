require('dotenv').config();
const app = require('./app');
const morgan = require('morgan'); // Import morgan

const PORT = process.env.BACKEND_PORT || 3000;

// Use morgan middleware for logging requests
// 'dev' is a common format for development, providing concise and colorful output.
app.use(morgan('dev'));

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
