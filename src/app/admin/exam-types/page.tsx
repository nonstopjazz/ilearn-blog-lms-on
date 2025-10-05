'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle2, GripVertical } from 'lucide-react';

interface ExamType {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  order_index: number;
}

export default function ExamTypesManagementPage() {
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentType, setCurrentType] = useState<ExamType | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    color: '#3B82F6',
    icon: '',
    is_active: true,
    order_index: 0
  });

  // 載入考試類型
  useEffect(() => {
    loadExamTypes();
  }, []);

  const loadExamTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/exam-types');
      const result = await response.json();

      if (result.success) {
        setExamTypes(result.data || []);
      } else {
        showAlert('error', '載入失敗：' + result.error);
      }
    } catch (error) {
      console.error('載入考試類型失敗:', error);
      showAlert('error', '載入考試類型時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleOpenDialog = (type?: ExamType) => {
    if (type) {
      // 編輯模式
      setIsEditing(true);
      setCurrentType(type);
      setFormData({
        name: type.name,
        display_name: type.display_name,
        description: type.description || '',
        color: type.color,
        icon: type.icon || '',
        is_active: type.is_active,
        order_index: type.order_index
      });
    } else {
      // 新增模式
      setIsEditing(false);
      setCurrentType(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        color: '#3B82F6',
        icon: '',
        is_active: true,
        order_index: examTypes.length
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentType(null);
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = '/api/admin/exam-types';
      const method = isEditing ? 'PUT' : 'POST';
      const body = isEditing
        ? { ...formData, id: currentType?.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', isEditing ? '更新成功' : '新增成功');
        handleCloseDialog();
        loadExamTypes();
      } else {
        showAlert('error', result.error || '操作失敗');
      }
    } catch (error) {
      console.error('提交失敗:', error);
      showAlert('error', '操作時發生錯誤');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此考試類型嗎？')) return;

    try {
      const response = await fetch(`/api/admin/exam-types?id=${id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', '刪除成功');
        loadExamTypes();
      } else {
        showAlert('error', result.error || '刪除失敗');
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      showAlert('error', '刪除時發生錯誤');
    }
  };

  const handleToggleActive = async (type: ExamType) => {
    try {
      const response = await fetch('/api/admin/exam-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: type.id,
          is_active: !type.is_active
        })
      });

      const result = await response.json();

      if (result.success) {
        showAlert('success', type.is_active ? '已停用' : '已啟用');
        loadExamTypes();
      } else {
        showAlert('error', result.error || '更新失敗');
      }
    } catch (error) {
      console.error('更新失敗:', error);
      showAlert('error', '更新時發生錯誤');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">考試類型管理</h1>
          <p className="text-muted-foreground mt-1">管理系統中的考試類型，可自訂名稱、顏色和圖示</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          新增考試類型
        </Button>
      </div>

      {/* 提示訊息 */}
      {alert && (
        <Alert variant={alert.type === 'error' ? 'destructive' : 'default'}>
          {alert.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{alert.message}</AlertDescription>
        </Alert>
      )}

      {/* 考試類型列表 */}
      <Card>
        <CardHeader>
          <CardTitle>考試類型列表</CardTitle>
          <CardDescription>
            共 {examTypes.length} 個類型，其中 {examTypes.filter(t => t.is_active).length} 個已啟用
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">載入中...</p>
          ) : examTypes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">尚無考試類型</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>顯示名稱</TableHead>
                  <TableHead>內部名稱</TableHead>
                  <TableHead>顏色預覽</TableHead>
                  <TableHead>圖示</TableHead>
                  <TableHead>說明</TableHead>
                  <TableHead>排序</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell>
                      <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell className="font-medium">{type.display_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{type.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded border"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="text-xs text-muted-foreground">{type.color}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-2xl">{type.icon || '-'}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {type.description || '-'}
                    </TableCell>
                    <TableCell>{type.order_index}</TableCell>
                    <TableCell>
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={() => handleToggleActive(type)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(type)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 新增/編輯對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? '編輯考試類型' : '新增考試類型'}</DialogTitle>
            <DialogDescription>
              {isEditing ? '修改考試類型的資訊' : '建立新的考試類型'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_name">顯示名稱 *</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="例如：小考"
                  required
                />
              </div>

              <div>
                <Label htmlFor="name">內部名稱（英文）*</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如：quiz"
                  required
                  disabled={isEditing}
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground mt-1">內部名稱不可修改</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="description">說明</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="簡短描述此考試類型"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="color">顏色 *</Label>
                <div className="flex gap-2">
                  <Input
                    id="color"
                    type="color"
                    value={formData.color.startsWith('rgb') ? '#3B82F6' : formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-20 h-10 p-1"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="rgb(59, 130, 246)"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  支援十六進位或 rgb()
                </p>
              </div>

              <div>
                <Label htmlFor="icon">圖示 Emoji</Label>
                <Input
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📝"
                  maxLength={2}
                />
              </div>

              <div>
                <Label htmlFor="order_index">排序順序</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  min={0}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">啟用此類型</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                取消
              </Button>
              <Button type="submit">
                {isEditing ? '更新' : '新增'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
