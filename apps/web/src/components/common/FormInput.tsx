import { InputHTMLAttributes } from 'react';
import {
  UseFormRegister,
  FieldError,
  FieldValues,
  Path,
} from 'react-hook-form';

interface FormInputProps<T extends FieldValues>
  extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  helperText?: string;
}

export const FormInput = <T extends FieldValues>({
  label,
  name,
  register,
  error,
  helperText,
  className = '',
  ...props
}: FormInputProps<T>) => {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <input
        id={name}
        className={`input input-bordered w-full ${error ? 'input-error' : ''} ${className}`}
        {...register(name)}
        {...props}
      />
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
      {error && <p className="form-error">{error.message}</p>}
    </div>
  );
};
