// const express = require('express');
// const app = express();
// const csvParser = require('csv-parser');
// const csvWriter = require('csv-write-stream');
// const ftp = require('ftp');

// const ftpConfig = {
//     host: 'ftp.byethost32.com',
//     user: 'b32_34723087',
//     password: 'HelloWorld',
//   };

// app.get('/update-column', (req, res) => {
//   const ftpClient = new ftp();

//   ftpClient.on('ready', () => {
//     // Path to the CSV file on the FTP server
//     const remoteFilePath = '/RAGA/08-08-2023/RAGA_SEN_DATA.csv';

//     // Read the existing CSV file and update the column
//     ftpClient.get(remoteFilePath, (err, stream) => {
//       if (err) {
//         res.status(500).json({ error: 'Failed to fetch CSV file from FTP server.' });
//         return;
//       }

//       const csvWriterStream = csvWriter();
//       const updatedData = [];

//       stream
//         .pipe(csvParser())
//         .on('data', (row) => {
//           // Update the new column with data from an existing column
//           row['ACTUAL'] = row['FLOW']; // Modify as needed

//           updatedData.push(row);
//         })
//         .on('end', () => {
//           // Upload the updated data to the FTP server
//           const writeStream = ftpClient.put(remoteFilePath, (err) => {
//             if (err) {
//               res.status(500).json({ error: 'Failed to upload updated CSV file to FTP server.' });
//               return;
//             }

//             ftpClient.end();
//             res.json({ message: 'Column updated successfully.' });
//           });

//           csvWriterStream.pipe(writeStream);

//           // Write the updated data to the stream
//           updatedData.forEach((row) => {
//             csvWriterStream.write(row);
//           });

//           csvWriterStream.end();
//         });
//     });
//   });

//   ftpClient.connect(ftpConfig);
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


// ACTUAL HAVING TRUE DATA

// const express = require('express');
// const app = express();
// const csvParser = require('csv-parser');
// const ftp = require('ftp');

// const ftpConfig = {
//     host: 'ftp.byethost32.com',
//     user: 'b32_34723087',
//     password: 'HelloWorld',
//   };

// app.get('/csv-data', async (req, res) => {
//   const ftpClient = new ftp();

//   ftpClient.on('ready', () => {
//     // Path to the CSV file on the FTP server
//     const remoteFilePath = '/RAGA/08-08-2023/RAGA_SEN_DATA.csv';

//     // Read the existing CSV file and process data
//     ftpClient.get(remoteFilePath, (err, stream) => {
//       if (err) {
//         res.status(500).json({ error: 'Failed to fetch CSV file from FTP server.' });
//         return;
//       }

//       const responseData = [];
//       let count = 1 ;

//       stream
//         .pipe(csvParser())
//         .on('data', (row) => {
//           // Calculate new value for 'ACTUAL' column
//           const flowValue = parseFloat(row['FLOW']); // Convert to float
//           const actualValue = flowValue / 1000;

//           // Add 'ACTUAL' column to the row
//           row['ACTUAL'] = actualValue;
//           let sum = 0 ;
//           count++ ;
//           for(let i =1 ; i<=count ; i++){
//             sum+=actualValue
//           }
//           row['AVERAGE'] = (sum/count++).toFixed(2);

//           responseData.push(row);
//         })
//         .on('end', () => {
//           ftpClient.end();

//           // Send the modified response with additional columns
//           res.json(responseData);
//         });
//     });
//   });

//   ftpClient.connect(ftpConfig);
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });


const express = require('express');
const app = express();
const csvParser = require('csv-parser');
const ftp = require('ftp');

const ftpConfig = {
    host: 'ftp.byethost32.com',
    user: 'b32_34723087',
    password: 'HelloWorld',
  };

app.get('/csv-data', async (req, res) => {
  const ftpClient = new ftp();

  ftpClient.on('ready', () => {
    // Path to the CSV file on the FTP server
    const remoteFilePath = '/RAGA/08-08-2023/RAGA_SEN_DATA.csv';

    // Read the existing CSV file and process data
    ftpClient.get(remoteFilePath, (err, stream) => {
      if (err) {
        res.status(500).json({ error: 'Failed to fetch CSV file from FTP server.' });
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
          row['ACTUAL FLOW'] = actualValueFlow;
          row['ACTUAL PREASURE'] = actualValuePreasure;
          row['ACTUAL TEMP'] = actualValueTemp;
          let pCalc = (actualValuePreasure-inputPreasure).toFixed(2);
          row['PREASURE DIFFRENCE'] = pCalc  //4.85 -> Given By User
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
          row['FLOW_AVERAGE'] = runningAverage;

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


