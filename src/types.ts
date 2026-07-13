export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  articleId: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface AiInsights {
  summary: string;
  keyTakeaways: string[];
  tags: string[];
  readingTimeMinutes: number;
  difficulty: 'مبتدئ' | 'متوسط' | 'متقدم'; // Arabic difficulty levels
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string; // e.g. "علمي", "تقني", "أدبي", "فلسفي", "تاريخي", "طبي"
  authorId: string;
  authorName: string;
  wordCount: number;
  pageCount: number;
  views: number;
  likes: string[]; // List of user IDs who liked
  bookmarks: string[]; // List of user IDs who bookmarked
  comments: Comment[];
  aiInsights?: AiInsights;
  createdAt: string;
}

export type CategoryType = 'الكل' | 'علمي' | 'تقني' | 'أدبي' | 'فلسفي' | 'تاريخي' | 'طبي';

export const CATEGORIES: { value: string; label: string; icon: string; description: string }[] = [
  { value: 'علمي', label: 'بحوث علمية', icon: 'Atom', description: 'الفيزياء، الكيمياء، علوم الفضاء والطبيعة' },
  { value: 'تقني', label: 'تكنولوجيا وبرمجة', icon: 'Cpu', description: 'الذكاء الاصطناعي، علوم الحاسوب والابتكارات الرقمية' },
  { value: 'أدبي', label: 'مقالات أدبية', icon: 'BookOpen', description: 'الشعر، الرواية، النقد والأدب العالمي والحديث' },
  { value: 'فلسفي', label: 'دراسات فلسفية', icon: 'Compass', description: 'المدارس الفلسفية، التحليل الفكري والتأمل الإنساني' },
  { value: 'تاريخي', label: 'أبحاث تاريخية', icon: 'Hourglass', description: 'الحضارات القديمة، تاريخ الشرق الأوسط، والتوثيق الأثري' },
  { value: 'طبي', label: 'مقالات طبية وصحية', icon: 'HeartPulse', description: 'الصحة العامة، أحدث الدراسات الطبية، وعلم الأدوية' }
];
