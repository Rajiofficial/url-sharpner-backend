import mongoose from 'mongoose';

const connect = async () => {
  try {
    await mongoose.connect(`mongodb+srv://raji:ranjithraj@cluster0.aa9ahmk.mongodb.net/`);
    console.log('Successfully connected with the Database 👍👌');
  } catch (error) {
    console.error('something went wrong ❌', error);
  }
};

export default connect;
