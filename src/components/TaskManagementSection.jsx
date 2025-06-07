import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { format, startOfWeek, endOfWeek } from "date-fns";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const STATUSES = [
  { key: "todo", label: "To Do", color: "bg-blue-200" },
  { key: "inprogress", label: "In Progress", color: "bg-yellow-200" },
  { key: "done", label: "Done", color: "bg-green-200" }
];

// Helper to fetch all tasks for the selected week
const fetchWeeklyTasks = async (userId, weekStartDate) => {
  const start = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  const end = endOfWeek(weekStartDate, { weekStartsOn: 1 });
  const tasksRef = collection(db, "users", userId, "tasks");
  const q = query(
    tasksRef,
    where("date", ">=", start),
    where("date", "<=", end)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

const TaskSummarySection = ({ allTasks, weekStartDate }) => {
  // Compute week days
  const daysOfWeek = [];
  let d = startOfWeek(weekStartDate, { weekStartsOn: 1 });
  for (let i = 0; i < 7; i++) {
    daysOfWeek.push(format(new Date(d.getTime() + i * 86400000), "yyyy-MM-dd"));
  }

  // Aggregate data
  const summary = daysOfWeek.map(day => ({
    date: day,
    todo: 0,
    inprogress: 0,
    done: 0,
    total: 0,
  }));

  allTasks.forEach(task => {
    const taskDate = task.date?.toDate ? task.date.toDate() : new Date(task.date);
    const dateStr = format(taskDate, "yyyy-MM-dd");
    const idx = summary.findIndex(r => r.date === dateStr);
    if (idx !== -1) {
      summary[idx].total++;
      if (task.status === "done") summary[idx].done++;
      else if (task.status === "inprogress") summary[idx].inprogress++;
      else summary[idx].todo++;
    }
  });

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

const TaskManagementSection = ({ userId, isRootAdmin }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [taskText, setTaskText] = useState("");
  const [tasks, setTasks] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Fetch tasks for the selected date (for Kanban)
  useEffect(() => {
    let ignore = false;
    setErrorMsg("");
    setLoading(true);
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    const fetchTasksForDate = async () => {
      try {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);
        const tasksRef = collection(db, "users", userId, "tasks");
        const q = query(
          tasksRef,
          where("date", ">=", start),
          where("date", "<=", end),
          orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        if (!ignore) {
          setTasks(
            snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          );
        }
      } catch (err) {
        if (!ignore) setErrorMsg("Failed to load tasks: " + err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchTasksForDate();
    return () => { ignore = true; };
  }, [userId, selectedDate]);

  // Fetch all tasks for the week (for summary)
  useEffect(() => {
    if (!userId) return;
    fetchWeeklyTasks(userId, selectedDate).then(setWeeklyTasks);
  }, [userId, selectedDate, taskText]); // re-fetch when tasks may change

  // Add task
  const handleAddTask = async () => {
    setErrorMsg("");
    if (!taskText.trim()) {
      setErrorMsg("Please enter a task.");
      return;
    }
    try {
      const tasksRef = collection(db, "users", userId, "tasks");
      await addDoc(tasksRef, {
        text: taskText.trim(),
        date: new Date(selectedDate),
        status: "todo",
        createdAt: serverTimestamp(),
      });
      setTaskText("");
      setTimeout(() => setSelectedDate(new Date(selectedDate)), 400); // force refetch
    } catch (err) {
      setErrorMsg("Failed to add task: " + err.message);
    }
  };

  // Update task status
  const handleMoveTask = async (taskId, newStatus) => {
    try {
      const taskDocRef = doc(db, "users", userId, "tasks", taskId);
      await updateDoc(taskDocRef, { status: newStatus });
      setTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
      fetchWeeklyTasks(userId, selectedDate).then(setWeeklyTasks);
    } catch (err) {
      setErrorMsg("Failed to move task: " + err.message);
    }
  };

  // Edit task
  const handleEditTask = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const handleSaveEdit = async (taskId) => {
    if (!editText.trim()) return;
    try {
      const taskDocRef = doc(db, "users", userId, "tasks", taskId);
      await updateDoc(taskDocRef, { text: editText });
      setTasks(tasks => tasks.map(task =>
        task.id === taskId ? { ...task, text: editText } : task
      ));
      setEditingId(null);
      setEditText("");
      fetchWeeklyTasks(userId, selectedDate).then(setWeeklyTasks);
    } catch (err) {
      setErrorMsg("Failed to edit task: " + err.message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  // Delete task
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, "users", userId, "tasks", taskId));
      setTasks(prev => prev.filter(task => task.id !== taskId));
      fetchWeeklyTasks(userId, selectedDate).then(setWeeklyTasks);
    } catch (err) {
      setErrorMsg("Failed to delete task: " + err.message);
    }
  };

  if (!userId) return <div className="text-center py-8 text-gray-400">Loading user...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 tracking-tight text-blue-900">Task Management (Kanban)</h2>
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl shadow">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700">Choose Date:</span>
          <DatePicker
            selected={selectedDate}
            onChange={date => setSelectedDate(date)}
            className="border rounded px-2 py-1"
          />
        </div>
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={taskText}
            onChange={e => setTaskText(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 border rounded px-3 py-2"
          />
          <button
            onClick={handleAddTask}
            className="bg-blue-600 shadow-md text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            disabled={!taskText.trim()}
          >
            Add
          </button>
        </div>
        {errorMsg && <div className="text-red-500">{errorMsg}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        {STATUSES.map(status => (
          <div key={status.key} className="bg-gray-50 rounded-xl shadow p-4 flex flex-col">
            <div className={`font-bold text-lg mb-4 p-2 rounded ${status.color} text-gray-700 text-center`}>
              {status.label}
            </div>
            <div className="flex-1 space-y-3">
              {loading ? (
                <div className="text-gray-400 italic">Loading...</div>
              ) : (
                tasks
                  .filter(task => (task.status || "todo") === status.key)
                  .map(task => (
                    <div
                      key={task.id}
                      className="bg-white p-4 rounded shadow flex flex-col gap-2 border hover:border-blue-400 group transition"
                    >
                      {editingId === task.id ? (
                        <div className="flex flex-col gap-2">
                          <input
                            type="text"
                            value={editText}
                            onChange={e => setEditText(e.target.value)}
                            className="border px-2 py-1 rounded"
                          />
                          <div className="flex gap-2">
                            <button
                              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                              onClick={() => handleSaveEdit(task.id)}
                            >
                              Save
                            </button>
                            <button
                              className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={`font-medium ${task.status === "done" ? "line-through text-gray-400" : ""}`}>
                            {task.text}
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            {STATUSES.filter(s => s.key !== status.key).map(s => (
                              <button
                                key={s.key}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs hover:bg-blue-300"
                                onClick={() => handleMoveTask(task.id, s.key)}
                              >
                                Move to {s.label}
                              </button>
                            ))}
                            <button
                              className="bg-yellow-400 text-white px-2 py-1 rounded hover:bg-yellow-500 text-xs"
                              onClick={() => handleEditTask(task)}
                              disabled={task.status === "done"}
                            >
                              Edit
                            </button>
                            <button
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-xs"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              Delete
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {task.createdAt?.seconds
                              ? "Created: " + new Date(task.createdAt.seconds * 1000).toLocaleString()
                              : ""}
                          </div>
                        </>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
      {/* --- Task Summary Section Below Kanban --- */}
      <TaskSummarySection allTasks={weeklyTasks} weekStartDate={selectedDate} />
    </div>
  );
};

export default TaskManagementSection;
