import { SelectHTMLAttributes } from 'react';
import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

export interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<T extends FieldValues> extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  options: SelectOption[];
  error?: FieldError;
  helperText?: string;
}

export const FormSelect = <T extends FieldValues>({
  label,
  name,
  register,
  options,
  error,
  helperText,
  className = '',
  ...props
}: FormSelectProps<T>) => {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <select
        id={name}
        className={`select select-bordered w-full ${error ? 'select-error' : ''} ${className}`}
        {...register(name)}
        {...props}
      >
        {props.placeholder && (
          <option value="" disabled>
            {props.placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      {error && <p className="form-error">{error.message}</p>}
    </div>
  );
};
