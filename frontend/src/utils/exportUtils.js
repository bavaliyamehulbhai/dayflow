import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Export tasks to CSV
 * @param {Array} tasks - List of task objects
 */
export const exportToCSV = (tasks) => {
  if (!tasks || tasks.length === 0) return;

  const headers = ['Title', 'Status', 'Priority', 'Category', 'Due Date', 'Created At', 'Description'];
  const rows = tasks.map(task => [
    `"${task.title.replace(/"/g, '""')}"`,
    task.status,
    task.priority,
    task.category || 'General',
    task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : 'None',
    format(new Date(task.createdAt), 'yyyy-MM-dd'),
    `"${(task.description || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.setAttribute('href', url);
  link.setAttribute('download', `dayflow_tasks_${format(new Date(), 'yyyyMMdd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export tasks to PDF
 * @param {Array} tasks - List of task objects
 */
export const exportToPDF = (tasks) => {
  if (!tasks || tasks.length === 0) return;

  const doc = new jsPDF();
  const tableColumn = ["Title", "Status", "Priority", "Category", "Due Date"];
  const tableRows = [];

  tasks.forEach(task => {
    const taskData = [
      task.title,
      task.status,
      task.priority,
      task.category || 'General',
      task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : 'None',
    ];
    tableRows.push(taskData);
  });

  // Add branding
  doc.setFontSize(20);
  doc.setTextColor(124, 109, 250); // DayFlow Purple
  doc.text("DayFlow Task Export", 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on ${format(new Date(), 'PPPP p')}`, 14, 30);

  // Generate Table
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 40,
    theme: 'grid',
    headStyles: { fillColor: [124, 109, 250] },
    alternateRowStyles: { fillColor: [245, 245, 255] },
  });

  doc.save(`dayflow_tasks_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
