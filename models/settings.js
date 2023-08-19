const mongoose = require('../db');

const userSchema = new mongoose.Schema({
  mold: { type: String, required: true },
  monitorNumber: { type: String, required: true },
//   age: {
//     type     : Number,
//     required : true,
//     validate : {
//       validator : Number.isInteger,
//       message   : '{VALUE} is not an integer value'
//     }
//   },
  systemNumber: { type: String, required: true },
  core: { type: Number, required: true },
  corePins: { type: Number, required: true },
  PBDDTime: { type: String, required: true },
  AirInput: { type: String, required: true },
  shots: { type: String, required: true },
  fillTime: { type: String, required: true },
  solidTime: { type: String, required: true },
  ejectTime: { type: String, required: true },
  totalTime: { type: String, required: true },
}, { collection: 'settings' }); 

const Settings = mongoose.model('Settings', userSchema);

module.exports =  Settings;