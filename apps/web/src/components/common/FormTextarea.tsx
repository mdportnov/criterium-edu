import { TextareaHTMLAttributes } from 'react';
import { UseFormRegister, FieldError, FieldValues, Path } from 'react-hook-form';

interface FormTextareaProps<T extends FieldValues> extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  error?: FieldError;
  helperText?: string;
}

export const FormTextarea = <T extends FieldValues>({
  label,
  name,
  register,
  error,
  helperText,
  className = '',
  ...props
}: FormTextareaProps<T>) => {
  return (
    <div className="form-group">
      <label htmlFor={name} className="form-label">
        {label}
      </label>
      <textarea
        id={name}
        className={`textarea textarea-bordered w-full min-h-24 ${error ? 'textarea-error' : ''} ${className}`}
        {...register(name)}
        {...props}
      />
      {helperText && !error && <p className="mt-1 text-sm text-gray-500">{helperText}</p>}
      {error && <p className="form-error">{error.message}</p>}
    </div>
  );
};
