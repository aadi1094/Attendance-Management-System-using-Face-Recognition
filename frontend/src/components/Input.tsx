type InputProps = {
  label?: string;
  type?: "text" | "email" | "password" | "number";
  name?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
};

export function Input({
  label,
  type = "text",
  name,
  value,
  placeholder,
  required,
  disabled,
  error,
  className = "",
  onChange,
  onBlur,
}: InputProps) {
  const inputCls = `w-full rounded-lg border px-4 py-2.5 text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:opacity-50 ${
    error ? "border-red-500" : "border-zinc-300 dark:border-zinc-600"
  } ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={inputCls}
        onChange={onChange}
        onBlur={onBlur}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
