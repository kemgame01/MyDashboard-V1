import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
      const snap = await getDocs(q);
      setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchLogs();
  }, []);
  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-blue-900">Audit Log</h2>
      <div className="overflow-x-auto rounded-xl shadow bg-white">
        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr className="bg-blue-50 text-gray-800 uppercase text-xs sticky top-0 z-10">
              <th className="p-3 min-w-[140px] font-semibold tracking-wider text-left">Time</th>
              <th className="p-3 min-w-[110px] font-semibold tracking-wider text-left">Action</th>
              <th className="p-3 min-w-[160px] font-semibold tracking-wider text-left">By</th>
              <th className="p-3 min-w-[160px] font-semibold tracking-wider text-left">Target</th>
              <th className="p-3 min-w-[250px] font-semibold tracking-wider text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-8">
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr
                  key={log.id}
                  className={
                    idx % 2 === 0
                      ? "bg-white hover:bg-blue-50"
                      : "bg-blue-50 hover:bg-blue-100"
                  }
                >
                  <td className="p-3 whitespace-nowrap">{log.timestamp?.toDate?.().toLocaleString?.() || ""}</td>
                  <td className="p-3 font-semibold text-blue-700">{log.action}</td>
                  <td className="p-3 break-all">{log.performedBy}</td>
                  <td className="p-3 break-all">{log.target}</td>
                  <td className="p-3">
                    <div
                      className="max-w-[400px] whitespace-pre-wrap break-words text-xs p-2 bg-gray-50 rounded border border-gray-200 overflow-x-auto"
                      style={{ maxHeight: 120 }}
                    >
                      {typeof log.details === "object"
                        ? JSON.stringify(log.details, null, 2)
                        : String(log.details || "")}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;
