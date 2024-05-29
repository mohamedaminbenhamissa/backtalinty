const oracledb = require('oracledb');

// Set the Oracle connection details
const dbConfig = {
    user: 'EMPTST',
    password: 'EMPTST',
    connectString: '185.206.134.166:1521/MNGDB.COM',
};

// Function to connect to Oracle and display all users
async function connectAndDisplayUsers() {
    let connection;

    try {
        // Connect to the Oracle database
        connection = await oracledb.getConnection(dbConfig);

        // Query to get all users
        const query = 'SELECT * FROM SE_JOB';

        // Execute the query
        const result = await connection.execute(query);

        // Display the list of users
        console.log('List of Oracle database users:');
        console.log(result.rows);
    } catch (error) {
        console.error('Error connecting to Oracle database:', error.message);
    } finally {
        // Release the connection
        if (connection) {
            try {
                await connection.close();
                console.log('Connection closed.');
            } catch (error) {
                console.error('Error closing connection:', error.message);
            }
        }
    }
}

// Call the function to connect and display users
connectAndDisplayUsers();
