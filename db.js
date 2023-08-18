const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://ravi:HelloWorld%401234@rechargeapp.9uks18k.mongodb.net/raga', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch(error => {
  console.error('Error connecting to MongoDB:', error);
});

module.exports = mongoose;