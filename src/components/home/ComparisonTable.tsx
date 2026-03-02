
import React from 'react';

const rows = [
  { feature: 'Bihar Board / SSC CGL Focus', studyAI: true, others: false },
  { feature: 'Auto Notes Generator', studyAI: true, others: false },
  { feature: 'Interactive Quizzes with XP', studyAI: true, others: false },
  { feature: 'AI Teacher Mode (Hindi + English)', studyAI: true, others: 'Limited' },
  { feature: 'Free for Students', studyAI: true, others: 'Paid' },
  { feature: 'Leaderboard & Gamification', studyAI: true, others: false },
];

const ComparisonTable: React.FC = () => {
  return (
    <div className="px-4 py-8">
      <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
        Why StudyAI is Better for Indian Students
      </h2>
      <div className="max-w-2xl mx-auto overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Feature</th>
              <th className="text-center p-3 font-medium text-primary">Study AI</th>
              <th className="text-center p-3 font-medium text-muted-foreground">ChatGPT / Gemini</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.feature}>
                <td className="p-3 text-foreground">{row.feature}</td>
                <td className="p-3 text-center text-green-500 font-bold">{row.studyAI === true ? '✓' : row.studyAI}</td>
                <td className="p-3 text-center text-destructive font-medium">
                  {row.others === true ? '✓' : row.others === false ? '✗' : row.others}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-3">
        भारत का अपना AI — Made for Bihar Board, 12th Arts & SSC CGL students 🇮🇳
      </p>
    </div>
  );
};

export default ComparisonTable;
