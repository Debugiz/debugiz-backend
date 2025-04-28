const express = require('express');
const dotenv = require('dotenv');
const ContactForm = require('./model/contact-form.model');
const connectDB = require('./db/db');
const XLSX = require('xlsx');
const cors = require('cors');

const app = express();
dotenv.config();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 2000;

app.post('/api/v1/submit', async (req, res) => {
    const { name, email, contactNumber, message } = req.body;
    const requiredFields = ['name', 'email', 'contactNumber', 'message'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length !== 0) {
        return res.status(400).json({ code: 400, message: 'Please provide all required fields', missingFields });
    }
    try {
        const contactForm = new ContactForm({
            name: name[0].toUpperCase() + name.slice(1),
            email,
            contactNumber,
            message
        });

        await contactForm.save();
        res.status(200).json({ code: 200, message: 'Message sent successfully' });
    } catch (err) {
        console.error('Error saving form:', err);
        res.status(500).json({ code: 500, message: 'Error saving form data' });
    }
});

app.get('/api/v1/download', async (req, res) => {
    if (req.query.password !== process.env.PASSWORD) {
        return res.status(401).json({ code: 401, message: 'Unauthorized: Incorrect password' });
    }
    try {
        const forms = await ContactForm.find();
        if (forms.length === 0) {
            return res.status(404).json({ code: 404, message: 'No data found' });
        }
        const formattedData = forms.map(entry => ({
            Name: entry.name,
            Email: entry.email,
            'Contact Number': entry.contactNumber,
            Message: entry.message,
        }));
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(formattedData, { header: ['Name', 'Email', 'Contact Number', 'Message'] });
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Contact Data');
                worksheet['!cols'] = [
            { wch: Math.max(...formattedData.map(row => row.Name.length), 10) + 5 },
            { wch: Math.max(...formattedData.map(row => row.Email.length), 10) + 5 },
            { wch: Math.max(...formattedData.map(row => row['Contact Number'].length), 10) + 5 },
            { wch: Math.max(...formattedData.map(row => row.Message.length), 20) + 5 },
        ];
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx', cellStyles: true });
        res.setHeader('Content-Disposition', 'attachment; filename="debugiz-contact-form.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (err) {
        console.error('Error generating Excel:', err);
        res.status(500).json({ code: 500, message: 'Error generating Excel file' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});
