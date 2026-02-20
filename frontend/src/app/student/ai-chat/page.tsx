import { redirect } from 'next/navigation';

// Permanently redirected to the new AI Tutor page.
// All URL params (?topicId=...) are preserved by the redirect.
export default function AIChatRedirectPage() {
  redirect('/student/ai-tutor');
}

