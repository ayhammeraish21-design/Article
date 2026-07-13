import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { 
  ArrowRight, UploadCloud, FileText, Sparkles, BookOpen, 
  HelpCircle, Settings, Check, Loader2, AlertCircle, RefreshCw, Cpu
} from "lucide-react";
import { CATEGORIES, AiInsights } from "../types";

interface ArticleUploaderProps {
  currentUserId: string;
  onUploadSuccess: () => void;
  onBackToDashboard: () => void;
}

export default function ArticleUploader({ 
  currentUserId, 
  onUploadSuccess, 
  onBackToDashboard 
}: ArticleUploaderProps) {
  // Input states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("علمي");

  // File parsing states
  const [fileParsing, setFileParsing] = useState(false);
  const [fileError, setFileError] = useState("");
  const [fileName, setFileName] = useState("");

  // AI Insights states
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);
  const [aiStepMsg, setAiStepMsg] = useState("");

  // Global submit states
  const [publishing, setPublishing] = useState(false);
  const [pubError, setPubError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag & Drop
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Check file type
    const isDocx = file.name.toLowerCase().endsWith(".docx");
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const isTxt = file.name.toLowerCase().endsWith(".txt");
    
    if (!isDocx && !isPdf && !isTxt) {
      setFileError("نقبل فقط ملفات Word (.docx) أو PDF (.pdf) أو ملفات النصية البسيطة (.txt)");
      return;
    }

    setFileParsing(true);
    setFileError("");
    setFileName(file.name);

    try {
      if (isTxt) {
        const text = await file.text();
        setTitle(file.name.replace(/\.[^/.]+$/, ""));
        setContent(text);
      } else {
        // Send to backend for parsing (.docx or .pdf)
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/articles/parse-file", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${currentUserId}`
          },
          body: formData
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "فشل تحليل مستند البحث المستورد");
        }

        setTitle(data.title);
        setContent(data.content);
      }
    } catch (err: any) {
      setFileError(err.message || "حدث خطأ أثناء قراءة وتحليل الملف");
    } finally {
      setFileParsing(false);
    }
  };

  // Run Gemini AI Analysis
  const runAiAnalysis = async () => {
    if (!title || !content) {
      setPubError("يرجى كتابة عنوان ومحتوى المقال أولاً ليتمكن الذكاء الاصطناعي من تحليله");
      return;
    }

    setAiGenerating(true);
    setPubError("");
    setAiInsights(null);

    // Dynamic AI loading messages
    const steps = [
      "جاري فحص تركيب الجمل البنيوية في المقال...",
      "جاري استدعاء نموذج الذكاء الاصطناعي جيني...",
      "جاري تلخيص المحتوى وصياغة الملخص الأكاديمي...",
      "جاري استنباط الخلاصات والتوصيات الرئيسية...",
      "جاري اقتراح الكلمات المفتاحية الدلالية وتصنيف الصعوبة..."
    ];

    let stepIndex = 0;
    setAiStepMsg(steps[0]);
    const interval = setInterval(() => {
      stepIndex = (stepIndex + 1) % steps.length;
      setAiStepMsg(steps[stepIndex]);
    }, 2000);

    try {
      const response = await fetch("/api/articles/ai-analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUserId}`
        },
        body: JSON.stringify({ title, content, category })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "فشل تحليل الذكاء الاصطناعي");
      }

      setAiInsights(data);
    } catch (err: any) {
      setPubError("فشل تحليل الذكاء الاصطناعي: " + err.message);
    } finally {
      clearInterval(interval);
      setAiGenerating(false);
    }
  };

  // Submit and Publish Article
  const handlePublish = async () => {
    if (!title.trim() || !content.trim() || !category) {
      setPubError("جميع الحقول (العنوان، المحتوى، والتصنيف) مطلوبة");
      return;
    }

    setPublishing(true);
    setPubError("");

    try {
      const response = await fetch("/api/articles/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentUserId}`
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          aiInsights: aiInsights || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "فشل نشر المقال");
      }

      onUploadSuccess();
    } catch (err: any) {
      setPubError(err.message || "فشل الاتصال بالخادم لنشر المقال");
    } finally {
      setPublishing(false);
    }
  };

  const getWordCount = () => content.split(/\s+/).filter(Boolean).length;
  const getEstimatedPageCount = () => Math.max(1, Math.ceil(getWordCount() / 300));

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans pb-20 text-right">
      {/* Background glow effects */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-purple-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-900 px-4 py-3.5 md:px-8 flex justify-between items-center">
        <button 
          onClick={onBackToDashboard}
          className="text-xs md:text-sm bg-zinc-900 hover:bg-zinc-800 text-gray-300 px-4 py-2 rounded-xl border border-zinc-800/60 transition-all duration-300 flex items-center space-x-1.5 cursor-pointer"
        >
          <span>إلغاء والعودة</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-2 space-x-reverse">
          <div className="p-2 bg-purple-950 text-purple-400 rounded-xl">
            <UploadCloud className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-white">نشر بحث أو مقال جديد</h1>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: AI Review and Metadata Settings */}
        <div className="lg:col-span-4 space-y-6 order-2 lg:order-1">
          {/* Metadata selection card */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-zinc-900 pb-3 flex items-center space-x-2 space-x-reverse justify-end">
              <span>خيارات البحث والمقال</span>
              <Settings className="w-4 h-4 text-purple-400" />
            </h3>

            <div className="space-y-2">
              <label className="text-xs text-gray-400 block font-medium">تصنيف المقال</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-600 rounded-xl px-3 py-2.5 text-xs md:text-sm text-right text-white outline-none cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-zinc-900/40 border border-zinc-900 p-3 rounded-xl text-center">
                <span className="text-lg font-bold text-white font-mono">{getWordCount()}</span>
                <span className="text-[10px] text-gray-500 block mt-1">عدد الكلمات</span>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-900 p-3 rounded-xl text-center">
                <span className="text-lg font-bold text-white font-mono">{getEstimatedPageCount()}</span>
                <span className="text-[10px] text-gray-500 block mt-1">الصفحات المتوقعة</span>
              </div>
            </div>

            {/* AI Generator Button */}
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={runAiAnalysis}
              disabled={aiGenerating || fileParsing || !content}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 space-x-reverse cursor-pointer transition-all duration-300 ${!content ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed" : "bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-800/40 shadow-lg shadow-purple-500/5"}`}
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحليل...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>توليد تحليلات جيني (AI)</span>
                </>
              )}
            </motion.button>
          </div>

          {/* AI Insights Card Panel */}
          {(aiGenerating || aiInsights) && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-950 border border-purple-900/30 rounded-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <h3 className="text-sm font-bold text-white border-b border-zinc-900 pb-3 flex items-center space-x-2 space-x-reverse justify-end">
                <span>تحليلات الذكاء الاصطناعي (جيني)</span>
                <Cpu className="w-4 h-4 text-cyan-400 animate-pulse" />
              </h3>

              {aiGenerating ? (
                <div className="py-10 flex flex-col items-center justify-center space-y-4">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-purple-300 text-center animate-pulse">{aiStepMsg}</p>
                </div>
              ) : aiInsights ? (
                <div className="space-y-5 pt-3">
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-purple-400 font-mono uppercase font-semibold">الملخص الأكاديمي</span>
                    <p className="text-xs text-gray-400 leading-relaxed bg-zinc-900/50 p-3 rounded-xl border border-zinc-900">
                      {aiInsights.summary}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-purple-400 font-mono uppercase font-semibold">الخلاصات المعرفية</span>
                    <ul className="space-y-2">
                      {aiInsights.keyTakeaways.map((point, pIdx) => (
                        <li key={pIdx} className="text-xs text-gray-300 bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl flex items-start space-x-2 space-x-reverse">
                          <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 block">وقت القراءة المقدر</span>
                      <span className="text-xs font-bold text-white mt-1 block font-mono">{aiInsights.readingTimeMinutes} دقيقة</span>
                    </div>
                    <div className="bg-zinc-900/30 border border-zinc-900 p-2.5 rounded-xl text-center">
                      <span className="text-[10px] text-gray-500 block">مستوى البحث</span>
                      <span className="text-xs font-bold text-white mt-1 block">{aiInsights.difficulty}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-[10px] text-purple-400 font-mono uppercase font-semibold">الوسوم الذكية</span>
                    <div className="flex flex-wrap gap-1.5">
                      {aiInsights.tags.map((tag, tIdx) => (
                        <span key={tIdx} className="text-[10px] bg-purple-950/20 text-purple-300 border border-purple-900/40 px-2.5 py-1 rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          )}

          {/* Publish Controls Panel */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 space-y-4">
            {pubError && (
              <div className="bg-red-950/40 border border-red-800/40 text-red-300 p-3.5 rounded-xl text-xs flex items-start space-x-2 space-x-reverse">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{pubError}</span>
              </div>
            )}

            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={onBackToDashboard}
                disabled={publishing}
                className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-gray-300 font-bold py-3 px-4 rounded-xl text-xs transition-all duration-300 border border-zinc-800 cursor-pointer"
              >
                إلغاء
              </button>
              
              <button
                onClick={handlePublish}
                disabled={publishing || fileParsing || !title || !content}
                className={`flex-1 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center space-x-2 space-x-reverse cursor-pointer transition-all duration-300 ${(!title || !content) ? "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed" : "bg-gradient-to-l from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-black shadow-lg shadow-purple-500/10"}`}
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span className="text-black">جاري النشر...</span>
                  </>
                ) : (
                  <span className="text-black">نشر البحث الآن</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Upload drag-drop area and editor inputs */}
        <div className="lg:col-span-8 space-y-6 order-1 lg:order-2">
          
          {/* File uploader dropzone */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`bg-zinc-950 border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-300 relative ${dragActive ? "border-purple-500 bg-purple-950/5" : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/60"}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,.pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
            />

            {fileParsing ? (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                <p className="text-xs text-purple-300">جاري فحص محتويات ملف المستورد واستخراج النصوص...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-purple-400 group-hover:scale-105 transition-transform duration-300">
                  <UploadCloud className="w-8 h-8 text-purple-400" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">قم برفع ملف البحث من جهازك</h3>
                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    نقبل ملفات Word ذات اللاحقة <span className="text-purple-400 font-mono">.docx</span> أو <span className="text-purple-400 font-mono">.pdf</span> أو ملفات <span className="text-purple-400 font-mono">.txt</span> بأي طول صفحات
                  </p>
                </div>

                <div className="flex space-x-2 space-x-reverse pt-2 justify-center">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-gray-300 text-xs px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer"
                  >
                    تصفح الملفات
                  </button>
                </div>

                {fileName && (
                  <div className="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-900/40 py-1.5 px-3.5 rounded-xl flex items-center space-x-1.5 space-x-reverse justify-center">
                    <FileText className="w-3.5 h-3.5" />
                    <span>تم استيراد: {fileName}</span>
                  </div>
                )}

                {fileError && (
                  <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/40 py-1.5 px-3.5 rounded-xl flex items-center space-x-1.5 space-x-reverse justify-center">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{fileError}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form input fields */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 md:p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-medium">عنوان المقال أو الورقة البحثية</label>
              <input
                type="text"
                placeholder="أدخل عنوان البحث أو المقال الرئيسي هنا..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-600 rounded-xl py-3 px-4 text-sm md:text-base text-right text-white placeholder-gray-600 outline-none transition-all duration-300 font-bold"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-500 font-mono">يدعم المقال عدد لا نهائي من الصفحات والكلمات</span>
                <label className="text-xs text-gray-400 font-medium">محتوى المقال أو البحث الكامل</label>
              </div>
              <textarea
                rows={15}
                placeholder="اكتب أو الصق محتوى المقال الكامل هنا بالتفصيل..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 focus:border-purple-600 rounded-xl p-4 text-xs md:text-sm text-right text-white placeholder-gray-600 outline-none transition-all duration-300 font-sans leading-relaxed resize-y"
              ></textarea>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
