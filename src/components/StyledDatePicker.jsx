import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function StyledDatePicker({ selected, onChange, placeholder, ...props }) {
  return (
    <DatePicker
      selected={selected}
      onChange={onChange}
      placeholderText={placeholder}
      dateFormat="dd/MM/yyyy"
      className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] bg-white text-[#223163] font-semibold placeholder-gray-400 w-[170px]"
      popperClassName="z-50"
      todayButton="Today"
      isClearable
      {...props}
    />
  );
}
