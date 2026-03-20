import React, { useState } from 'react';
import { useTypewriterPlaceholder } from '@/hooks/use-typewriter-placeholder';
import { Input } from '@/components/ui/input';

interface TypewriterInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'placeholder'> {
  placeholderText: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function TypewriterInput({ placeholderText, value, onChange, ...props }: TypewriterInputProps) {
  const [focused, setFocused] = useState(false);
  const animated = useTypewriterPlaceholder(placeholderText);
  const showAnimated = !focused && !value;

  return (
    <Input
      {...props}
      value={value}
      onChange={onChange}
      placeholder={showAnimated ? animated : placeholderText}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}
