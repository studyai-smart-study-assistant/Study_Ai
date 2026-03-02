
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    q: 'What is AI Notes Generator?',
    a: 'StudyAI\'s Notes Generator uses advanced AI to instantly create well-structured, exam-oriented notes on any topic. Just enter a subject or chapter, and get comprehensive notes ready for revision.',
  },
  {
    q: 'How does StudyAI work?',
    a: 'StudyAI is powered by state-of-the-art AI models. You can ask questions, generate notes, create quizzes, and get homework help — all through a simple chat-like interface. It\'s designed specifically for students.',
  },
  {
    q: 'Is StudyAI free?',
    a: 'Yes! StudyAI offers free access to all core features including AI chat, notes generation, quiz creation, and study planning. No credit card required.',
  },
  {
    q: 'Can StudyAI generate quizzes?',
    a: 'Absolutely. StudyAI\'s Quiz Generator creates interactive quizzes on any topic with multiple question types. You earn XP points and compete on the leaderboard as you practice.',
  },
  {
    q: 'How to use AI Teacher Mode?',
    a: 'Navigate to "AI Teacher" from the sidebar or homepage. Choose your subject and language (Hindi or English), then start a conversation. The AI teacher explains concepts step-by-step, just like a real tutor.',
  },
];

const FAQSection: React.FC = () => {
  return (
    <div className="px-4 py-8">
      <h2 className="text-lg font-semibold text-foreground text-center mb-6">
        StudyAI — Questions & Answers
      </h2>
      <div className="max-w-2xl mx-auto">
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="border border-border rounded-xl px-4 data-[state=open]:bg-secondary/30"
            >
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-4">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default FAQSection;
