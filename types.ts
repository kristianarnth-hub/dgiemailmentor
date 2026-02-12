
export interface EmailInput {
  targetGroup: string;
  purpose: string;
  isReadyForAction: boolean;
  value: string;
  draft: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface EmailMentorResponse {
  strategicAdvice: {
    permissionCheck: string;
    segmentationSuggestions: string[];
  };
  feedback: {
    good: string[];
    improvements: string[];
    checklist: string[];
  };
  optimizedDraft: {
    subjectLines: string[];
    preheader: string;
    content: string;
  };
}
