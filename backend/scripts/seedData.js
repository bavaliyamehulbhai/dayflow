require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Schedule = require('../models/Schedule');

const seedData = async () => {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        const userEmail = process.argv[2];
        let user;
        if (userEmail) {
            user = await User.findOne({ email: userEmail });
        } else {
            user = await User.findOne().sort({ createdAt: 1 });
        }

        if (!user) {
            console.error('❌ No user found. Please register a user first.');
            process.exit(1);
        }

        console.log(`🌱 Seeding data for user: ${user.email} (${user._id})`);

        // 1. Clear existing activities for this user
        await Activity.deleteMany({ user: user._id });
        console.log('🧹 Cleared old activity logs.');

        // 2. Generate 90 days of activity
        const activities = [];
        for (let i = 89; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Random intensity (0-4) with bias towards 2-3
            const intensity = Math.floor(Math.random() * 5);
            const score = intensity * 25 + Math.floor(Math.random() * 20);

            if (intensity > 0) {
                activities.push({
                    user: user._id,
                    date: dateStr,
                    tasksCompleted: Math.floor(Math.random() * 8) + 1,
                    focusMinutes: Math.floor(Math.random() * 120) + 30,
                    pomodoros: Math.floor(Math.random() * 4) + 1,
                    habitsCompleted: Math.floor(Math.random() * 5),
                    score,
                    intensity
                });
            }
        }
        await Activity.insertMany(activities);
        console.log(`✅ Seeded ${activities.length} activity logs.`);

        // 3. Seed some example tasks
        const tasksToClear = await Task.countDocuments({ user: user._id });
        if (tasksToClear < 5) {
            const taskData = [
                { title: 'Master React performance', priority: 'high', status: 'pending', user: user._id },
                { title: 'Design premium glassmorphic UI', priority: 'urgent', status: 'pending', user: user._id },
                { title: 'Implement AI Coach logic', priority: 'medium', status: 'completed', user: user._id },
                { title: 'Daily workout session', priority: 'low', status: 'pending', user: user._id },
                { title: 'Read 20 pages of Deep Work', priority: 'high', status: 'pending', user: user._id }
            ];
            await Task.insertMany(taskData);
            console.log('✅ Seeded 5 example tasks.');
        }

        // 4. Seed some example habits
        const habitsCount = await Habit.countDocuments({ user: user._id });
        if (habitsCount === 0) {
            const habitData = [
                { name: 'Cold Shower', icon: '❄️', color: '#5ffad1', frequency: 'daily', user: user._id, streak: { current: 5, longest: 12 } },
                { name: 'Meditation', icon: '🧘', color: '#8272ff', frequency: 'daily', user: user._id, streak: { current: 3, longest: 7 } },
                { name: 'Reading', icon: '📚', color: '#ff9a6d', frequency: 'daily', user: user._id, streak: { current: 0, longest: 15 } }
            ];
            await Habit.insertMany(habitData);
            console.log('✅ Seeded 3 example habits.');
        }

        console.log('\n✨ Seeding complete! Restart your server to see the magic.');
        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedData();
