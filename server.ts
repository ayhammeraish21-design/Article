import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import multer from "multer";
import mammoth from "mammoth";
// @ts-ignore
import pdf from "pdf-parse";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client Lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not set. AI research insights will operate in simulated fallback mode.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Multer setup for memory storage (for docx uploads)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// JSON Local Database File Path
const DB_PATH = path.join(process.cwd(), "data.json");

// Define types locally for backend
interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

interface Comment {
  id: string;
  articleId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

interface AiInsights {
  summary: string;
  keyTakeaways: string[];
  tags: string[];
  readingTimeMinutes: number;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم';
}

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  authorId: string;
  authorName: string;
  wordCount: number;
  pageCount: number;
  views: number;
  likes: string[]; // user ids
  bookmarks: string[]; // user ids
  comments: Comment[];
  aiInsights?: AiInsights;
  createdAt: string;
}

interface Database {
  users: User[];
  articles: Article[];
}

const DEFAULT_ARTICLES: Article[] = [];

// Helper to load database
function loadDb(): Database {
  try {
    if (!fs.existsSync(DB_PATH)) {
      const initialDb: Database = {
        users: [
          { id: "user-system-1", username: "أمين الخالدي", email: "amin@research.org", createdAt: new Date().toISOString() },
          { id: "user-system-2", username: "رانيا منصور", email: "rania@space.sci", createdAt: new Date().toISOString() },
          { id: "user-system-3", username: "يوسف الأندلسي", email: "youssef@andalus.edu", createdAt: new Date().toISOString() }
        ],
        articles: DEFAULT_ARTICLES
      };
      fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), "utf8");
      return initialDb;
    }
    const data = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database file, using in-memory default database:", err);
    return {
      users: [],
      articles: DEFAULT_ARTICLES
    };
  }
}

// Helper to save database
function saveDb(db: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing database file:", err);
  }
}

// API Routes

// Registration Endpoint
app.post("/api/auth/register", (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email) {
    return res.status(400).json({ error: "اسم المستخدم والبريد الإلكتروني مطلوبان" });
  }

  const db = loadDb();
  const existingUser = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(400).json({ error: "البريد الإلكتروني مسجل بالفعل" });
  }

  const newUser: User = {
    id: "user-" + Math.random().toString(36).substr(2, 9),
    username,
    email: email.toLowerCase(),
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDb(db);

  res.status(201).json({ user: newUser, token: newUser.id });
});

// Login Endpoint
app.post("/api/auth/login", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "البريد الإلكتروني مطلوب" });
  }

  const db = loadDb();
  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    return res.status(404).json({ error: "المستخدم غير موجود، يرجى التسجيل أولاً" });
  }

  res.json({ user, token: user.id });
});

// Me Endpoint
app.get("/api/auth/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "غير مصرح، يرجى تسجيل الدخول" });
  }

  const db = loadDb();
  const user = db.users.find(u => u.id === token);
  if (!user) {
    return res.status(401).json({ error: "مستخدم غير صالح أو انتهت صلاحية الجلسة" });
  }

  res.json({ user });
});

// Get Articles with search & filters
app.get("/api/articles", (req, res) => {
  const db = loadDb();
  const { search, category } = req.query;

  let filtered = [...db.articles];

  if (category && category !== "الكل") {
    filtered = filtered.filter(a => a.category === category);
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.content.toLowerCase().includes(q) ||
      a.authorName.toLowerCase().includes(q) ||
      (a.aiInsights && a.aiInsights.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  // Sort by date descending
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

// Get Single Article & Increment views
app.get("/api/articles/:id", (req, res) => {
  const db = loadDb();
  const articleIndex = db.articles.findIndex(a => a.id === req.params.id);
  
  if (articleIndex === -1) {
    return res.status(404).json({ error: "المقال غير موجود" });
  }

  // Increment views
  db.articles[articleIndex].views += 1;
  saveDb(db);

  res.json(db.articles[articleIndex]);
});

// Like Article
app.post("/api/articles/:id/like", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  const db = loadDb();
  const articleIndex = db.articles.findIndex(a => a.id === req.params.id);
  if (articleIndex === -1) {
    return res.status(404).json({ error: "المقال غير موجود" });
  }

  const article = db.articles[articleIndex];
  const likedIndex = article.likes.indexOf(token);
  
  if (likedIndex > -1) {
    // Unlike
    article.likes.splice(likedIndex, 1);
  } else {
    // Like
    article.likes.push(token);
  }

  saveDb(db);
  res.json({ likesCount: article.likes.length, isLiked: article.likes.includes(token) });
});

// Bookmark Article
app.post("/api/articles/:id/bookmark", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "غير مصرح" });
  }

  const db = loadDb();
  const articleIndex = db.articles.findIndex(a => a.id === req.params.id);
  if (articleIndex === -1) {
    return res.status(404).json({ error: "المقال غير موجود" });
  }

  const article = db.articles[articleIndex];
  const bookmarkIndex = article.bookmarks.indexOf(token);
  
  if (bookmarkIndex > -1) {
    // Unbookmark
    article.bookmarks.splice(bookmarkIndex, 1);
  } else {
    // Bookmark
    article.bookmarks.push(token);
  }

  saveDb(db);
  res.json({ bookmarksCount: article.bookmarks.length, isBookmarked: article.bookmarks.includes(token) });
});

// Add Comment
app.post("/api/articles/:id/comments", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { content } = req.body;

  if (!token) {
    return res.status(401).json({ error: "غير مصرح" });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ error: "محتوى التعليق لا يمكن أن يكون فارغاً" });
  }

  const db = loadDb();
  const user = db.users.find(u => u.id === token);
  const articleIndex = db.articles.findIndex(a => a.id === req.params.id);

  if (!user) {
    return res.status(401).json({ error: "المستخدم غير موجود" });
  }
  if (articleIndex === -1) {
    return res.status(404).json({ error: "المقال غير موجود" });
  }

  const newComment: Comment = {
    id: "c-" + Math.random().toString(36).substr(2, 9),
    articleId: req.params.id,
    userId: user.id,
    username: user.username,
    content: content.trim(),
    createdAt: new Date().toISOString()
  };

  db.articles[articleIndex].comments.push(newComment);
  saveDb(db);

  res.status(201).json(newComment);
});

// Smart function to clean, structure, and format messy text from Word and PDF files
function cleanAndFormatAcademicText(rawText: string): string {
  if (!rawText) return "";

  // 1. Remove carriage returns
  let text = rawText.replace(/\r/g, "");

  // 2. Remove common PDF/Word header/footer noise or watermark lines
  let lines = text.split("\n");
  lines = lines.filter(line => {
    const trimmed = line.trim();
    // Ignore empty lines for a moment, they will be handled during paragraph reconstruction
    if (trimmed === "") return true;
    
    // Ignore lines that are just numbers or page references (e.g., "Page 1", "صفحة 5", etc.)
    if (/^(page|pg|صفحة|ص)\.?\s*\d+(\s*of\s*\d+)?$/i.test(trimmed)) return false;
    if (/^\d+(\s*من\s*\d+)?$/i.test(trimmed)) return false;
    if (/^\d+$/i.test(trimmed)) return false; // purely a page number
    return true;
  });

  // 3. Smart paragraph unwrapping and reconstruction
  const paragraphs: string[] = [];
  let currentParagraphLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "") {
      // Empty line marks a real paragraph boundary
      if (currentParagraphLines.length > 0) {
        paragraphs.push(currentParagraphLines.join(" "));
        currentParagraphLines = [];
      }
      continue;
    }

    // Check if the current line looks like a list item (starts with a bullet or number)
    const isListItem = /^[•\-*+●◆▪]\s+/.test(line) || 
                       /^\d+[\.\-\)]\s+/.test(line) || 
                       /^[أ-ي]\s*[\.\-]\s*/.test(line);
                       
    const isShortLine = line.length < 55;
    const endsWithStrongPunctuation = /[.:!؟»"']$/.test(line);

    if (isListItem) {
      // Flush existing paragraph first
      if (currentParagraphLines.length > 0) {
        paragraphs.push(currentParagraphLines.join(" "));
        currentParagraphLines = [];
      }
      // Add this list item as its own line
      paragraphs.push(line);
    } else if (isShortLine && endsWithStrongPunctuation) {
      // Very likely a standalone section heading or a brief sentence
      if (currentParagraphLines.length > 0) {
        paragraphs.push(currentParagraphLines.join(" "));
        currentParagraphLines = [];
      }
      paragraphs.push(line);
    } else {
      // Regular text flow. Add to current paragraph.
      currentParagraphLines.push(line);
      
      // If the line ends with a final punctuation, and it is reasonably long,
      // we can consider it the end of a sentence/paragraph to keep chunks manageable.
      if (endsWithStrongPunctuation && line.length > 40) {
        paragraphs.push(currentParagraphLines.join(" "));
        currentParagraphLines = [];
      }
    }
  }

  // Flush any leftover lines
  if (currentParagraphLines.length > 0) {
    paragraphs.push(currentParagraphLines.join(" "));
  }

  // 4. Polish the text within paragraphs
  const polishedParagraphs = paragraphs.map(p => {
    let cleaned = p;

    // Replace multiple spaces or tabs with a single space
    cleaned = cleaned.replace(/[ \t]+/g, " ");

    // Standardize Arabic academic punctuation
    // Replace English commas/semicolons with Arabic ones if surrounded by Arabic text
    cleaned = cleaned.replace(/(\s*),(\s*)/g, "، ");
    cleaned = cleaned.replace(/(\s*);(\s*)/g, "؛ ");

    // Ensure punctuation is attached to the preceding word (no leading space) but followed by a space
    cleaned = cleaned.replace(/\s+([،؛.:!؟])/g, "$1");
    // Ensure space after punctuation (only if next character is not a space or number or punctuation)
    cleaned = cleaned.replace(/([،؛.:!؟])(?=[^\s\d،؛.:!؟])/g, "$1 ");

    // Clean up multiple spaces again
    cleaned = cleaned.replace(/ +/g, " ");

    // Clean up parentheses & quote spacing
    cleaned = cleaned.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
    cleaned = cleaned.replace(/\[\s+/g, "[").replace(/\s+\]/g, "]");
    cleaned = cleaned.replace(/«\s+/g, "«").replace(/\s+»/g, "»");

    return cleaned.trim();
  });

  // Re-join with double newlines for extremely elegant reading spacing
  return polishedParagraphs.filter(Boolean).join("\n\n");
}

// Parse uploaded file (Word .docx, PDF .pdf, or simple text .txt)
app.post("/api/articles/parse-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "لم يتم العثور على أي ملف" });
    }

    const filename = req.file.originalname || "document";
    const extension = path.extname(filename).toLowerCase();
    const buffer = req.file.buffer;
    let text = "";

    if (extension === ".docx") {
      // Extract raw text from Word document
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (extension === ".pdf") {
      // Extract raw text from PDF document
      const data = await pdf(buffer);
      text = data.text;
    } else if (extension === ".txt") {
      // Extract simple text
      text = buffer.toString("utf8");
    } else {
      return res.status(400).json({ error: "تنسيق الملف غير مدعوم. يرجى رفع ملفات Word (.docx) أو PDF (.pdf) أو ملف نصي (.txt)" });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "محتوى الملف فارغ أو غير مقروء" });
    }

    // Clean and format text to fix alignment and word formatting issues
    const cleanedText = cleanAndFormatAcademicText(text);

    if (!cleanedText || !cleanedText.trim()) {
      return res.status(400).json({ error: "محتوى الملف فارغ أو غير مقروء بعد تصفية المحتويات" });
    }

    // Heuristics for stats
    const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;
    const pageCount = Math.max(1, Math.ceil(wordCount / 300));

    // Try to guess title from the first non-empty line
    const lines = cleanedText.split("\n").map(l => l.trim()).filter(Boolean);
    const suggestedTitle = lines[0] ? lines[0].replace(/[#*_\-]/g, "").substring(0, 80) : filename.replace(/\.[^/.]+$/, "");

    res.json({
      title: suggestedTitle,
      content: cleanedText,
      wordCount,
      pageCount
    });
  } catch (error: any) {
    console.error("Error parsing file:", error);
    res.status(500).json({ error: "حدث خطأ أثناء قراءة وتحليل الملف المستورد: " + error.message });
  }
});

// AI Analyze Endpoint (Using Gemini API)
app.post("/api/articles/ai-analyze", async (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "العنوان والمحتوى مطلوبان للتحليل" });
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const pageCount = Math.max(1, Math.ceil(wordCount / 300));
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const gemini = getGeminiClient();

  if (!gemini) {
    // Simulated/Fallback Response when Gemini key is not set
    const fallbackTags = [category || "أكاديمي", "بحث علمي", "توثيق معرفي", "دراسة تحليلية"];
    const fallbackSummary = `دراسة وبحث مفصل تحت عنوان "${title}" يناقش أبعاد الموضوع في إطار تصنيف ${category || "علمي"}، مستكشفاً العلاقات البينية والأطروحات الرئيسية، مستهدفاً إثراء الحصيلة العلمية للقارئ وتعميق فهم نسيج البحث.`;
    const fallbackKeyTakeaways = [
      "تطوير منهجية موضوعية واضحة للبحث والتحقق من الحقائق والبيانات.",
      "توفير قراءة متأنية وشاملة للموضوع وتصنيف المفاهيم الأساسية بشكل علمي.",
      "تقديم مقترحات واضحة للمختصين والباحثين للتوسع في دراسة الأبعاد المرتبطة."
    ];
    
    const mockInsights: AiInsights = {
      summary: fallbackSummary,
      keyTakeaways: fallbackKeyTakeaways,
      tags: fallbackTags,
      readingTimeMinutes: readingTime,
      difficulty: wordCount > 1000 ? "متقدم" : wordCount > 500 ? "متوسط" : "مبتدئ"
    };

    return res.json(mockInsights);
  }

  try {
    const prompt = `أنت مساعد أكاديمي ذكي فائق الذكاء، متخصص في مراجعة وتلخيص الأوراق البحثية والمقالات باللغة العربية.
قم بتحليل المقال التالي بالكامل، واستخرج ما يلي بصيغة JSON مطابقة تماماً للمواصفات التالية:
{
  "summary": "تلخيص احترافي وأكاديمي شامل ومكثف للمقال لا يقل عن 3 جمل بلغة عربية فصحى بليغة",
  "keyTakeaways": ["الخلاصة المستفادة الهامة الأولى", "الخلاصة المستفادة الهامة الثانية", "الخلاصة المستفادة الهامة الثالثة (أضف من 3 إلى 5 خلاصات)"],
  "tags": ["علامة1", "علامة2", "علامة3 (أضف من 3 إلى 5 علامات دلالية مناسبة ومحددة للمقال للبحث عنها)"],
  "readingTimeMinutes": 5, // وقت القراءة المتوقع كعدد صحيح دقيق بناءً على حجم النص وسرعة القراءة المتوسطة 200 كلمة بالدقيقة
  "difficulty": "مبتدئ" // أو "متوسط" أو "متقدم" بناءً على عمق ولغة المقال ومصطلحاته
}

عنوان المقال: "${title}"
تصنيف المقال: "${category}"
محتوى المقال المراد تحليله:
${content.substring(0, 10000)}
`;

    const response = await gemini.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsedJson = JSON.parse(response.text || "{}");
    
    // Ensure all required fields exist in result
    const insights: AiInsights = {
      summary: parsedJson.summary || `ملخص مقال ${title}`,
      keyTakeaways: parsedJson.keyTakeaways && Array.isArray(parsedJson.keyTakeaways) ? parsedJson.keyTakeaways : ["قراءة تفصيلية للموضوع."],
      tags: parsedJson.tags && Array.isArray(parsedJson.tags) ? parsedJson.tags : [category || "عام"],
      readingTimeMinutes: Number(parsedJson.readingTimeMinutes) || readingTime,
      difficulty: parsedJson.difficulty === "متقدم" || parsedJson.difficulty === "متوسط" || parsedJson.difficulty === "مبتدئ" 
        ? parsedJson.difficulty 
        : (wordCount > 1000 ? "متقدم" : wordCount > 500 ? "متوسط" : "مبتدئ")
    };

    res.json(insights);
  } catch (error: any) {
    console.error("Gemini API error, falling back to simulated insights:", error);
    // Fallback on error
    const fallbackTags = [category || "أكاديمي", "دراسة"];
    res.json({
      summary: `دراسة مفصلة ومقروءة تحت عنوان "${title}" في تصنيف "${category}"، تهدف لطرح حلول وأفكار متقدمة.`,
      keyTakeaways: ["منهجية دقيقة للبحث والملاحظة.", "تحليل الركائز المعرفية والعملية للمحتوى."],
      tags: fallbackTags,
      readingTimeMinutes: readingTime,
      difficulty: wordCount > 800 ? "متوسط" : "مبتدئ"
    });
  }
});

// Create Article Endpoint
app.post("/api/articles/create", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { title, content, category, aiInsights } = req.body;

  if (!token) {
    return res.status(401).json({ error: "غير مصرح، يرجى تسجيل الدخول" });
  }
  if (!title || !content || !category) {
    return res.status(400).json({ error: "العنوان والمحتوى والتصنيف حقول مطلوبة" });
  }

  const db = loadDb();
  const user = db.users.find(u => u.id === token);
  if (!user) {
    return res.status(401).json({ error: "مستخدم غير صالح" });
  }

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const pageCount = Math.max(1, Math.ceil(wordCount / 300));

  const newArticle: Article = {
    id: "art-" + Math.random().toString(36).substr(2, 9),
    title,
    content,
    category,
    authorId: user.id,
    authorName: user.username,
    wordCount,
    pageCount,
    views: 0,
    likes: [],
    bookmarks: [],
    comments: [],
    aiInsights,
    createdAt: new Date().toISOString()
  };

  db.articles.unshift(newArticle);
  saveDb(db);

  res.status(201).json(newArticle);
});

async function startServer() {
  // Setup database on startup
  loadDb();

  // Serve static UI assets or mount Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
