'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  User, 
  LogOut, 
  Check, 
  X, 
  Clock, 
  Search,
  Filter,
  Eye,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface CourseRequest {
  id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  user_info: {
    name: string;
    email: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at?: string;
  admin_note?: string;
}

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<CourseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<CourseRequest | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // 載入所有申請
  useEffect(() => {
    loadRequests();
  }, []);

  // 過濾和搜尋
  useEffect(() => {
    let filtered = requests;

    // 狀態過濾
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

    // 搜尋過濾
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.user_info.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.user_info.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.course_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRequests(filtered);
  }, [requests, statusFilter, searchTerm]);

  const loadRequests = async () => {
    try {
      const response = await fetch('/api/course-requests');
      const result = await response.json();
      
      if (result.success) {
        setRequests(result.requests || []);
      } else {
        console.error('載入申請失敗:', result.error);
      }
    } catch (error: unknown) {
      console.error('載入申請失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    setActionLoading(requestId);
    
    try {
      const response = await fetch('/api/course-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          status: action,
          admin_note: adminNote
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // 更新本地狀態
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action, reviewed_at: new Date().toISOString(), admin_note: adminNote }
            : req
        ));
        
        setSelectedRequest(null);
        setAdminNote('');
        
        const actionText = action === 'approved' ? '批准' : '拒絕';
        alert(`申請已${actionText}！`);
      } else {
        throw new Error(result.error || '操作失敗');
      }
    } catch (error: unknown) {
      console.error('處理申請失敗:', error);
      alert(`操作失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待審核';
      case 'approved': return '已批准';
      case 'rejected': return '已拒絕';
      default: return '未知';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingCount = requests.filter(req => req.status === 'pending').length;
  const approvedCount = requests.filter(req => req.status === 'approved').length;
  const rejectedCount = requests.filter(req => req.status === 'rejected').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 導航列 */}
      <nav className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">管理員後台</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">管理員</p>
                  <p className="text-xs text-gray-500">系統管理</p>
                </div>
              </div>
              <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100">
                <LogOut className="h-4 w-4" />
                <span>登出</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 標題和統計 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">課程申請管理</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">總申請數</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">待審核</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">已批准</p>
                  <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">已拒絕</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 過濾和搜尋 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜尋申請者或課程..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">所有狀態</option>
                <option value="pending">待審核</option>
                <option value="approved">已批准</option>
                <option value="rejected">已拒絕</option>
              </select>
            </div>
          </div>
        </div>

        {/* 申請列表 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              申請列表 ({filteredRequests.length})
            </h2>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">沒有找到符合條件的申請</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申請者
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      課程
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      申請時間
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      狀態
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {request.user_info.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {request.user_info.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{request.course_title}</div>
                        <div className="text-sm text-gray-500">ID: {request.course_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(request.requested_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusText(request.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </button>
                          
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleRequestAction(request.id, 'approved')}
                                disabled={actionLoading === request.id}
                                className="text-green-600 hover:text-green-900 flex items-center disabled:opacity-50"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                批准
                              </button>
                              <button
                                onClick={() => handleRequestAction(request.id, 'rejected')}
                                disabled={actionLoading === request.id}
                                className="text-red-600 hover:text-red-900 flex items-center disabled:opacity-50"
                              >
                                <X className="h-4 w-4 mr-1" />
                                拒絕
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 詳細查看彈窗 */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">申請詳細資訊</h3>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">申請者姓名</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.user_info.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.user_info.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">課程名稱</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.course_title}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">申請狀態</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedRequest.status)}`}>
                    {getStatusIcon(selectedRequest.status)}
                    <span className="ml-1">{getStatusText(selectedRequest.status)}</span>
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">申請時間</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.requested_at)}</p>
                </div>
                {selectedRequest.reviewed_at && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">審核時間</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedRequest.reviewed_at)}</p>
                  </div>
                )}
              </div>

              {selectedRequest.admin_note && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">管理員備註</label>
                  <p className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedRequest.admin_note}</p>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">管理員備註</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="可選：添加審核備註..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setAdminNote('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                關閉
              </button>
              
              {selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleRequestAction(selectedRequest.id, 'rejected')}
                    disabled={actionLoading === selectedRequest.id}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center"
                  >
                    <X className="h-4 w-4 mr-1" />
                    拒絕申請
                  </button>
                  <button
                    onClick={() => handleRequestAction(selectedRequest.id, 'approved')}
                    disabled={actionLoading === selectedRequest.id}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    批准申請
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}