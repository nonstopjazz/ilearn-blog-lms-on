import React from 'react';
import { Play, Star, Users, Clock, CheckCircle, ArrowRight, BookOpen, Award, Shield } from 'lucide-react';

export default function Homepage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">學習平台</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">課程</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">試聽</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">Blog</a>
              <a href="#" className="text-gray-700 hover:text-blue-600 transition-colors">關於我們</a>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-blue-600 hover:text-blue-800 font-medium">登入</button>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                開始學習
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                <Star className="h-4 w-4 mr-2" />
                台灣最專業的線上學習平台
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                掌握技能，
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  改變未來
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                專業講師團隊、實戰項目課程、完整學習路徑。
                從基礎到進階，打造你的專業技能。
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <button className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all transform hover:scale-105 font-semibold">
                  免費試聽課程
                </button>
                <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition-colors font-semibold flex items-center justify-center">
                  <Play className="h-5 w-5 mr-2" />
                  觀看介紹影片
                </button>
              </div>
              <div className="flex items-center space-x-8 text-sm text-gray-600">
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  10,000+ 學員
                </div>
                <div className="flex items-center">
                  <Star className="h-5 w-5 mr-2 text-yellow-500" />
                  4.9 星評價
                </div>
                <div className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  專業認證
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-6 flex items-center justify-center">
                  <Play className="h-16 w-16 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">JavaScript 完整課程</h3>
                <p className="text-gray-600 mb-4">從零基礎到專業開發者</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>120 個單元</span>
                  <span className="text-green-600 font-semibold">NT$ 2,999</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">為什麼選擇我們？</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              我們提供最完整的學習體驗，從課程設計到學習支援，每個細節都為你的成功而設計
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
              <h3 className="text-xl font-semibold mb-4">互動學習社群</h3>
              <p className="text-gray-600">
                與同學討論、向講師發問，在學習路上你不會孤單
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
            <h2 className="text-4xl font-bold text-gray-900 mb-4">免費試聽課程</h2>
            <p className="text-xl text-gray-600">體驗我們的教學品質，完全免費</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "HTML & CSS 基礎",
                description: "網頁設計入門必學",
                duration: "2 小時",
                students: "5,200+",
                image: "bg-gradient-to-br from-orange-400 to-red-500"
              },
              {
                title: "JavaScript 入門",
                description: "程式設計第一步",
                duration: "3 小時",
                students: "8,100+",
                image: "bg-gradient-to-br from-yellow-400 to-orange-500"
              },
              {
                title: "React 基礎概念",
                description: "現代前端框架",
                duration: "2.5 小時",
                students: "3,600+",
                image: "bg-gradient-to-br from-blue-400 to-cyan-500"
              }
            ].map((course, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className={`h-48 ${course.image} flex items-center justify-center`}>
                  <Play className="h-12 w-12 text-white" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{course.title}</h3>
                  <p className="text-gray-600 mb-4">{course.description}</p>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {course.duration}
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {course.students}
                    </div>
                  </div>
                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                    立即試聽
                  </button>
                </div>
              </div>
            ))}
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
            加入我們，與上萬名學員一起成長，掌握未來所需的技能
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors font-semibold flex items-center justify-center">
              免費註冊
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
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
                <li><a href="#" className="hover:text-white transition-colors">程式設計</a></li>
                <li><a href="#" className="hover:text-white transition-colors">數據分析</a></li>
                <li><a href="#" className="hover:text-white transition-colors">設計創意</a></li>
                <li><a href="#" className="hover:text-white transition-colors">商業技能</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">支援</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">幫助中心</a></li>
                <li><a href="#" className="hover:text-white transition-colors">聯絡我們</a></li>
                <li><a href="#" className="hover:text-white transition-colors">常見問題</a></li>
                <li><a href="#" className="hover:text-white transition-colors">學習指南</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">關於</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">關於我們</a></li>
                <li><a href="#" className="hover:text-white transition-colors">講師合作</a></li>
                <li><a href="#" className="hover:text-white transition-colors">隱私政策</a></li>
                <li><a href="#" className="hover:text-white transition-colors">服務條款</a></li>
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