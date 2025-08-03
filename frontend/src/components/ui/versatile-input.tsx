'use client';

import { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Label } from './label';

interface VersatileInputProps {
  value: string;
  onChange?: (value: string) => void;
  label?: string;
  placeholder?: string;
  readOnly?: boolean;
  showCopyButton?: boolean;
  showActionButton?: boolean;
  actionButtonText?: string;
  actionButtonLoadingText?: string;
  onActionClick?: (value: string) => Promise<boolean | void>;
  actionResult?: 'success' | 'error' | null;
  successMessage?: string;
  errorMessage?: string;
  className?: string;
  inputClassName?: string;
}

export function VersatileInput({
  value,
  onChange,
  label,
  placeholder,
  readOnly = false,
  showCopyButton = false,
  showActionButton = false,
  actionButtonText = "확인",
  actionButtonLoadingText = "처리중...",
  onActionClick,
  actionResult,
  successMessage = "성공했습니다.",
  errorMessage = "오류가 발생했습니다.",
  className = "",
  inputClassName = ""
}: VersatileInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [internalResult, setInternalResult] = useState<'success' | 'error' | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const result = actionResult !== undefined ? actionResult : internalResult;

  const handleActionClick = async () => {
    if (!onActionClick) return;
    
    setIsLoading(true);
    setInternalResult(null);
    
    try {
      const success = await onActionClick(value);
      if (success !== undefined) {
        setInternalResult(success ? 'success' : 'error');
      }
    } catch (error) {
      setInternalResult('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-gray-900">{label}</Label>
      )}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Input
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`${
              result === 'success' 
                ? 'border-green-500 focus:border-green-500' 
                : result === 'error' 
                ? 'border-red-500 focus:border-red-500' 
                : ''
            } ${inputClassName}`}
          />
          {result === 'success' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-green-500 text-sm">✓</span>
            </div>
          )}
          {result === 'error' && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-red-500 text-sm">✕</span>
            </div>
          )}
        </div>
        
        {showCopyButton && (
          <Button
            onClick={handleCopy}
            variant="outline"
            className="whitespace-nowrap"
          >
            {copySuccess ? '복사됨!' : '복사'}
          </Button>
        )}
        
        {showActionButton && onActionClick && (
          <Button
            onClick={handleActionClick}
            disabled={isLoading || (onChange && !value.trim())}
            variant="outline"
            className="whitespace-nowrap"
          >
            {isLoading ? actionButtonLoadingText : actionButtonText}
          </Button>
        )}
      </div>
      
      {result === 'success' && (
        <p className="text-sm text-green-600">{successMessage}</p>
      )}
      {result === 'error' && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}