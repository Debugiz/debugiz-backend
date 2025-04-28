const express = require('express');
const app = express();
const dotenv = require('dotenv');
const fs = require('fs');
const XLSX = require('xlsx');
const path = require('path');
const mongoose = require('mongoose');
const ContactForm = require('./model/contact-form.model');
const connectDB = require('./db/db');
dotenv.config();

connectDB();

const PORT = process.env.PORT || 2000;
const FILE_PATH = path.join(__dirname, 'debugiz-contact-form.xlsx');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/v1/submit', async (req, res) => {
    const formData = req.body;
    const requiredFields = ['name', 'email', 'contactNumber', 'message'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length !== 0) {
        return res.status(400).json({ code: 400, message: 'Please provide all the required fields', missingFields: missingFields });
    }

    try {
        const contactForm = new ContactForm({
            name: formData.name[0].toUpperCase() + formData.name.slice(1),
            email: formData.email,
            contactNumber: formData.contactNumber,
            message: formData.message
        });

        await contactForm.save();
        let workbook;
        let worksheet;

        if (fs.existsSync(FILE_PATH)) {
            workbook = XLSX.readFile(FILE_PATH);
            worksheet = workbook.Sheets[workbook.SheetNames[0]];
        } else {
            workbook = XLSX.utils.book_new();
            const headers = ['Name', 'Email', 'Contact Number', 'Message'];
            worksheet = XLSX.utils.json_to_sheet([], { header: headers });
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Contact Form Details');
        }

        const data = XLSX.utils.sheet_to_json(worksheet);
        const formattedData = {
            Name: formData.name[0].toUpperCase() + formData.name.slice(1),
            Email: formData.email,
            'Contact Number': formData.contactNumber,
            Message: formData.message,
        };

        data.push(formattedData);
        const newWorksheet = XLSX.utils.json_to_sheet(data, { header: ['Name', 'Email', 'Contact Number', 'Message'] });
        workbook.Sheets[workbook.SheetNames[0]] = newWorksheet;
        newWorksheet['!cols'] = [
            { wpx: Math.max(...data.map(row => row.Name.length)) * 10 },
            { wpx: Math.max(...data.map(row => row.Email.length)) * 10 },
            { wpx: Math.max(...data.map(row => row['Contact Number'].length)) * 10 },
            { wpx: Math.max(...data.map(row => row.Message.length)) * 10 },
        ];

        XLSX.writeFile(workbook, FILE_PATH);
        res.status(200).json({ code: 200, message: 'Message sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ code: 500, message: 'Error saving data' });
    }
});

app.get('/api/v1/download', (req, res) => {
    if (fs.existsSync(FILE_PATH)) {
        res.download(FILE_PATH, 'debugiz-contact-form.xlsx');
    } else {
        res.status(404).json({ code: 404, message: 'No file found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
