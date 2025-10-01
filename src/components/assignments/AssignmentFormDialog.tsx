'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, Users, Plus, X, BookOpen, Clock, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Student {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
}

interface AssignmentFormData {
  title: string;
  description: string;
  instructions: string;
  courseId: string;
  studentIds: string[];
  dueDate: string;
  assignmentType: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  submissionType: 'text' | 'photo' | 'file' | 'quiz';
  maxScore: number;
  estimatedDuration: number;
  isRequired: boolean;
  tags: string[];
  resources: string[];
}

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AssignmentFormData) => Promise<void>;
  students: Student[];
  loading?: boolean;
  editData?: Partial<AssignmentFormData>;
}

const AssignmentFormDialog: React.FC<AssignmentFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  students,
  loading = false,
  editData
}) => {
  const [formData, setFormData] = useState<AssignmentFormData>({
    title: '',
    description: '',
    instructions: '',
    courseId: '',
    studentIds: [],
    dueDate: '',
    assignmentType: '一般作業',
    priority: 'medium',
    submissionType: 'text',
    maxScore: 100,
    estimatedDuration: 30,
    isRequired: true,
    tags: [],
    resources: []
  });

  const [newTag, setNewTag] = useState('');
  const [newResource, setNewResource] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 預設作業類型
  const assignmentTypes = [
    '一般作業', '每日作業', '週作業', '專案作業', '口說練習',
    '聽力作業', '閱讀理解', '寫作練習', '文法練習', '單字測驗'
  ];

  // 當編輯數據變化時更新表單
  useEffect(() => {
    if (editData && open) {
      setFormData(prev => ({
        ...prev,
        ...editData,
        studentIds: editData.studentIds || [],
        tags: editData.tags || [],
        resources: editData.resources || []
      }));
    } else if (open) {
      // 重置表單
      setFormData({
        title: '',
        description: '',
        instructions: '',
        courseId: '',
        studentIds: [],
        dueDate: '',
        assignmentType: '一般作業',
        priority: 'medium',
        submissionType: 'text',
        maxScore: 100,
        estimatedDuration: 30,
        isRequired: true,
        tags: [],
        resources: []
      });
    }
    setErrors({});
  }, [editData, open]);

  // 驗證表單
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '作業標題為必填';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = '截止日期為必填';
    }

    if (formData.studentIds.length === 0) {
      newErrors.studentIds = '請至少選擇一位學生';
    }

    if (formData.maxScore <= 0) {
      newErrors.maxScore = '分數必須大於0';
    }

    if (formData.estimatedDuration <= 0) {
      newErrors.estimatedDuration = '預估時間必須大於0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onOpenChange(false);
    } catch (error) {
      console.error('提交作業失敗:', error);
    }
  };

  // 添加標籤
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // 移除標籤
  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // 添加資源
  const addResource = () => {
    if (newResource.trim() && !formData.resources.includes(newResource.trim())) {
      setFormData(prev => ({
        ...prev,
        resources: [...prev.resources, newResource.trim()]
      }));
      setNewResource('');
    }
  };

  // 移除資源
  const removeResource = (resourceToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      resources: prev.resources.filter(resource => resource !== resourceToRemove)
    }));
  };

  // 切換學生選擇
  const toggleStudent = (studentId: string) => {
    setFormData(prev => ({
      ...prev,
      studentIds: prev.studentIds.includes(studentId)
        ? prev.studentIds.filter(id => id !== studentId)
        : [...prev.studentIds, studentId]
    }));
  };

  // 全選/全不選學生
  const toggleAllStudents = () => {
    const filteredStudents = students.filter(s =>
      !formData.courseId || s.courseId === formData.courseId
    );

    const allSelected = filteredStudents.every(s => formData.studentIds.includes(s.id));

    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        studentIds: prev.studentIds.filter(id =>
          !filteredStudents.some(s => s.id === id)
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        studentIds: [...new Set([...prev.studentIds, ...filteredStudents.map(s => s.id)])]
      }));
    }
  };

  // 過濾學生列表
  const filteredStudents = students.filter(student =>
    !formData.courseId || student.courseId === formData.courseId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5" />
            <span>{editData ? '編輯作業' : '新增作業'}</span>
          </DialogTitle>
          <DialogDescription>
            {editData ? '修改作業資訊和設定' : '為學生創建新的學習作業'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本資訊</TabsTrigger>
              <TabsTrigger value="students">學生分配</TabsTrigger>
              <TabsTrigger value="settings">進階設定</TabsTrigger>
            </TabsList>

            {/* 基本資訊頁籤 */}
            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">作業標題 *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="輸入作業標題"
                    className={errors.title ? 'border-red-500' : ''}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-500 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.title}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignmentType">作業類型</Label>
                  <Select
                    value={formData.assignmentType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, assignmentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">截止日期 *</Label>
                  <Input
                    id="dueDate"
                    type="datetime-local"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className={errors.dueDate ? 'border-red-500' : ''}
                  />
                  {errors.dueDate && (
                    <p className="text-xs text-red-500 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3" />
                      <span>{errors.dueDate}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">優先度</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">低</SelectItem>
                      <SelectItem value="medium">中</SelectItem>
                      <SelectItem value="high">高</SelectItem>
                      <SelectItem value="urgent">緊急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">作業描述</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="簡述作業內容和目標"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">詳細說明</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="詳細的作業要求和步驟"
                  rows={4}
                />
              </div>
            </TabsContent>

            {/* 學生分配頁籤 */}
            <TabsContent value="students" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">選擇學生 *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAllStudents}
                >
                  {filteredStudents.every(s => formData.studentIds.includes(s.id)) ? '全不選' : '全選'}
                </Button>
              </div>

              {errors.studentIds && (
                <p className="text-xs text-red-500 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.studentIds}</span>
                </p>
              )}

              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        className={cn(
                          "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          formData.studentIds.includes(student.id)
                            ? "bg-primary/10 border-primary"
                            : "bg-muted/30 border-border hover:bg-muted/50"
                        )}
                        onClick={() => toggleStudent(student.id)}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center",
                          formData.studentIds.includes(student.id)
                            ? "bg-primary border-primary text-white"
                            : "border-muted-foreground"
                        )}>
                          {formData.studentIds.includes(student.id) && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{student.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{student.courseName}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredStudents.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>無可用學生</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>已選擇 {formData.studentIds.length} 位學生</span>
              </div>
            </TabsContent>

            {/* 進階設定頁籤 */}
            <TabsContent value="settings" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="submissionType">提交方式</Label>
                  <Select
                    value={formData.submissionType}
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, submissionType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">文字</SelectItem>
                      <SelectItem value="photo">拍照</SelectItem>
                      <SelectItem value="file">檔案上傳</SelectItem>
                      <SelectItem value="quiz">線上測驗</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxScore">滿分</Label>
                  <Input
                    id="maxScore"
                    type="number"
                    min="1"
                    value={formData.maxScore}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 100 }))}
                    className={errors.maxScore ? 'border-red-500' : ''}
                  />
                  {errors.maxScore && (
                    <p className="text-xs text-red-500">{errors.maxScore}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDuration">預估時間 (分鐘)</Label>
                  <Input
                    id="estimatedDuration"
                    type="number"
                    min="1"
                    value={formData.estimatedDuration}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 30 }))}
                    className={errors.estimatedDuration ? 'border-red-500' : ''}
                  />
                  {errors.estimatedDuration && (
                    <p className="text-xs text-red-500">{errors.estimatedDuration}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isRequired"
                  checked={formData.isRequired}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRequired: checked }))}
                />
                <Label htmlFor="isRequired">必修作業</Label>
              </div>

              {/* 標籤管理 */}
              <div className="space-y-2">
                <Label>標籤</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="添加標籤"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer">
                      {tag}
                      <X className="w-3 h-3 ml-1" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 資源管理 */}
              <div className="space-y-2">
                <Label>相關資源</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newResource}
                    onChange={(e) => setNewResource(e.target.value)}
                    placeholder="添加資源連結或描述"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addResource}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {formData.resources.map((resource, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                      <span className="truncate">{resource}</span>
                      <X className="w-4 h-4 cursor-pointer" onClick={() => removeResource(resource)} />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '處理中...' : (editData ? '更新作業' : '創建作業')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentFormDialog;