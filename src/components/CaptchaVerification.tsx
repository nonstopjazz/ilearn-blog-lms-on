'use client';

import { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface CaptchaVerificationProps {
  onVerify: (isValid: boolean) => void;
  required?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export default function CaptchaVerification({ 
  onVerify, 
  required = false,
  size = 'medium' 
}: CaptchaVerificationProps) {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isValid, setIsValid] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 生成隨機驗證碼
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserInput('');
    setIsValid(false);
    onVerify(false);
  };

  // 繪製驗證碼
  const drawCaptcha = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 設置背景
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 添加噪點
    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.3)`;
      ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    // 添加干擾線
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // 繪製驗證碼文字
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < captchaText.length; i++) {
      const char = captchaText[i];
      const x = (canvas.width / captchaText.length) * (i + 0.5);
      const y = canvas.height / 2 + (Math.random() - 0.5) * 10;
      
      // 隨機顏色
      ctx.fillStyle = `rgb(${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)}, ${Math.floor(Math.random() * 100)})`;
      
      // 隨機旋轉
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }
  };

  // 驗證用戶輸入
  const validateInput = (input: string) => {
    const valid = input.toLowerCase() === captchaText.toLowerCase();
    setIsValid(valid);
    onVerify(valid);
    return valid;
  };

  // 處理輸入變化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUserInput(value);
    if (value.length === captchaText.length) {
      validateInput(value);
    } else {
      setIsValid(false);
      onVerify(false);
    }
  };

  // 刷新驗證碼
  const refreshCaptcha = () => {
    generateCaptcha();
  };

  // 初始化和重新生成驗證碼時繪製
  useEffect(() => {
    if (captchaText) {
      drawCaptcha();
    }
  }, [captchaText]);

  // 組件掛載時生成第一個驗證碼
  useEffect(() => {
    generateCaptcha();
  }, []);

  const sizeClasses = {
    small: 'w-32 h-12 text-sm',
    medium: 'w-40 h-16 text-base',
    large: 'w-48 h-20 text-lg'
  };

  if (!required) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={160}
            height={64}
            className={`border border-gray-300 rounded-lg bg-gray-50 cursor-pointer ${sizeClasses[size]}`}
            onClick={refreshCaptcha}
            title="點擊刷新驗證碼"
          />
          <button
            type="button"
            onClick={refreshCaptcha}
            className="absolute top-1 right-1 p-1 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
            title="刷新驗證碼"
          >
            <RefreshCw className="w-3 h-3 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          placeholder="請輸入驗證碼"
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            userInput.length === captchaText.length
              ? isValid
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
              : 'border-gray-300'
          }`}
          maxLength={captchaText.length}
          autoComplete="off"
        />
        
        {userInput.length === captchaText.length && (
          <p className={`text-sm ${isValid ? 'text-green-600' : 'text-red-600'}`}>
            {isValid ? '✓ 驗證碼正確' : '✗ 驗證碼錯誤，請重新輸入'}
          </p>
        )}
        
        <p className="text-xs text-gray-500">
          看不清楚？點擊驗證碼圖片或刷新按鈕重新生成
        </p>
      </div>
    </div>
  );
}