const express = require('express');
const app = express();
const fs = require('fs');
const csvParser = require('csv-parser');
const csvWriter = require('csv-write-stream');
const ftp = require('ftp');
const bodyParser = require('body-parser');
const User = require('./models/user.js');
const Settings = require('./models/settings.js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

app.use(bodyParser.json());

const ftpConfig = {
  host: 'ftp.byethost32.com',
  user: 'b32_34723087',
  password: 'HelloWorld',
};

// NEW ONE

app.get("/csv-data", async (req, res) => {
  const ftpClient = new ftp();

  ftpClient.on("ready", () => {
    // Path to the CSV file on the FTP server
    const remoteFilePath = "/RAGA/05-09-2023/RAGA_05-09-2023.csv";

    // Read the existing CSV file and process data
    ftpClient.get(remoteFilePath, (err, stream) => {
      if (err) {
        res.status(500).json({ error: "Failed to fetch CSV file from FTP server." });
        // res.send(err) ;
        return;
      }

      const sensorData = {
        abs_tdf001: [],
        abs_tdf002: [],
        abs_tdf003: [],
        abs_tdf004: [],
        abs_tdf005: [],
        abs_tdf006: [],
        abs_tdf007: [],
        abs_tdf008: [],
      };

      stream
        .pipe(csvParser())
        .on("data", (row) => {
          const sensorId = row["SENSOR_ID"];
          // const responseData = [];
          let sumOfActualValues = 0;
          let rowCount = 0;
          let inputPreasure = 3.05;
          let inputDiff = 0.5;
          let setTemp = 4.55;

          // Handle "NOT_CNTD" case
          if (row["REMARK"] === "NOT_CNTD.") {
            row["ACTUAL FLOW"] = 0;
            row["ACTUAL PREASURE"] = 0;
            row["ACTUAL TEMP"] = 0;
            row["PREASURE DIFFRENCE"] = 0;
            row["PREASURE STATUS"] = 0;
            row["TEMPRATURE STATUS"] = 0;
            row["FLOW_AVERAGE"] = 0;
          } else {
            const flowValue = parseFloat(row["FLOW"]);
            const presasueValue = parseFloat(row["PSI"]);
            const tempValue = parseFloat(row["TEMP"]);
            const actualValueFlow = (flowValue - 820) * 0.625;
            const actualValuePreasure = presasueValue / 27.07 - 1.25;
            const actualValueTemp = tempValue / 24.2 - 50;

            // Calculate running average
            sumOfActualValues += actualValueFlow;
            rowCount++;
            const runningAverage = (sumOfActualValues / rowCount).toFixed(1);

            row["ACTUAL FLOW"] = actualValueFlow.toFixed(1);
            row["ACTUAL PREASURE"] = actualValuePreasure.toFixed(1);
            row["ACTUAL TEMP"] = actualValueTemp.toFixed(1);
            let pCalc = (actualValuePreasure - inputPreasure).toFixed(1);
            row["PREASURE DIFFRENCE"] = pCalc; //4.85 -> Given By User
            if (parseFloat(pCalc) > inputDiff) {
              row["PREASURE STATUS"] = "RED";
            } else {
              row["PREASURE STATUS"] = "GREEN";
            }

            if (setTemp > actualValueTemp || setTemp < actualValueTemp) {
              row["TEMPRATURE STATUS"] = "RED";
            } else {
              row["TEMPRATURE STATUS"] = "GREEN";
            }

            row["FLOW_AVERAGE"] = runningAverage;
          }

          // Push row data to the appropriate array
          if (sensorData[sensorId]) {
            sensorData[sensorId].push(row);
          }
        })
        .on("end", () => {
          ftpClient.end();

          // Convert the sensorData object into an array of objects
          const result = Object.keys(sensorData).map((sensorId) => ({
            SENSOR_ID: sensorId,
            data: sensorData[sensorId],
          }));

          // Send the modified response with separate arrays for each SENSOR_ID
          res.json(result);
        });
    });
  });

  ftpClient.connect(ftpConfig);
});

app.post('/login', async (req, res) => {
  try {
    const {companyCode, username, password } = req.body;
    const user = await User.findOne({companyCode, username , password });
    
    if (user) {
      // res.status(200).json({ message: 'Login successful' });
      res.status(200).json({Message: 'Login Done', userId: user._id });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
    console.log(error)
  }
});

app.post('/change-password', async (req, res) => {
  const { companyCode, username, newPassword , confirmPassword } = req.body;

  try {
    // Check if the user exists with the given company code and username
    const user = await User.findOne({ companyCode, username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's password
    if(newPassword===confirmPassword){
      user.password = newPassword;
      await user.save();
      return res.json({ message: 'Password changed successfully' });
    }
    else{
      return res.status(401).json({ message: 'Please Enter the same Password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred' });
  }
});

app.post('/settings', async (req, res) => {
  try {
    const {mold, monitorNumber, systemNumber, core, corePins, PBDDTime, AirInput, shots, fillTime, solidTime, ejectTime, totalTime} = req.body;
    const newSettings = new Settings({ mold, monitorNumber, systemNumber, core, corePins, PBDDTime, AirInput, shots, fillTime, solidTime, ejectTime, totalTime});
    await newSettings.save();
    res.status(200).json({ message: 'Data Saved successfully' });
  } catch (error) {
    res.status(500).json({ error: 'An error occurred' });
  }
});

// FORGET PASSWORD TRIAL

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'blockverseinfotechsolutions@gmail.com',
    pass: 'mtchlizgjeuxuwjc',
  },
});

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};
// API to send OTP to user's email
app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    user.resetToken = otp;
    await user.save();

    const mailOptions = {
      from: 'blockverseinfotechsolutions@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      text: `Your OTP for password reset: ${otp}`,
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'OTP sent to your email',otp:otp });
  } catch (error) {
    // res.status(500).json({ error: 'An error occurred' });
    res.send(error)
  }
});

// API to verify OTP and update password
app.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email, resetToken: otp });
    if (!user) {
      return res.status(400).json({ message: 'Invalid OTP or email' });
    }

    // Hash and update the password
    user.password = newPassword;
    user.resetToken = null;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    // res.status(500).json({ error: 'An error occurred' });
    res.send(error)
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
