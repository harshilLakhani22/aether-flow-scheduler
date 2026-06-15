const tasks = [{ id: '1', title: 'Test', description: 'Hello', date: '2026-05-24' }];
const task = tasks[0];
const todayStr = '2026-05-25';
const updated = tasks.map(t => t.id === task.id ? { ...t, date: todayStr, updatedAt: new Date().toISOString() } : t);
console.log(updated);
