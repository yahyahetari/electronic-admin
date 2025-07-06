import mongoose from 'mongoose';

export function mongooseConnect() {
    if (mongoose.connection.readyState === 1) {
        console.log('Connected to MongoDB');
        return;
    } else {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined');
        }
        return mongoose.connect(uri)
            .then(() => {
                console.log('Connected to MongoDB');
            })
            .catch((error) => {
                console.error('Error connecting to MongoDB:', error);
                throw error;
            });
    }
}
