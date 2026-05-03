const mongoose = require('mongoose');
require('dotenv').config();

const viewDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rehab-ai';
        console.log(`Connecting to: ${uri}...`);
        await mongoose.connect(uri);
        console.log('Connected!');
        
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        
        console.log('\nCollections found:');
        for (let col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`- ${col.name} (${count} documents)`);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
    }
};

viewDB();
