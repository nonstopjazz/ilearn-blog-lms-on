'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { Play, Star, Users, Clock, CheckCircle, ArrowRight, BookOpen, Award, Shield, LogOut, User } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  short_description?: string;
  instructor_name: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  lessons_count: number;
  duration_minutes: number;
  price: number;
  status: string;
  rating?: number;
  enrolled_count?: number;
}

export default function Homepage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { getSupabase } = await import('@/lib/supabase');
        const supabase = getSupabase();

        // 檢查當前用戶
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        // 監聽認證狀態變化
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);
        const response = await fetch('/api/courses?status=published');
        const result = await response.json();

        if (result.success) {
          // Display all published courses
          setCourses(result.courses);
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, []);

  const handleSignOut = async () => {
    try {
      const { getSupabase } = await import('@/lib/supabase');
      const supabase = getSupabase();
      await supabase.auth.signOut();
      setUser(null);
      window.location.reload();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // 格式化時長
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours} 小時 ${remainingMinutes} 分`;
    } else if (hours > 0) {
      return `${hours} 小時`;
    } else {
      return `${remainingMinutes} 分`;
    }
  };

  // 獲取課程顏色
  const getCourseColor = (index: number) => {
    const colors = [
      'bg-gradient-to-br from-orange-400 to-red-500',
      'bg-gradient-to-br from-yellow-400 to-orange-500',
      'bg-gradient-to-br from-blue-400 to-cyan-500',
      'bg-gradient-to-br from-purple-400 to-pink-500',
      'bg-gradient-to-br from-green-400 to-teal-500',
      'bg-gradient-to-br from-indigo-400 to-purple-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar user={user} onSignOut={handleSignOut} />

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <Star className="h-4 w-4 mr-2" />
                Joe老師專為學生提供的線上學習平台
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                掌握技能，
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  改變未來
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                實戰項目課程、完整學習路徑。
                從基礎到進階，打造你的英語實力。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/courses" className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 font-semibold text-center">
                  瀏覽所有課程
                </Link>
                <Link href="/auth" className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center">
                  <User className="h-5 w-5 mr-2" />
                  免費註冊
                </Link>
              </div>
              <div className="flex items-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  1,000+ 學員
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  5星評價
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  專業認證
                </div>
              </div>
            </div>
            <div className="relative">
              <Link href="/courses" className="block">
                <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300 cursor-pointer">
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-6 flex items-center justify-center">
                    <Play className="h-16 w-16 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">探索我們的課程</h3>
                  <p className="text-gray-600 mb-2">從零基礎到專業開發者</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>120 個單元</span>
                    <span className="text-green-600 font-semibold">NT$ 2,999</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Joe老師學生專屬園地</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              提供最完整的學習體驗，從實體上課到線上課程，每個細節都為你的成功而設計
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">專業課程內容</h3>
              <p className="text-gray-600">
                業界專家設計課程，理論與實務並重，讓你學到真正有用的技能
              </p>
            </div>
            <div className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">完整測驗題庫</h3>
              <p className="text-gray-600">
                多練習題目、向老師發問，在學習路上你不會孤單
              </p>
            </div>
            <div className="text-center p-8 rounded-xl hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-4">完課證書認證</h3>
              <p className="text-gray-600">
                完成課程獲得專業證書，為你的履歷加分
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free Trial Courses */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">目前提供給Joe老師的學生的課程</h2>
            <p className="text-xl text-gray-600">符合資格的學員可提出申請</p>
          </div>

          {coursesLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-6">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {courses.map((course, index) => (
                <div key={course.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  <div className={`h-48 ${getCourseColor(index)} flex items-center justify-center`}>
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                    <p className="text-gray-600 mb-4">{course.short_description || course.description}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDuration(course.duration_minutes)}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {course.enrolled_count?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <Link href={`/courses/${course.id}`} className="block w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center">
                      立即試聽
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!coursesLoading && courses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">目前沒有可用的課程，敬請期待</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/courses" className="inline-flex items-center bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-semibold border-2 border-blue-600">
              查看所有課程
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">10,000+</div>
              <div className="text-gray-600">活躍學員</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">專業課程</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">50+</div>
              <div className="text-gray-600">專業講師</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">98%</div>
              <div className="text-gray-600">滿意度</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            準備好開始你的學習旅程了嗎？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Joe老師的學生請點擊課程申請，老師會放行
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth" className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center justify-center">
              免費註冊
              <ArrowRight className="h-5 w-5 ml-2" />
            </Link>
            <button className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-semibold">
              聯絡我們
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">學習平台</span>
              </div>
              <p className="text-gray-400">
                專業的線上學習平台，幫助你掌握未來技能
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">課程分類</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/courses?category=programming" className="hover:text-white transition-colors">程式設計</Link></li>
                <li><Link href="/courses?category=data" className="hover:text-white transition-colors">數據分析</Link></li>
                <li><Link href="/courses?category=design" className="hover:text-white transition-colors">設計創意</Link></li>
                <li><Link href="/courses?category=business" className="hover:text-white transition-colors">商業技能</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">支援</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">幫助中心</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">聯絡我們</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">常見問題</Link></li>
                <li><Link href="/guide" className="hover:text-white transition-colors">學習指南</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">關於</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">關於我們</Link></li>
                <li><Link href="/instructor" className="hover:text-white transition-colors">講師合作</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">隱私政策</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">服務條款</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2025 學習平台. 版權所有.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}