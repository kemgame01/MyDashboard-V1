import React, { useMemo } from "react";
import { startOfWeek, endOfWeek, format, isWithinInterval } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

// allTasks = all tasks for the week, already fetched (array of objects)
const TaskSummarySection = ({ allTasks, weekStartDate }) => {
  // Compute week days
  const daysOfWeek = [];
  let d = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  for (let i = 0; i < 7; i++) {
    daysOfWeek.push(format(new Date(d.getTime() + i * 86400000), "yyyy-MM-dd"));
  }

  // Aggregate data
  const summary = useMemo(() => {
    const res = daysOfWeek.map(day => ({
      date: day,
      todo: 0,
      inprogress: 0,
      done: 0,
      total: 0,
    }));
    allTasks.forEach(task => {
      const taskDate = task.date?.toDate ? task.date.toDate() : new Date(task.date);
      const dateStr = format(taskDate, "yyyy-MM-dd");
      const idx = res.findIndex(r => r.date === dateStr);
      if (idx !== -1) {
        res[idx].total++;
        if (task.status === "done") res[idx].done++;
        else if (task.status === "inprogress") res[idx].inprogress++;
        else res[idx].todo++;
      }
    });
    return res;
  }, [allTasks, daysOfWeek]);

  // Total for the week
  const weekTotal = summary.reduce((a, b) => a + b.total, 0);
  const weekDone = summary.reduce((a, b) => a + b.done, 0);

  return (
    <div className="mt-10">
      <h3 className="text-xl font-bold mb-4 text-blue-800">Weekly Task Summary</h3>

      <div className="mb-4">
        <div className="text-gray-700 font-semibold">
          <span>This week: </span>
          <span className="text-blue-700">{weekTotal}</span> tasks,
          <span className="text-green-600 ml-2">{weekDone}</span> done (
          <span className="text-blue-500 font-bold">
            {weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0}%
          </span>
          )
        </div>
      </div>

      <div className="bg-white rounded-xl shadow mb-8 p-4">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={summary}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={d => d.slice(5)} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="done" stackId="a" fill="#34d399" name="Done" />
            <Bar dataKey="inprogress" stackId="a" fill="#fbbf24" name="In Progress" />
            <Bar dataKey="todo" stackId="a" fill="#3b82f6" name="To Do" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 font-semibold">Date</th>
              <th className="p-2">Total</th>
              <th className="p-2 text-green-700">Done</th>
              <th className="p-2 text-yellow-700">In Progress</th>
              <th className="p-2 text-blue-700">To Do</th>
              <th className="p-2 text-blue-700">Completion %</th>
            </tr>
          </thead>
          <tbody>
            {summary.map(day => (
              <tr key={day.date} className="border-b hover:bg-gray-50">
                <td className="p-2">{day.date}</td>
                <td className="p-2">{day.total}</td>
                <td className="p-2 text-green-700">{day.done}</td>
                <td className="p-2 text-yellow-700">{day.inprogress}</td>
                <td className="p-2 text-blue-700">{day.todo}</td>
                <td className="p-2">
                  {day.total > 0 ? Math.round((day.done / day.total) * 100) : 0}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TaskSummarySection;
