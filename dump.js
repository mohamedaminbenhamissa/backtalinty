const { exec } = require('child_process');

// MongoDB connection details
const mongoUri =
    'mongodb+srv://atsserver:wvAO5tfAKFdezL2n@cluster0.gvolzvb.mongodb.net/?retryWrites=true&w=majority'; // Replace with your MongoDB connection string
const outputDir = 'C:\\Users\\khale\\tmp\\dumped_data'; // Output directory for the dump

// Execute the mongoexport command
const mongoExportCommand = `mongorestore --uri ${mongoUri}`;
exec(mongoExportCommand, (error, stdout, stderr) => {
    if (error) {
        console.error(`Error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.error(`Error: ${stderr}`);
        return;
    }
    console.log('Data dumped successfully.');
});
