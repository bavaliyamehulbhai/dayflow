const mongoose = require('mongoose');
const Habit = require('./models/Habit');
const User = require('./models/User');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'demo@dayflow.ai' });
  if (!user) {
    console.log('Demo user not found');
    process.exit(0);
  }
  const habits = await Habit.find({ user: user._id });
  console.log(`Found ${habits.length} habits for demo user`);
  console.log(JSON.stringify(habits, null, 2));
  process.exit(0);
}
check();
