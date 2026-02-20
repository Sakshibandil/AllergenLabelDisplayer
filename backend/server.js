const express = require('express');
const cors = require('cors');
const multer = require('multer');
const xlsx = require('xlsx');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(cors({
    maxAge: 86400 
}));
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        fs.unlinkSync(req.file.path);

        const recipes = data.map(row => {
            const keys = Object.keys(row);
            const recipeName = row[keys[0]]; 
            const ingredientsStr = row[keys[1]] || ''; 
            
            return {
                name: recipeName,
                ingredients: ingredientsStr.toString().split(',').map(i => i.trim()).filter(i => i)
            };
        }).filter(r => r.name);

        res.json({ success: true, recipes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to parse Excel file.' });
    }
});

app.post('/api/allergens', async (req, res) => {
    try {
        const response = await axios.post('https://task.cover360.co.in/api/allergens', req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ success: false, message: 'External API Error' });
    }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));