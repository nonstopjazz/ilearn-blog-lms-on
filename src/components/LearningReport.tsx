'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface LearningReportProps {
  data: any;
  showHeader?: boolean;
}

export function LearningReport({ data, showHeader = true }: LearningReportProps) {
  console.log('🔍 LearningReport received data:', data);
  const { student, summary, details, date_range } = data;
  console.log('📊 Summary:', summary);
  console.log('📝 Details:', details);

  // 準備成績趨勢圖表資料（折線圖）- 按日期排序的考試資料
  const gradeChartData = details.exams
    .sort((a: any, b: any) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime())
    .map((exam: any, index: number) => ({
      name: `第${index + 1}次`,
      examName: exam.exam_name,
      score: exam.percentage_score,
      type: exam.exam_type === 'quiz' ? '小考' : exam.exam_type === 'midterm' ? '期中考' : '期末考'
    }));

  // 準備單字學習直條圖資料
  const vocabularyChartData = details.vocabulary
    .sort((a: any, b: any) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .map((v: any) => {
      const correct = Math.round(v.words_learned * (v.accuracy_rate / 100));
      const incorrect = v.words_learned - correct;
      return {
        name: v.session_date.split('-').slice(1).join('/'), // MM/DD 格式
        答對單字: correct,
        答錯單字: incorrect,
        總數: v.words_learned // 用於 Tooltip 顯示
      };
    });

  // 準備作業進度資料（最近的作業提交）
  const recentAssignments = details.assignments
    .sort((a: any, b: any) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime())
    .slice(0, 10); // 只顯示最近10筆

  return (
    <div className="bg-white p-8 space-y-6 max-w-7xl mx-auto">
      {showHeader && (
        <div className="border-b pb-4 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">學習報告</h1>
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">學生：</span>{student.name}</p>
            <p><span className="font-medium">Email：</span>{student.email}</p>
            <p><span className="font-medium">統計期間：</span>{date_range.start} 至 {date_range.end}</p>
            <p><span className="font-medium">生成時間：</span>{new Date().toLocaleString('zh-TW', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      )}

      {/* 成績趨勢分析 - 折線圖 */}
      {gradeChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📈 成績趨勢分析
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={gradeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{data.examName}</p>
                            <p className="text-sm text-gray-600">{data.type}</p>
                            <p className="text-lg font-bold text-blue-600">{data.score} 分</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="分數"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">平均分數</p>
                <p className="text-2xl font-bold text-blue-600">{summary.exams.avg_score}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">最高分</p>
                <p className="text-2xl font-bold text-green-600">{summary.exams.highest_score}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">最低分</p>
                <p className="text-2xl font-bold text-orange-600">{summary.exams.lowest_score}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 單字學習 - 堆疊直條圖 */}
      {vocabularyChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📚 單字學習統計
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vocabularyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm text-gray-600">已教單字：{data.總數} 個</p>
                            <p className="text-sm text-green-600">答對：{data.答對單字} 個</p>
                            <p className="text-sm text-red-600">答錯：{data.答錯單字} 個</p>
                            <p className="text-sm text-blue-600">正確率：{Math.round((data.答對單字 / data.總數) * 100)}%</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="答對單字" stackId="a" fill="#10b981" name="答對單字" />
                  <Bar dataKey="答錯單字" stackId="a" fill="#ef4444" name="答錯單字" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">累積學習</p>
                <p className="text-2xl font-bold text-purple-600">{summary.vocabulary.total_words} 個</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">平均正確率</p>
                <p className="text-2xl font-bold text-green-600">{summary.vocabulary.avg_accuracy}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">學習次數</p>
                <p className="text-2xl font-bold text-blue-600">{summary.vocabulary.sessions_count} 次</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 作業進度追蹤 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📋 作業進度追蹤
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAssignments.length > 0 ? (
            <div className="space-y-4">
              {recentAssignments.map((assignment: any, index: number) => {
                const progress = assignment.score && assignment.max_score
                  ? (assignment.score / assignment.max_score) * 100
                  : 0;

                return (
                  <Card key={index} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-800">
                              作業 #{index + 1}
                            </h3>
                            <Badge variant={assignment.is_late ? "destructive" : "default"}>
                              {assignment.is_late ? "遲交" : "準時"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            提交日期：{assignment.submission_date}
                          </p>
                        </div>
                        <div className="text-right">
                          {assignment.score !== null ? (
                            <>
                              <div className="text-2xl font-bold text-blue-600">
                                {Math.round(progress)}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {assignment.score}/{assignment.max_score} 分
                              </div>
                            </>
                          ) : (
                            <div className="text-sm text-gray-500">未評分</div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              progress >= 80 ? 'bg-green-500' :
                              progress >= 60 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        {assignment.status === 'graded' && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>已評分</span>
                          </div>
                        )}
                        {assignment.status === 'submitted' && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-blue-600" />
                            <span>待評分</span>
                          </div>
                        )}
                        {assignment.is_late && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3 text-red-600" />
                            <span>逾期提交</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>目前沒有作業記錄</p>
            </div>
          )}

          {/* 作業統計摘要 */}
          <div className="mt-6 grid grid-cols-3 gap-4 text-center pt-6 border-t">
            <div>
              <p className="text-sm text-gray-600">作業總數</p>
              <p className="text-2xl font-bold text-blue-600">{summary.assignments.total_assignments}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">完成率</p>
              <p className="text-2xl font-bold text-green-600">{summary.assignments.completion_rate}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">平均分數</p>
              <p className="text-2xl font-bold text-purple-600">
                {summary.assignments.avg_score > 0 ? summary.assignments.avg_score : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 學習建議 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            💡 學習建議與總評
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {summary.vocabulary.avg_accuracy < 70 ? (
              <li className="flex items-start gap-2">
                <span className="text-orange-500 mt-1">▪</span>
                <span className="text-gray-700">
                  <strong>單字學習：</strong>建議增加練習時間，目前正確率為 {summary.vocabulary.avg_accuracy}%，
                  目標提升至 80% 以上
                </span>
              </li>
            ) : (
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">▪</span>
                <span className="text-gray-700">
                  <strong>單字學習：</strong>表現優秀！正確率達 {summary.vocabulary.avg_accuracy}%，
                  可嘗試更進階的單字
                </span>
              </li>
            )}

            {summary.assignments.total_assignments > 0 && (
              summary.assignments.completion_rate < 80 ? (
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">▪</span>
                  <span className="text-gray-700">
                    <strong>作業完成：</strong>目前完成率 {summary.assignments.completion_rate}%，
                    建議督促按時完成作業
                  </span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">▪</span>
                  <span className="text-gray-700">
                    <strong>作業完成：</strong>完成率優秀（{summary.assignments.completion_rate}%），
                    保持良好學習習慣
                  </span>
                </li>
              )
            )}

            {summary.exams.total_exams > 0 && (
              summary.exams.avg_score < 75 ? (
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">▪</span>
                  <span className="text-gray-700">
                    <strong>考試成績：</strong>平均 {summary.exams.avg_score} 分，
                    建議加強複習與考前準備
                  </span>
                </li>
              ) : (
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">▪</span>
                  <span className="text-gray-700">
                    <strong>考試成績：</strong>平均 {summary.exams.avg_score} 分，表現良好！
                    繼續保持
                  </span>
                </li>
              )
            )}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
