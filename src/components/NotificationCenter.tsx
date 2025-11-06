// src/components/NotificationCenter.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellRing, Check, CheckCheck, Eye, EyeOff, X, ExternalLink, Clock, BookOpen, FileText, Trash2 } from 'lucide-react'

// 通知類型定義（適配您現有的 API）
interface Notification {
  id: number
  user_id: string
  title: string
  message: string
  type: string // 支援任何類型
  read: boolean
  action_url?: string
  action_text?: string
  metadata?: any
  created_at: string
}

interface NotificationCenterProps {
  userId: string
  className?: string
}

export default function NotificationCenter({ userId, className = '' }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // 載入通知
  const loadNotifications = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        user_id: userId,
        limit: '20'
      })

      const response = await fetch(`/api/notifications?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        const allNotifications = data.notifications || []
        
        // 根據顯示模式篩選
        const filteredNotifications = showUnreadOnly 
          ? allNotifications.filter((n: Notification) => !n.read)
          : allNotifications
        
        setNotifications(filteredNotifications)
        
        // 計算未讀數量
        const unreadNotifications = allNotifications.filter((n: Notification) => !n.read)
        setUnreadCount(unreadNotifications.length)
        
        console.log('✅ 成功載入通知:', filteredNotifications.length, '條')
      } else {
        console.error('❌ 載入通知失敗:', data.error)
      }
    } catch (error) {
      console.error('❌ 載入通知錯誤:', error)
    } finally {
      setLoading(false)
    }
  }

  // 標記單個通知為已讀
  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_id: notificationId,
          read: true
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 更新本地狀態
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
        console.log('✅ 標記通知為已讀:', notificationId)
      }
    } catch (error) {
      console.error('❌ 標記通知為已讀失敗:', error)
    }
  }

  // 標記所有通知為已讀
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: userId,
          mark_all_read: true
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 更新本地狀態
        setNotifications(prev => 
          prev.map(notification => ({ 
            ...notification, 
            read: true
          }))
        )
        setUnreadCount(0)
        console.log('✅ 所有通知已標記為已讀')
      }
    } catch (error) {
      console.error('❌ 標記所有通知為已讀失敗:', error)
    }
  }

  // 刪除通知
  const deleteNotification = async (notificationId: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notification_id: notificationId
        })
      })
      
      const data = await response.json()
      if (data.success) {
        // 從本地狀態中移除
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
        
        // 如果是未讀通知，減少未讀數量
        const notification = notifications.find(n => n.id === notificationId)
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
        
        console.log('✅ 通知已刪除:', notificationId)
      }
    } catch (error) {
      console.error('❌ 刪除通知失敗:', error)
    }
  }

  // 獲取通知圖標
  const getNotificationIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'success':
        return <Check className="w-4 h-4 text-green-500" />
      case 'warning':
        return <Clock className="w-4 h-4 text-orange-500" />
      case 'error':
        return <X className="w-4 h-4 text-red-500" />
      case 'info':
        return <Bell className="w-4 h-4 text-blue-500" />
      default:
        return <Bell className="w-4 h-4 text-gray-500" />
    }
  }

  // 格式化時間
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return '剛剛'
    if (diffMins < 60) return `${diffMins} 分鐘前`
    if (diffHours < 24) return `${diffHours} 小時前`
    if (diffDays < 7) return `${diffDays} 天前`
    
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 處理通知點擊
  const handleNotificationClick = (notification: Notification) => {
    // 標記為已讀
    if (!notification.read) {
      markAsRead(notification.id)
    }

    // 如果有 action_url，則導航
    if (notification.action_url) {
      window.open(notification.action_url, '_blank')
    }
  }

  // 切換顯示模式
  const toggleShowMode = () => {
    setShowUnreadOnly(!showUnreadOnly)
  }

  // 初始載入和模式切換時重新載入
  useEffect(() => {
    if (userId) {
      loadNotifications()
    }
  }, [userId, showUnreadOnly])

  // 定期更新
  useEffect(() => {
    if (userId) {
      const interval = setInterval(() => {
        loadNotifications()
      }, 30000) // 每30秒更新一次

      return () => clearInterval(interval)
    }
  }, [userId, showUnreadOnly])

  return (
    <div className={`relative ${className}`}>
      {/* 通知鈴鐺按鈕 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="通知中心"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6 text-blue-600" />
        ) : (
          <Bell className="w-6 h-6 text-gray-600" />
        )}
        
        {/* 未讀數量徽章 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-semibold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知面板 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* 標題列 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">
              通知中心 {unreadCount > 0 && `(${unreadCount})`}
            </h3>
            <div className="flex items-center space-x-2">
              {/* 顯示模式切換 */}
              <button
                onClick={toggleShowMode}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                title={showUnreadOnly ? '顯示全部' : '只顯示未讀'}
              >
                {showUnreadOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{showUnreadOnly ? '全部' : '未讀'}</span>
              </button>
              
              {/* 全部標記為已讀 */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-green-600 hover:text-green-800 flex items-center space-x-1"
                  title="全部標記為已讀"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>全讀</span>
                </button>
              )}
              
              {/* 關閉按鈕 */}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 通知列表 */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                載入中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>{showUnreadOnly ? '沒有未讀通知' : '沒有通知'}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* 通知圖標 */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* 通知內容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            notification.read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                          }`}>
                            {notification.title}
                          </h4>
                          
                          {/* 操作按鈕 */}
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title="標記為已讀"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="刪除通知"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        {/* 動作按鈕 */}
                        {notification.action_url && notification.action_text && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="mt-2 inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <span>{notification.action_text}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                        
                        {/* 時間戳記 */}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 底部操作 */}
          <div className="border-t border-gray-200 p-3">
            <button
              onClick={loadNotifications}
              className="w-full text-sm text-blue-600 hover:text-blue-800 py-2"
            >
              重新整理
            </button>
          </div>
        </div>
      )}
    </div>
  )
}