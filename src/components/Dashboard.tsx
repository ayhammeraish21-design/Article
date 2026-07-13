import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Search, BookOpen, Cpu, Atom, Compass, Hourglass, HeartPulse, 
  Sparkles, TrendingUp, ThumbsUp, Eye, Bookmark, LogOut, 
  PlusCircle, User, Award, Layers, BookMarked, HelpCircle, Flame
} from "lucide-react";
import { Article, CategoryType, CATEGORIES, User as UserType } from "../types";

interface DashboardProps {
  currentUser: UserType;
  onLogout: () => void;
  onSelectArticle: (articleId: string) => void;
  onNavigateToUpload: () => void;
  refreshTrigger: number;
}

export default function Dashboard({ 
  currentUser, 
  onLogout, 
  onSelectArticle, 
  onNavigateToUpload,
  refreshTrigger
}: DashboardProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>("الكل");
  const [activeTab, setActiveTab] = useState<"all" | "my" | "bookmarks">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory, searchQuery, activeTab, refreshTrigger]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      let url = `/api/articles?category=${encodeURIComponent(selectedCategory)}&search=${encodeURIComponent(searchQuery)}`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      if (response.ok) {
        let data: Article[] = await response.json();
        
        // Handle frontend tabs filtering
        if (activeTab === "my") {
          data = data.filter(a => a.authorId === currentUser.id);
        } else if (activeTab === "bookmarks") {
          data = data.filter(a => a.bookmarks.includes(currentUser.id));
        }
        
        setArticles(data);
      }
    } catch (err) {
      console.error("Error fetching articles:", err);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (catName: string) => {
    switch (catName) {
      case "علمي": return <Atom className="w-4 h-4" />;
      case "تقني": return <Cpu className="w-4 h-4" />;
      case "أدبي": return <BookOpen className="w-4 h-4" />;
      case "فلسفي": return <Compass className="w-4 h-4" />;
      case "تاريخي": return <Hourglass className="w-4 h-4" />;
      case "طبي": return <HeartPulse className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (diff: string | undefined) => {
    switch (diff) {
      case "مبتدئ": return "bg-emerald-950/40 text-emerald-400 border-emerald-800/40";
      case "متوسط": return "bg-amber-950/40 text-amber-400 border-amber-800/40";
      case "متقدم": return "bg-red-950/40 text-red-400 border-red-800/40";
      default: return "bg-zinc-900 text-zinc-400 border-zinc-800";
    }
  };

  // Quick stats calculation
  const totalMyArticles = articles.filter(a => a.authorId === currentUser.id).length;
  const totalBookmarks = articles.filter(a => a.bookmarks.includes(currentUser.id)).length;
  const totalViews = articles.reduce((sum, a) => sum + (a.authorId === currentUser.id ? a.views : 0), 0);

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans pb-16">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Header Navbar */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3 md:px-8 flex justify-between items-center">
        {/* User profile & actions */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="flex items-center space-x-2 space-x-reverse">
            <img 
              src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`} 
              alt={currentUser.username} 
              className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 p-1"
            />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-white">{currentUser.username}</p>
              <p className="text-[10px] text-gray-500 font-mono">{currentUser.email}</p>
            </div>
          </div>
          <div className="h-6 w-[1px] bg-zinc-800"></div>
          <button 
            onClick={onLogout} 
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 text-gray-400 hover:text-red-400 rounded-xl border border-zinc-800/60 transition-all duration-300 cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Logo and Upload button */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <button 
            onClick={onNavigateToUpload}
            className="bg-gradient-to-l from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-black font-bold py-2.5 px-4 rounded-xl text-xs md:text-sm transition-all duration-300 flex items-center space-x-1.5 space-x-reverse shadow-lg shadow-purple-500/10 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-black" />
            <span className="text-black">مقال / بحث جديد</span>
          </button>

          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 bg-gradient-to-tr from-purple-600 to-cyan-400 rounded-xl shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-black" />
            </div>
            <h1 className="text-lg font-bold text-white tracking-tight hidden md:block">بوابة البحوث</h1>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-8 space-y-8 text-right">
        {/* Welcome Banner / Core Statistics (Bento Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 bg-gradient-to-l from-zinc-950 to-zinc-900/40 border border-zinc-900 p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div>
              <span className="text-xs text-purple-400 font-mono uppercase tracking-wider flex items-center space-x-1 space-x-reverse justify-end">
                <span>PORTAL SYSTEM IS READY</span>
                <Flame className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-2">
                أهلاً بك، الزميل {currentUser.username}
              </h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                مرحباً بك في البوابة العلمية الموحدة. يمكنك اليوم رفع ومشاركة أبحاثك من ملفات Word مباشرة لتخضع للمراجعة الأكاديمية المدعومة بالذكاء الاصطناعي التوليدي.
              </p>
            </div>
            <div className="flex space-x-4 space-x-reverse mt-6">
              <button 
                onClick={onNavigateToUpload}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 border border-cyan-800/40 bg-cyan-950/20 hover:bg-cyan-950/40 px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
              >
                ارفع بحثك الأول الآن &larr;
              </button>
            </div>
          </div>

          <div className="md:col-span-6 grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/60 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between relative">
              <div className="p-2.5 bg-zinc-900 rounded-xl w-fit self-end text-purple-400 border border-zinc-800">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white font-mono">{totalMyArticles}</p>
                <p className="text-xs text-gray-500 mt-1">بحوث قمتُ بنشرها</p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between relative">
              <div className="p-2.5 bg-zinc-900 rounded-xl w-fit self-end text-cyan-400 border border-zinc-800">
                <Bookmark className="w-5 h-5" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-white font-mono">{totalBookmarks}</p>
                <p className="text-xs text-gray-500 mt-1">المقالات المحفوظة</p>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-zinc-900 p-5 rounded-2xl flex flex-col justify-between col-span-2 relative">
              <div className="absolute top-4 left-4 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 px-2 py-0.5 rounded-full font-mono">
                +14% MONTHLY
              </div>
              <div className="p-2.5 bg-zinc-900 rounded-xl w-fit self-end text-amber-400 border border-zinc-800">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className="mt-4 flex justify-between items-baseline">
                <p className="text-2xl font-bold text-white font-mono">{totalViews}</p>
                <p className="text-xs text-gray-500">إجمالي مشاهدات منشوراتي</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selection Filter Controls */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 pt-6 border-t border-zinc-900">
          {/* Main workspace tabs */}
          <div className="flex space-x-2 space-x-reverse bg-zinc-950 p-1 rounded-xl border border-zinc-900 self-start">
            <button
              onClick={() => { setActiveTab("all"); }}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${activeTab === "all" ? "bg-zinc-900 text-white border border-zinc-800" : "text-gray-400 hover:text-white"}`}
            >
              <Layers className="w-4 h-4" />
              <span>البحوث المنشورة</span>
            </button>
            <button
              onClick={() => { setActiveTab("my"); }}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${activeTab === "my" ? "bg-zinc-900 text-white border border-zinc-800" : "text-gray-400 hover:text-white"}`}
            >
              <User className="w-4 h-4" />
              <span>مساحة كتاباتي ({totalMyArticles})</span>
            </button>
            <button
              onClick={() => { setActiveTab("bookmarks"); }}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold transition-all duration-300 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${activeTab === "bookmarks" ? "bg-zinc-900 text-white border border-zinc-800" : "text-gray-400 hover:text-white"}`}
            >
              <Bookmark className="w-4 h-4" />
              <span>المحفوظات ({totalBookmarks})</span>
            </button>
          </div>

          {/* Search bar inputs */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="ابحث عن عنوان، كاتب، وسم أو محتوى بحثي..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-900 focus:border-purple-600 rounded-xl py-2.5 pr-10 pl-4 text-xs md:text-sm text-right text-white placeholder-gray-500 outline-none transition-all duration-300"
            />
            <Search className="absolute right-3.5 top-3.5 w-4 h-4 text-gray-500" />
          </div>
        </div>

        {/* Categories Tab Bar */}
        <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory("الكل")}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${selectedCategory === "الكل" ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10" : "bg-zinc-950 text-gray-400 hover:text-white border border-zinc-900"}`}
          >
            الكل
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value as CategoryType)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${selectedCategory === cat.value ? "bg-purple-600 text-white shadow-lg shadow-purple-500/10" : "bg-zinc-950 text-gray-400 hover:text-white border border-zinc-900"}`}
            >
              {getCategoryIcon(cat.value)}
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Article Grid / Listing feed */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 font-mono">LOADING METADATA ...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-950/30 border border-dashed border-zinc-900 rounded-2xl">
            <BookOpen className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">لم يتم العثور على أي بحوث</h3>
            <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
              {searchQuery ? "جرّب تغيير عبارات البحث أو الفلاتر للعثور على المقالات المطلوبة." : "لا توجد منشورات في هذا القسم بعد. كن أول من يرفع مقالاً علمياً مميزاً!"}
            </p>
            {!searchQuery && (
              <button 
                onClick={onNavigateToUpload}
                className="mt-6 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer"
              >
                انشر مقالاً الآن
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((art, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                key={art.id}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                onClick={() => onSelectArticle(art.id)}
                className="bg-zinc-950/80 border border-zinc-900 hover:border-purple-500/40 p-6 rounded-2xl flex flex-col justify-between shadow-xl cursor-pointer transition-all duration-300 relative group overflow-hidden"
              >
                {/* Glowing subtle circle */}
                <div className="absolute -top-10 -left-10 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-300"></div>

                <div>
                  {/* Category and Read time */}
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(art.createdAt).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                    <span className="bg-zinc-900 border border-zinc-800 text-cyan-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg flex items-center space-x-1.5 space-x-reverse">
                      {getCategoryIcon(art.category)}
                      <span>{art.category}</span>
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white group-hover:text-purple-400 line-clamp-2 leading-snug transition-colors duration-300">
                    {art.title}
                  </h3>

                  {/* Author */}
                  <p className="text-xs text-gray-500 mt-2 flex items-center space-x-1.5 space-x-reverse justify-start">
                    <User className="w-3.5 h-3.5" />
                    <span>بقلم: {art.authorName}</span>
                  </p>

                  {/* Snippet Content */}
                  <p className="text-xs text-gray-400 mt-4 line-clamp-3 leading-relaxed">
                    {art.content}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-900/80">
                  {/* AI Tags display */}
                  {art.aiInsights && art.aiInsights.tags && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {art.aiInsights.tags.slice(0, 3).map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] bg-zinc-900 border border-zinc-800 text-gray-400 px-2 py-0.5 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats and Difficulty */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <span className="text-[10px] text-gray-500 flex items-center space-x-1 space-x-reverse">
                        <ThumbsUp className={`w-3 h-3 ${art.likes.includes(currentUser.id) ? "text-purple-400 fill-purple-400" : ""}`} />
                        <span className="font-mono">{art.likes.length}</span>
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center space-x-1 space-x-reverse">
                        <Eye className="w-3.5 h-3.5" />
                        <span className="font-mono">{art.views}</span>
                      </span>
                    </div>

                    <div className="flex space-x-2 space-x-reverse">
                      {art.aiInsights?.difficulty && (
                        <span className={`text-[10px] border px-2 py-0.5 rounded-md font-medium ${getDifficultyColor(art.aiInsights.difficulty)}`}>
                          {art.aiInsights.difficulty}
                        </span>
                      )}
                      <span className="text-[10px] text-gray-400 bg-zinc-900 px-2 py-0.5 rounded-md font-mono">
                        {art.pageCount} صفحة
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
