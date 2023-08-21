const mongoose = require('../db');

const userSchema = new mongoose.Schema({
  mold: { type: String, required: false },
  monitorNumber: { type: String, required: false },
  systemNumber: { type: String, required: false },
  core: { type: Number, required: false },
  corePins: { type: Number, required: false },
  PBDDTime: { type: String, required: false },
  AirInput: { type: String, required: false },
  shots: { type: String, required: false },
  fillTime: { type: String, required: false },
  solidTime: { type: String, required: false },
  ejectTime: { type: String, required: false },
  totalTime: { type: String, required: false },
}, { collection: 'settings' }); 

const Settings = mongoose.model('Settings', userSchema);

module.exports =  Settings;
