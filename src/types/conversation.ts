export interface GrammarEntry {
  input: string;
  response: string;
  timestamp?: Date;
  grammarType?: 
    | 'verb'
    | 'noun'
    | 'adjective'
    | 'adverb'
    | 'pronoun'
    | 'preposition'
    | 'conjunction'
    | 'interjection'
    | 'sentence structure'
    | 'tense'
    | 'clause'
    | 'phrase'
    | 'article'
    | 'modal'
    | 'punctuation'
    | 'other';
  mistakes?: string[];
}

export interface LessonEntry {
  input: string;
  response: string;
  topic?: string;
  timestamp?: Date;
  lessonType?: 
    | 'grammar'
    | 'vocabulary'
    | 'idioms'
    | 'phrases'
    | 'conversation'
    | 'listening'
    | 'reading'
    | 'writing'
    | 'speaking'
    | 'pronunciation'
    | 'culture'
    | 'exam preparation'
    | 'other';
}

export interface ConversationEntry {
  userId: number;
  grammar: GrammarEntry[];
  lesson: LessonEntry[];
  userLevel: 'beginner' | 'intermediate' | 'advanced';
  lastActive: Date;
}
