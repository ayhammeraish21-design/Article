import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, ThumbsUp, Eye, Bookmark, MessageSquare, Sparkles, 
  BookOpen, ChevronRight, ChevronLeft, Type, Maximize2, Minimize2, 
  Send, Loader2, RefreshCw, Cpu, Check, HelpCircle, FileText
} from "lucide-react";
import { Article, Comment, User as UserType } from "../types";

interface ArticleReaderProps {
  articleId: string;
  currentUser: UserType;
  onBackToDashboard: () => void;
}

export default function ArticleReader({ 
  articleId, 
  currentUser, 
  onBackToDashboard 
}: ArticleReaderProps) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reading customization settings
  const [textSize, setTextSize] = useState<"sm" | "base" | "lg" | "xl">("lg");
  const [theme, setTheme] = useState<"black" | "navy" | "stone">("black");
  const [fontSerif, setFontSerif] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"scroll" | "pages">("scroll");
  const [currentPage, setCurrentPage] = useState(1);

  // Interaction states
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  
  // Comments states
  const [newComment, setNewComment] = useState("");
  const [commentsList, setCommentsList] = useState<Comment[]>([]);
  const [submittingComment, setSubmittingComment] = useState(false);

  // AI Chat Assistant inside reader states
  const [chatQuery, setChatQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{ sender: "user" | "ai"; text: string }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/articles/${articleId}`);
      if (response.ok) {
        const data: Article = await response.json();
        setArticle(data);
        setCommentsList(data.comments || []);
        setLikesCount(data.likes.length);
        setLiked(data.likes.includes(currentUser.id));
        setBookmarked(data.bookmarks.includes(currentUser.id));
      } else {
        setError("فشل العثور على المقال المطلوبة");
      }
    } catch (err) {
      setError("حدث خطأ أثناء الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // Like Toggle
  const handleLike = async () => {
    if (!article) return;
    try {
      // Optimistic update
      setLiked(!liked);
      setLikesCount(prev => liked ? prev - 1 : prev + 1);

      const response = await fetch(`/api/articles/${article.id}/like`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setLikesCount(data.likesCount);
        setLiked(data.isLiked);
      }
    } catch (err) {
      console.error("Error liking:", err);
    }
  };

  // Bookmark Toggle
  const handleBookmark = async () => {
    if (!article) return;
    try {
      setBookmarked(!bookmarked);

      const response = await fetch(`/api/articles/${article.id}/bookmark`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentUser.id}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setBookmarked(data.isBookmarked);
      }
    } catch (err) {
      console.error("Error bookmarking:", err);
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/articles/${article.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        setCommentsList(prev => [...prev, data]);
        setNewComment("");
      }
    } catch (err) {
      console.error("Error commenting:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Chat with Gemini about the article
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || !chatQuery.trim() || chatLoading) return;

    const userMsg = chatQuery.trim();
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatQuery("");
    setChatLoading(true);

    try {
      const response = await fetch("/api/articles/ai-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUser.id}`
        },
        body: JSON.stringify({
          title: article.title,
          category: article.category,
          content: `أنا أقرأ هذا المقال حالياً. أجب على السؤال التالي بناءً على محتوى هذا المقال وموضوعه فقط.
المقال:
"${article.content}"

السؤال المطروح من القارئ:
"${userMsg}"`
        })
      });

      const data = await response.json();
      if (response.ok) {
        // Since ai-analyze returns insights, we can parse response.summary or let backend do it
        // To keep chat responses flexible, we've designed ai-analyze to analyze content. We can extract summaries.
        // Let's display the returned summary as the answer
        setChatHistory(prev => [...prev, { sender: "ai", text: data.summary }]);
      } else {
        throw new Error();
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "عذراً، واجهت مشكلة في معالجة طلبك وحل اللغز المعرفي حالياً. يرجى إعادة المحاولة." }]);
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 font-mono">LOADING FULL PAPER CONTENT ...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-black text-gray-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 max-w-md">
          <h2 className="text-xl font-bold text-red-400">خطأ في التحميل</h2>
          <p className="text-sm text-gray-400 mt-2">{error || "المقال المطلوب غير متوفر حالياً"}</p>
          <button 
            onClick={onBackToDashboard}
            className="mt-6 w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // Calculate text paging blocks
  // Word files generally have about 300 words per page. Let's chunk content by paragraphs or words.
  const paragraphs = article.content.split("\n\n").filter(Boolean);
  const totalPages = Math.max(1, Math.ceil(paragraphs.length / 2)); // 2 paragraphs per virtual page
  
  const getPagedContent = () => {
    if (layoutMode === "scroll") return article.content;
    const startIndex = (currentPage - 1) * 2;
    const pBlock = paragraphs.slice(startIndex, startIndex + 2);
    return pBlock.join("\n\n");
  };

  const getReaderThemeClass = () => {
    switch (theme) {
      case "navy": return "bg-slate-950 text-slate-100 selection:bg-cyan-500/30";
      case "stone": return "bg-stone-950 text-stone-100 selection:bg-amber-500/30";
      default: return "bg-black text-zinc-100 selection:bg-purple-500/30";
    }
  };

  const getTextSizeClass = () => {
    switch (textSize) {
      case "sm": return "text-sm leading-relaxed md:leading-loose tracking-wide text-justify";
      case "lg": return "text-lg md:text-xl leading-[2.1] tracking-wide text-justify";
      case "xl": return "text-2xl md:text-3xl leading-[2.4] tracking-wide text-justify";
      default: return "text-base md:text-lg leading-[1.95] tracking-wide text-justify";
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-500 ${getReaderThemeClass()} font-sans text-right pb-16 relative`}>
      
      {/* Background glow effects */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-purple-600/5 rounded-full blur-[150px] pointer-events-none"></div>

      {/* Reader Navbar */}
      <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 px-4 py-3 md:px-8 flex justify-between items-center text-white">
        {/* Navigation settings bar (Font size, styling controls) */}
        <div className="flex items-center space-x-3 space-x-reverse">
          {/* Layout switch */}
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800/60">
            <button
              onClick={() => setLayoutMode("scroll")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${layoutMode === "scroll" ? "bg-zinc-800 text-white" : "text-gray-400 hover:text-white"}`}
              title="تمرير مستمر"
            >
              مستمر
            </button>
            <button
              onClick={() => { setLayoutMode("pages"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${layoutMode === "pages" ? "bg-zinc-800 text-white" : "text-gray-400 hover:text-white"}`}
              title="قراءة كصفحات كتاب"
            >
              صفحات ({article.pageCount})
            </button>
          </div>

          <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block"></div>

          {/* Text controls */}
          <div className="flex space-x-1.5 space-x-reverse bg-zinc-900 p-1 rounded-xl border border-zinc-800/60">
            <button
              onClick={() => {
                if (textSize === "xl") setTextSize("lg");
                else if (textSize === "lg") setTextSize("base");
                else if (textSize === "base") setTextSize("sm");
              }}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              title="تصغير الخط"
            >
              <Type className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-gray-500 self-center uppercase px-1">
              {textSize}
            </span>
            <button
              onClick={() => {
                if (textSize === "sm") setTextSize("base");
                else if (textSize === "base") setTextSize("lg");
                else if (textSize === "lg") setTextSize("xl");
              }}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg"
              title="تكبير الخط"
            >
              <Type className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="h-5 w-[1px] bg-zinc-800 hidden sm:block"></div>

          {/* Font Type Toggle */}
          <button
            onClick={() => setFontSerif(!fontSerif)}
            className={`p-2 bg-zinc-900 border border-zinc-800/60 rounded-xl text-xs font-semibold transition-all ${fontSerif ? "text-purple-400 border-purple-950" : "text-gray-400"}`}
            title="تغيير نوع الخط"
          >
            {fontSerif ? "خط أكاديمي" : "خط بسيط"}
          </button>
        </div>

        {/* Back and Title */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="text-right hidden md:block max-w-sm lg:max-w-md">
            <h2 className="text-sm font-bold text-white truncate">{article.title}</h2>
            <p className="text-[10px] text-gray-500 mt-0.5">تصنيف: {article.category} // كاتب: {article.authorName}</p>
          </div>
          <button 
            onClick={onBackToDashboard}
            className="text-xs bg-zinc-900 hover:bg-zinc-800 text-gray-300 px-3.5 py-2 rounded-xl border border-zinc-800/60 transition-all duration-300 flex items-center space-x-1.5"
          >
            <span>العودة</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Responsive Grid Layout */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 items-start">
        
        {/* Right Area: Article Text Screen (Take 8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-zinc-950/30 border border-zinc-900 rounded-3xl p-6 md:p-10 shadow-2xl relative">
            
            {/* Header info inside body */}
            <div className="border-b border-zinc-900/80 pb-6 mb-8 text-right">
              <span className="text-xs text-purple-400 font-semibold bg-purple-950/20 border border-purple-900/40 px-3 py-1 rounded-full">
                {article.category}
              </span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mt-4 leading-tight">
                {article.title}
              </h1>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-gray-500 font-mono justify-start">
                <span>الكاتب: {article.authorName}</span>
                <span>•</span>
                <span>الصفحات: {article.pageCount}</span>
                <span>•</span>
                <span>الكلمات: {article.wordCount}</span>
                <span>•</span>
                <span>المشاهدات: {article.views}</span>
              </div>
            </div>

            {/* Main Content Body */}
            <article 
              className={`leading-relaxed whitespace-pre-wrap transition-all duration-300 ${getTextSizeClass()} ${fontSerif ? "font-serif text-gray-200" : "font-sans text-gray-300"}`}
              style={{ direction: "rtl" }}
            >
              {getPagedContent()}
            </article>

            {/* Pagination Controls */}
            {layoutMode === "pages" && (
              <div className="flex justify-between items-center mt-12 pt-6 border-t border-zinc-900/80">
                <button
                  onClick={() => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-xs font-semibold border border-zinc-800 flex items-center space-x-1.5 space-x-reverse cursor-pointer ${currentPage === totalPages ? "opacity-35 cursor-not-allowed" : ""}`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الصفحة التالية</span>
                </button>

                <span className="text-xs text-gray-500 font-mono">
                  صفحة {currentPage} من {totalPages}
                </span>

                <button
                  onClick={() => { if (currentPage > 1) setCurrentPage(currentPage - 1); }}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-xs font-semibold border border-zinc-800 flex items-center space-x-1.5 cursor-pointer ${currentPage === 1 ? "opacity-35 cursor-not-allowed" : ""}`}
                >
                  <span>الصفحة السابقة</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Persistent Engagements & Interactive Feedback section (Likes, Bookmarks, Comments) */}
          <div className="bg-zinc-950/40 border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
              <h3 className="text-base font-bold text-white flex items-center space-x-2 space-x-reverse">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>النقاش العلمي والتعليقات ({commentsList.length})</span>
              </h3>

              {/* Engagement Toggles */}
              <div className="flex space-x-2.5 space-x-reverse">
                <button
                  onClick={handleBookmark}
                  className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center space-x-1.5 space-x-reverse text-xs cursor-pointer ${bookmarked ? "bg-cyan-950/40 border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-500/5" : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800/60 text-gray-400 hover:text-white"}`}
                  title={bookmarked ? "إلغاء حفظ البحث" : "حفظ البحث بالمفضلة"}
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-cyan-400" : ""}`} />
                  <span className="hidden sm:inline">{bookmarked ? "محفوظ" : "حفظ بالمفضلة"}</span>
                </button>

                <button
                  onClick={handleLike}
                  className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center space-x-1.5 space-x-reverse text-xs cursor-pointer ${liked ? "bg-purple-950/40 border-purple-500/40 text-purple-400 shadow-md shadow-purple-500/5" : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800/60 text-gray-400 hover:text-white"}`}
                >
                  <ThumbsUp className={`w-4 h-4 ${liked ? "fill-purple-400" : ""}`} />
                  <span className="font-mono">{likesCount}</span>
                </button>
              </div>
            </div>

            {/* Submit Comment Input Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-3">
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center justify-center transition-all duration-300 cursor-pointer ${!newComment.trim() ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-500 text-black shadow-lg shadow-purple-500/10"}`}
              >
                {submittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <span>إرسال</span>
                )}
              </button>
              <input
                type="text"
                placeholder="اكتب تعليقك الأكاديمي أو وجهة نظرك في هذا البحث..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-purple-600 rounded-xl py-2.5 px-4 text-xs md:text-sm text-right text-white placeholder-gray-500 outline-none transition-all duration-300"
              />
            </form>

            {/* Comments Stream Feed */}
            {commentsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                لا توجد مناقشات حول هذا البحث بعد. ابدأ بكتابة تعليق علمي مميز وإثراء الحوار!
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {commentsList.map((c) => (
                  <div key={c.id} className="bg-zinc-900/30 border border-zinc-900 p-4 rounded-2xl space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-mono">
                        {new Date(c.createdAt).toLocaleDateString("ar-EG")} {new Date(c.createdAt).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-semibold text-white">{c.username}</span>
                    </div>
                    <p className="text-xs md:text-sm text-gray-300 pt-1 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Left Area: Gemini AI Insights panel & Interactive Chat Assistant (Take 4 cols) */}
        <div className="lg:col-span-4 space-y-6 order-1 lg:order-2">
          
          {/* AI Summaries Panel */}
          {article.aiInsights ? (
            <div className="bg-zinc-950 border border-purple-900/30 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl pointer-events-none"></div>

              <h3 className="text-sm font-bold text-white border-b border-zinc-900 pb-3 flex items-center space-x-2 space-x-reverse justify-end">
                <span>مراجعة الذكاء الاصطناعي (جيني)</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h3>

              <div className="space-y-4 text-right">
                <div className="space-y-1">
                  <span className="text-[10px] text-purple-400 font-mono uppercase font-semibold block">ملخص البحث الأكاديمي</span>
                  <p className="text-xs text-gray-300 leading-relaxed bg-zinc-900/40 border border-zinc-900 p-3 rounded-xl">
                    {article.aiInsights.summary}
                  </p>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-purple-400 font-mono uppercase font-semibold block">الخلاصات الرئيسية</span>
                  <ul className="space-y-2">
                    {article.aiInsights.keyTakeaways.map((point, pIdx) => (
                      <li key={pIdx} className="text-xs text-gray-300 bg-zinc-900/20 border border-zinc-900 p-2.5 rounded-xl flex items-start space-x-2 space-x-reverse">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] text-purple-400 font-mono uppercase font-semibold block">الوسوم الأكاديمية</span>
                  <div className="flex flex-wrap gap-1">
                    {article.aiInsights.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="text-[10px] bg-zinc-900 border border-zinc-800 text-gray-400 px-2.5 py-1 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1 text-center">
                  <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">زمن القراءة المقدر</span>
                    <span className="text-xs font-bold text-white mt-1 block font-mono">{article.aiInsights.readingTimeMinutes} دقائق</span>
                  </div>
                  <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl">
                    <span className="text-[10px] text-gray-500 block">مستوى البحث</span>
                    <span className="text-xs font-bold text-white mt-1 block">{article.aiInsights.difficulty}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-zinc-700 mx-auto" />
              <h4 className="text-xs font-bold text-white">لم يخضع هذا البحث للتدقيق بالذكاء الاصطناعي</h4>
              <p className="text-[10px] text-gray-500 leading-relaxed">لم يقم الكاتب بتوليد الملخص المعرفي وجيني أثناء النشر.</p>
            </div>
          )}

          {/* Interactive Chat Assistant with Gemini about research */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4 relative overflow-hidden shadow-xl flex flex-col h-[400px]">
            <h3 className="text-xs md:text-sm font-bold text-white border-b border-zinc-900 pb-3 flex items-center space-x-2 space-x-reverse justify-end">
              <span>اسأل جيني حول هذا البحث</span>
              <Cpu className="w-4 h-4 text-cyan-400" />
            </h3>

            {/* Chat Messages Log */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin text-xs">
              {chatHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500 flex flex-col items-center space-y-2 justify-center h-full">
                  <HelpCircle className="w-6 h-6 text-zinc-700" />
                  <p className="max-w-[180px] leading-normal text-[10px]">
                    اطرح أي سؤال حول مصطلحات، فرضيات، أو نتائج هذا البحث وسيجيبك المساعد فوراً.
                  </p>
                </div>
              ) : (
                chatHistory.map((chat, cIdx) => (
                  <div key={cIdx} className={`flex flex-col space-y-1 ${chat.sender === "user" ? "items-start" : "items-end"}`}>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest px-1">
                      {chat.sender === "user" ? "أنت" : "المساعد الذكي"}
                    </span>
                    <div className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${chat.sender === "user" ? "bg-zinc-900 border border-zinc-800 text-gray-200 text-left" : "bg-purple-950/20 border border-purple-900/30 text-purple-300 text-right"}`}>
                      {chat.text}
                    </div>
                  </div>
                ))
              )}
              {chatLoading && (
                <div className="flex flex-col space-y-1 items-end">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest px-1">جاري القراءة والتحليل...</span>
                  <div className="p-3 bg-purple-950/20 border border-purple-900/30 text-purple-300 rounded-2xl flex items-center space-x-2 space-x-reverse">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري التفكير وصياغة الإجابة...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Query input form */}
            <form onSubmit={handleChatSubmit} className="flex gap-2 border-t border-zinc-900 pt-3">
              <button
                type="submit"
                disabled={chatLoading || !chatQuery.trim()}
                className={`p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer ${!chatQuery.trim() ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed" : "bg-gradient-to-l from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-black"}`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <input
                type="text"
                placeholder="مثال: لخص لي أهم فرضية؟"
                value={chatQuery}
                onChange={(e) => setChatQuery(e.target.value)}
                disabled={chatLoading}
                className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-purple-600 rounded-xl py-2 px-3 text-[11px] text-right text-white placeholder-gray-600 outline-none transition-all duration-300"
              />
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
