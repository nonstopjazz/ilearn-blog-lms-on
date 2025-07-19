'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Users, AlertTriangle, Eye, Clock, Trash2, Ban, CheckCircle } from 'lucide-react';
import { getSecurityStats, unblockIP, blockIP } from '@/lib/rate-limiter';

interface SecurityLog {
  ip: string;
  timestamp: number;
  action: string;
  success: boolean;
  userAgent?: string;
}

interface SecurityStats {
  totalSuspiciousIPs: number;
  activeRateLimits: number;
  logsLast24h: number;
  logsLastHour: number;
  failedLoginsLast24h: number;
  suspiciousIPs: string[];
  recentLogs: SecurityLog[];
}

export default function SecurityPage() {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIP, setSelectedIP] = useState<string>('');
  const [blockReason, setBlockReason] = useState('');

  useEffect(() => {
    loadSecurityStats();
    
    // 每30秒更新一次
    const interval = setInterval(loadSecurityStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSecurityStats = () => {
    try {
      const securityStats = getSecurityStats();
      setStats(securityStats);
    } catch (error) {
      console.error('載入安全統計失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockIP = (ip: string) => {
    try {
      unblockIP(ip);
      loadSecurityStats();
      alert(`IP ${ip} 已解除封鎖`);
    } catch (error) {
      console.error('解除封鎖失敗:', error);
      alert('解除封鎖失敗');
    }
  };

  const handleBlockIP = () => {
    if (!selectedIP.trim()) {
      alert('請輸入要封鎖的 IP 地址');
      return;
    }

    try {
      blockIP(selectedIP.trim(), blockReason.trim() || '管理員手動封鎖');
      loadSecurityStats();
      setSelectedIP('');
      setBlockReason('');
      alert(`IP ${selectedIP} 已被封鎖`);
    } catch (error) {
      console.error('封鎖失敗:', error);
      alert('封鎖失敗');
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string, success: boolean) => {
    if (!success && action === 'login') return 'text-red-600';
    if (success && action === 'login') return 'text-green-600';
    if (action.includes('blocked')) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">載入安全資料中...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">無法載入安全資料</h3>
        <button
          onClick={loadSecurityStats}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          重新載入
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="mr-3 h-8 w-8 text-blue-600" />
            安全監控中心
          </h1>
          <p className="text-gray-600 mt-1">監控和管理網站安全狀態</p>
        </div>
        <button
          onClick={loadSecurityStats}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Clock className="w-4 h-4 mr-2" />
          重新整理
        </button>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">可疑 IP</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSuspiciousIPs}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">活躍限制</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeRateLimits}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <Eye className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">24小時請求</p>
              <p className="text-2xl font-bold text-gray-900">{stats.logsLast24h}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">失敗登入</p>
              <p className="text-2xl font-bold text-gray-900">{stats.failedLoginsLast24h}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 可疑 IP 管理 */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">可疑 IP 管理</h3>
          </div>
          <div className="p-6">
            {/* 手動封鎖 IP */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">手動封鎖 IP</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="輸入 IP 地址"
                  value={selectedIP}
                  onChange={(e) => setSelectedIP(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="封鎖原因（可選）"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleBlockIP}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  封鎖 IP
                </button>
              </div>
            </div>

            {/* 已封鎖的 IP 列表 */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">已封鎖的 IP ({stats.suspiciousIPs.length})</h4>
              {stats.suspiciousIPs.length === 0 ? (
                <p className="text-gray-500 text-sm">目前沒有被封鎖的 IP</p>
              ) : (
                <div className="space-y-2">
                  {stats.suspiciousIPs.map((ip) => (
                    <div key={ip} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="font-mono text-sm">{ip}</span>
                      <button
                        onClick={() => handleUnblockIP(ip)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 flex items-center"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        解除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 最近的安全日誌 */}
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">最近的安全日誌</h3>
          </div>
          <div className="p-6">
            {stats.recentLogs.length === 0 ? (
              <p className="text-gray-500 text-sm">暫無安全日誌</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {stats.recentLogs.map((log, index) => (
                  <div key={index} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{log.ip}</span>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(log.timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center mt-1">
                      <span className={`text-sm font-medium ${getActionColor(log.action, log.success)}`}>
                        {log.action}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {log.success ? '成功' : '失敗'}
                      </span>
                    </div>
                    {log.userAgent && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {log.userAgent}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 安全建議 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">安全建議</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 定期檢查可疑 IP 列表，及時處理異常活動</li>
          <li>• 監控失敗登入嘗試，特別注意短時間內大量失敗的情況</li>
          <li>• 考慮實施更嚴格的密碼政策和雙因素認證</li>
          <li>• 定期備份安全日誌，並設置自動化警報機制</li>
          <li>• 考慮使用 CDN 和 DDoS 防護服務加強防護</li>
        </ul>
      </div>
    </div>
  );
}