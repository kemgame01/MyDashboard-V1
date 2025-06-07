import React from 'react';

const InputField = ({
  label,
  id,
  name,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  autoComplete = 'off',
  required = false,
  disabled = false,
  error = '',
  ...rest
}) => (
  <div className="mb-4">
    {label && (
      <label htmlFor={id || name} className="block text-gray-700 mb-2 font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    <input
      type={type}
      id={id || name}
      name={name}
      className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition
        ${error ? 'border-red-500 focus:ring-red-300' : 'focus:ring-blue-500'}
        ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
      `}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      disabled={disabled}
      aria-invalid={!!error}
      aria-describedby={error ? `${id || name}-error` : undefined}
      {...rest}
    />
    {error && (
      <div id={`${id || name}-error`} className="text-red-500 text-xs mt-1">
        {error}
      </div>
    )}
  </div>
);

export default InputField;
  