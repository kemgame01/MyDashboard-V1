import React from "react";
import { Combobox } from "@headlessui/react";

/**
 * SalesCombobox
 * 
 * - Shows suggestions only after 2+ characters are typed
 * - Filters options by inputValue (case-insensitive, by displayKey)
 * - Fully controlled, never "stuck" when typing
 */
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
  renderOption,
  required = false,
}) {
  // Normalize and filter options for suggestions
  const filteredOptions =
    inputValue && inputValue.length >= 2
      ? (options || []).filter(option =>
          (option[displayKey] || "")
            .toString()
            .toLowerCase()
            .includes(inputValue.toLowerCase())
        )
      : [];

  // What should show in the input
  const showValue = inputValue ?? (value && value[displayKey]) ?? "";

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
          onChange(option);
          onInputChange(option && option[displayKey] ? option[displayKey] : "");
        }}
      >
        <div className="relative">
          <Combobox.Input
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb] transition"
            value={showValue}
            onChange={e => {
              onInputChange(e.target.value);
            }}
            placeholder={placeholder}
            required={required}
            autoComplete="off"
            spellCheck={false}
          />
          {/* Show dropdown if 2+ chars and not loading */}
          {showValue.length >= 2 && (
            <Combobox.Options className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-40 overflow-auto">
              {loading && (
                <div className="p-2 text-gray-400">Searching...</div>
              )}
              {!loading && filteredOptions.length === 0 && (
                <div className="p-2 text-gray-400">No results found.</div>
              )}
              {filteredOptions.map(option => (
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
          )}
        </div>
      </Combobox>
    </div>
  );
}
