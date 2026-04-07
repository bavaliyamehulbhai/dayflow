const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Note = require('../models/Note');
const Schedule = require('../models/Schedule');
const { format, addDays, subDays } = require('date-fns');

const seedDemoData = async (userId) => {
  try {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(today, 1), 'yyyy-MM-dd');

    // 1. Clear existing data
    await Promise.all([
      Task.deleteMany({ user: userId }),
      Habit.deleteMany({ user: userId }),
      Note.deleteMany({ user: userId }),
      Schedule.deleteMany({ user: userId })
    ]);

    // 2. Seed Tasks
    const tasks = [
      {
        user: userId,
        title: 'Complete Quarter Update Presentation',
        description: 'Finalize the Q1 results for the stakeholder meeting. Include the growth charts and user retention data.',
        priority: 'urgent',
        status: 'pending',
        category: 'Work',
        tags: ['strategy', 'presentation'],
        dueDate: today,
        estimatedMinutes: 45
      },
      {
        user: userId,
        title: 'Review System Architecture Design',
        description: 'Go through the new microservices proposal and check for potential bottlenecks in the event bus.',
        priority: 'high',
        status: 'in-progress',
        category: 'Engineering',
        tags: ['architecture', 'review'],
        dueDate: today,
        estimatedMinutes: 60
      },
      {
        user: userId,
        title: 'Prepare Weekly Newsletter Draft',
        description: 'Focus on the new product features and include a shoutout to the top community contributors.',
        priority: 'medium',
        status: 'pending',
        category: 'Marketing',
        tags: ['content', 'community'],
        dueDate: addDays(today, 1),
        estimatedMinutes: 30
      },
      {
        user: userId,
        title: 'Refactor Auth Interceptor',
        description: 'Clean up the error handling logic and add better logging for 401/403 states.',
        priority: 'low',
        status: 'completed',
        category: 'Engineering',
        tags: ['refactor', 'auth'],
        dueDate: subDays(today, 1),
        completedAt: subDays(today, 1),
        actualMinutes: 40
      },
      {
        user: userId,
        title: 'Water Plants',
        priority: 'low',
        status: 'pending',
        category: 'Personal',
        tags: ['routine'],
        dueDate: today,
        estimatedMinutes: 5
      }
    ];
    await Task.insertMany(tasks);

    // 3. Seed Habits (Rituals)
    const habits = [
      {
        user: userId,
        name: 'Deep Work Session',
        description: 'Minimum 90 minutes of undistracted focus on primary goals.',
        color: '#7c6dfa',
        icon: '🧠',
        frequency: 'weekdays',
        targetCount: 1,
        completions: [
          { date: yesterdayStr, count: 1 },
          { date: format(subDays(today, 2), 'yyyy-MM-dd'), count: 1 },
          { date: format(subDays(today, 3), 'yyyy-MM-dd'), count: 1 }
        ],
        streak: { current: 3, longest: 14 }
      },
      {
        user: userId,
        name: 'Morning Meditation',
        description: 'Mindfulness practice to set clear intentions for the day.',
        color: '#00f2fe',
        icon: '🧘',
        frequency: 'daily',
        targetCount: 1,
        completions: [
          { date: todayStr, count: 1 },
          { date: yesterdayStr, count: 1 }
        ],
        streak: { current: 2, longest: 7 }
      },
      {
        user: userId,
        name: 'Physical Velocity',
        description: 'High-intensity training or focused strength session.',
        color: '#ff4d7d',
        icon: '⚡',
        frequency: 'custom',
        customDays: [1, 3, 5], // Mon, Wed, Fri
        targetCount: 1,
        completions: [
          { date: yesterdayStr, count: 1 }
        ],
        streak: { current: 1, longest: 5 }
      }
    ];
    await Habit.insertMany(habits);

    // 4. Seed Notes (Knowledge)
    const notes = [
      {
        user: userId,
        title: 'Product Strategy Q3/Q4',
        content: '# Core Objectives\n1. Enhanced User Retention via Gamification\n2. AI-Driven Scheduling Assistant\n3. Cross-Platform Mobile Sync\n\n# Potential Roadblocks\n- Infrastructure scaling for real-time sync\n- Training data for the scheduling AI model',
        color: '#7c6dfa',
        tags: ['strategy', 'product'],
        isPinned: true
      },
      {
        user: userId,
        title: 'Weekly Wins & Reflection',
        content: '- Successfully deployed the new landing page\n- Reduced API latency by 15% via Redis caching\n- Onboarded three new premium clients\n\n**Next Week focus**: Hardening the security layer.',
        color: '#ff923c',
        tags: ['review', 'growth']
      },
      {
        user: userId,
        title: 'Engineering Best Practices',
        content: '1. Use standard semantic commit messages.\n2. Always include unit tests for core utilities.\n3. Implement proper error boundaries in the UI.\n4. Design for failure; use circuit breakers where appropriate.',
        color: '#00ccb1',
        tags: ['engineering', 'standards']
      }
    ];
    await Note.insertMany(notes);

    // 5. Seed Schedule (Timeline)
    const schedule = [
      {
        user: userId,
        title: 'Strategy Briefing',
        description: 'Alignment meeting with the product team.',
        date: todayStr,
        startTime: '10:00',
        endTime: '11:00',
        color: '#7c6dfa',
        category: 'work'
      },
      {
        user: userId,
        title: 'Deep Focus Block',
        description: 'No-interruptions zone for core development.',
        date: todayStr,
        startTime: '14:00',
        endTime: '16:00',
        color: '#00f2fe',
        category: 'work'
      },
      {
        user: userId,
        title: 'Velocity Session (Gym)',
        date: todayStr,
        startTime: '17:30',
        endTime: '18:30',
        color: '#ff4d7d',
        category: 'health'
      },
      {
        user: userId,
        title: 'Reflection & Planning',
        date: todayStr,
        startTime: '21:00',
        endTime: '21:30',
        color: '#ff923c',
        category: 'personal'
      }
    ];
    await Schedule.insertMany(schedule);

    console.log(`[SEEDER] Successfully populated demo data for User: ${userId}`);
    return true;
  } catch (err) {
    console.error(`[SEEDER] Error seeding demo data for ${userId}:`, err);
    throw err;
  }
};

module.exports = { seedDemoData };
