const mongoose = require('../db.js');

const userSchema = new mongoose.Schema({
  companyCode: { type: String, required: true },
  username: { type: String, required: true },
  email: { type: String, required: true },
  resetToken: { type: String, required: false },
  password: { type: String, required: true }
}, { collection: 'login_data' }); 

const User = mongoose.model('User', userSchema);

module.exports = User;
