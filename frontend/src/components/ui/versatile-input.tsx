'use client';

import { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { Label } from './label';

interface VersatileInputProps {
  value: string;
  onChange?: (value: string) => void;
  label?: string;
  labelIcon?: React.ReactNode;
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
  showApplyButton?: boolean;
  applyButtonText?: string;
  onApplyClick?: () => void;
  className?: string;
  inputClassName?: string;
}

export function VersatileInput({
  value,
  onChange,
  label,
  labelIcon,
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
  showApplyButton = false,
  applyButtonText = "적용하기",
  onApplyClick,
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
        <div className="flex items-center gap-2">
          <Label className="text-gray-900">{label}</Label>
          {labelIcon && (
            <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
              {labelIcon}
            </div>
          )}
        </div>
      )}
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <Input
            value={value}
            onChange={onChange ? (e) => onChange(e.target.value) : undefined}
            placeholder={placeholder}
            readOnly={readOnly}
            className={`bg-white border-gray-300 text-gray-900 ${
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
            className="whitespace-nowrap bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
          >
            {copySuccess ? '복사됨!' : '복사'}
          </Button>
        )}
        
        {showActionButton && onActionClick && (
          <Button
            onClick={handleActionClick}
            disabled={isLoading || (onChange && !value.trim())}
            variant="outline"
            className="whitespace-nowrap bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
          >
            {isLoading ? actionButtonLoadingText : actionButtonText}
          </Button>
        )}
      </div>
      
      {result === 'success' && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-green-600">{successMessage}</p>
          {showApplyButton && onApplyClick && (
            <Button
              onClick={onApplyClick}
              className="bg-green-500 hover:bg-green-600 text-white whitespace-nowrap h-10 px-4 py-2"
            >
              {applyButtonText}
            </Button>
          )}
        </div>
      )}
      {result === 'error' && (
        <p className="text-sm text-red-600">{errorMessage}</p>
      )}
    </div>
  );
}