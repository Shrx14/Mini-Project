const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // Add this line to parse JSON requests

// Session middleware
app.use(session({
    secret: 'your-secret-key', // Change this to a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set true if using HTTPS
}));

// Serve static files from the 'public' directory
app.use(express.static('public'));

// MySQL database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'DBMS@FCRIT',
    database: 'RehabCenters'
});

db.connect(err => {
    if (err) {
        console.error('Database connection error: ', err);
        return;
    }
    console.log('Connected to the database.');
});

// Patient registration route
app.post('/register', (req, res) => {
    const { username, email, tele, password } = req.body;

    // Hash the password before storing it
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error('Error hashing password: ', err);
            return res.status(500).send('Server error');
        }

        // Inserting the new patient into the database
        const query = 'INSERT INTO Patient (Name, ContactInfo, Password) VALUES (?, ?, ?)';
        db.query(query, [username, tele, hash], (err, result) => {
            if (err) {
                console.error('Error inserting data: ', err);
                return res.status(500).send('Server error');
            }

            console.log('Patient registered with ID:', result.insertId);
            // Redirect to PatientLogin.html after successful registration
            res.redirect('PatientLogin.html');
        });
    });
});

// Patient login route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Retrieve the patient's information from the database
    const query = 'SELECT * FROM Patient WHERE Name = ?';
    db.query(query, [username], (err, results) => {
        if (err) {
            console.error('Error during login:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (results.length > 0) {
            const patient = results[0];

            // Compare the entered password with the stored hash
            bcrypt.compare(password, patient.Password, (err, match) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    return res.status(500).json({ success: false, message: 'Server error' });
                }

                if (match) {
                    req.session.patientId = patient.PatientID; // Store patient ID in session
                    res.json({ success: true, message: 'Login successful', patientId: patient.PatientID });
                } else {
                    res.status(401).json({ success: false, message: 'Invalid credentials' });
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    });
});

// Billing information route
app.get('/api/billing', (req, res) => {
    const patientId = req.session.patientId; // Retrieve patient ID from session

    if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Query to fetch billing information for the logged-in patient
    const query = 'SELECT * FROM Billing WHERE PatientID = ?';
    db.query(query, [patientId], (err, results) => {
        if (err) {
            console.error('Error fetching billing data:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        // Send the results back as a JSON response
        res.json({ success: true, data: results });
    });
});

// Fetch patient reports by patient ID
app.get('/api/reports', (req, res) => {
    const patientId = req.session.patientId; // Retrieve patient ID from session

    if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Query to fetch patient reports based on the logged-in patient's ID
    const query = 'SELECT * FROM PatientReport WHERE PatientID = ?';
    db.query(query, [patientId], (err, results) => {
        if (err) {
            console.error('Error fetching reports:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        res.json({ success: true, data: results });
    });
});

// Fetch resources route
app.get('/api/resources', (req, res) => {
    // Query to fetch all resources from the database
    const query = 'SELECT * FROM Resources'; // Adjust based on your actual table structure
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching resources:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        res.json({ success: true, data: results });
    });
});

// Fetch therapy sessions route
app.get('/api/therapy-sessions', (req, res) => {
    const patientId = req.session.patientId; // Retrieve patient ID from session

    if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Query to fetch therapy sessions based on the logged-in patient's ID
    const query = 'SELECT * FROM TherapySessions WHERE PatientID = ?'; // Adjust as necessary
    db.query(query, [patientId], (err, results) => {
        if (err) {
            console.error('Error fetching therapy sessions:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        res.json({ success: true, data: results });
    });
});

// Fetch treatment plans route
app.get('/api/treatment-plans', (req, res) => {
    const patientId = req.session.patientId; // Retrieve patient ID from session

    if (!patientId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Query to fetch treatment plans based on the logged-in patient's ID
    const query = 'SELECT * FROM TreatmentPlan WHERE PatientID = ?'; // Adjusted to use the correct table name
    db.query(query, [patientId], (err, results) => {
        if (err) {
            console.error('Error fetching treatment plans:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }

        res.json({ success: true, data: results });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
