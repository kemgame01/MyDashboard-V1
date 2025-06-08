import React from "react";
import { Combobox } from "@headlessui/react";

export default function SalesCombobox({
  label,
  value,
  onChange,
  inputValue,
  onInputChange,
  options,
  loading,
  placeholder,
  displayKey = "name",
  renderOption, // optional: function(option) for custom display
  required = false,
}) {
  // What should show in the input:
  // - If user is typing: inputValue
  // - If inputValue is blank, and value exists: show value[displayKey]
  // - Else, blank
  const showValue = inputValue !== undefined && inputValue !== null
    ? inputValue
    : (value && value[displayKey]) || "";

  return (
    <div>
      {label && (
        <label className="block text-gray-700 mb-2 font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <Combobox
        value={value}
        onChange={option => {
          onChange(option); // set parent value (object)
          // Fill the input with selected name (allows for immediate typing after pick)
          if (option && option[displayKey]) {
            onInputChange(option[displayKey]);
          } else {
            onInputChange("");
          }
        }}
      >
        <div className="relative">
          <Combobox.Input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition"
            value={showValue}
            // When typing, change the input value and clear the selected option if user types different from picked value
            onChange={e => {
              const v = e.target.value;
              onInputChange(v);
              // If the typed value doesn't match the current picked value, clear it
              if (!value || v !== value[displayKey]) {
                onChange(null);
              }
            }}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
            spellCheck={false}
          />
          <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-auto">
            {loading && (
              <div className="p-2 text-gray-400">Searching...</div>
            )}
            {!loading && Array.isArray(options) && options.length === 0 && inputValue && inputValue.length >= 2 && (
              <div className="p-2 text-gray-400">No results found.</div>
            )}
            {(options || []).map(option => (
              <Combobox.Option
                key={option.id}
                value={option}
                className={({ active }) =>
                  `p-2 cursor-pointer ${active ? "bg-blue-100" : ""}`
                }
              >
                {renderOption
                  ? renderOption(option)
                  : option[displayKey]}
              </Combobox.Option>
            ))}
          </Combobox.Options>
        </div>
      </Combobox>
    </div>
  );
}
