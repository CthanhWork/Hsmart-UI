import { useMemo, useRef } from 'react';

const OTP_LENGTH = 6;

const sanitizeOtp = (value = '') => value.replace(/\D/g, '').slice(0, OTP_LENGTH);

const OtpCodeField = ({
  idPrefix,
  label,
  value,
  onChange,
  helperText,
  disabled = false,
  autoFocus = false,
}) => {
  const inputRefs = useRef([]);
  const digits = useMemo(
    () => Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || ''),
    [value],
  );

  const focusDigit = (index) => {
    const nextInput = inputRefs.current[index];
    if (nextInput) {
      nextInput.focus();
      nextInput.select();
    }
  };

  const updateAtIndex = (index, nextDigit) => {
    const nextDigits = [...digits];
    nextDigits[index] = nextDigit;
    onChange(sanitizeOtp(nextDigits.join('')));
  };

  const fillFromIndex = (index, rawValue) => {
    const incomingDigits = sanitizeOtp(rawValue).split('');
    if (!incomingDigits.length) {
      updateAtIndex(index, '');
      return;
    }

    const nextDigits = [...digits];
    let writeIndex = index;
    incomingDigits.forEach((digit) => {
      if (writeIndex < OTP_LENGTH) {
        nextDigits[writeIndex] = digit;
        writeIndex += 1;
      }
    });

    onChange(nextDigits.join(''));

    if (writeIndex >= OTP_LENGTH) {
      focusDigit(OTP_LENGTH - 1);
      return;
    }

    focusDigit(writeIndex);
  };

  const handleChange = (index, nextValue) => {
    fillFromIndex(index, nextValue);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      if (digits[index]) {
        updateAtIndex(index, '');
        return;
      }

      if (index > 0) {
        updateAtIndex(index - 1, '');
        focusDigit(index - 1);
      }
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      event.preventDefault();
      focusDigit(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pastedValue = event.clipboardData.getData('text');
    const nextValue = sanitizeOtp(pastedValue);
    if (!nextValue) return;
    onChange(nextValue);
    focusDigit(Math.min(nextValue.length, OTP_LENGTH) - 1);
  };

  return (
    <div className="auth-action-field">
      <label>{label}</label>
      <div className="auth-action-otp-inputs" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={`${idPrefix}-${index}`}
            ref={(node) => {
              inputRefs.current[index] = node;
            }}
            id={`${idPrefix}-${index}`}
            className="auth-action-otp-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={OTP_LENGTH}
            value={digit}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            disabled={disabled}
            aria-label={`${label} số ${index + 1}`}
            autoFocus={autoFocus && index === 0}
          />
        ))}
      </div>
      <input
        type="hidden"
        name={idPrefix}
        value={value}
        readOnly
      />
      {helperText ? <small>{helperText}</small> : null}
    </div>
  );
};

export default OtpCodeField;
