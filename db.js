const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://taxedir425:ZaWuSALIncHwl5e3@cluster0.o9fzrup.mongodb.net/Raga', {
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
