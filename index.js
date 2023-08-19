const express = require('express');
const app = express();
const fs = require('fs');
const csvParser = require('csv-parser');
const csvWriter = require('csv-write-stream');
const ftp = require('ftp');
const bodyParser = require('body-parser');
const User = require('./models/user.js');

app.use(bodyParser.json());

const ftpConfig = {
  host: 'ftp.byethost32.com',
  user: 'b32_34723087',
  password: 'HelloWorld',
};

// NEW ONE

app.get('/csv-data', async (req, res) => {
  const ftpClient = new ftp();

  ftpClient.on('ready', () => {
    // Path to the CSV file on the FTP server
    const remoteFilePath = '/RAGA/18-08-2023/RAGA_18-08-2023.csv';

    // Read the existing CSV file and process data
    ftpClient.get(remoteFilePath, (err, stream) => {
      if (err) {
        res.status(500).json({ error:'Failed to fetch CSV file from FTP server.' });
        console.log(err) ;
        return;
      }

      const responseData = [];
      let sumOfActualValues = 0;
      let rowCount = 0;
      let inputPreasure = 3.05 ;
      let inputDiff = 0.5 ;
      let setTemp = 4.55 ;

      stream
        .pipe(csvParser())
        .on('data', (row) => {
          // Calculate new value for 'ACTUAL' column
          const flowValue = parseFloat(row['FLOW']);
          const presasueValue = parseFloat(row['PSI']);
          const actualValueFlow = flowValue / 1000;
          const actualValuePreasure = flowValue / 1000;
          const actualValueTemp = flowValue / 1000;
          row['ACTUAL FLOW'] = actualValueFlow ;
          row['ACTUAL PREASURE'] = actualValuePreasure ;
          row['ACTUAL TEMP'] = actualValueTemp ;
          let pCalc = (actualValuePreasure-inputPreasure).toFixed(2);
          row['PREASURE DIFFRENCE'] = pCalc ;  //4.85 -> Given By User
          if(pCalc > inputDiff){
            row['PREASURE STATUS'] = "RED"
          }
          else{
            row['PREASURE STATUS'] = "GREEN"
          }

          if((setTemp > actualValueTemp) || (setTemp < actualValueTemp)){
            row['TEMPRATURE STATUS'] = "RED"
          }
          else{
            row['TEMPRATURE STATUS'] = "GREEN"
          }
          // Calculate running average
          sumOfActualValues += actualValueFlow;
          rowCount++;
          const runningAverage = (sumOfActualValues / rowCount).toFixed(2);
          row['FLOW_AVERAGE'] = runningAverage ;

          responseData.push(row);
        })
        .on('end', () => {
          ftpClient.end();

          // Send the modified response with additional columns
          res.json(responseData);
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
      res.status(200).json({ message: 'Login successful',  userId: user._id });
       // res.json({ userId: user._id });
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
