import jsPDF from 'jspdf';

/**
 * Converts markdown-style note content into a well-formatted PDF.
 * Returns the jsPDF instance so callers can .save() or .output('blob').
 */
export function generateNotesPdf(note: {
  title: string;
  subject: string;
  noteType: string;
  content: string;
  keyPoints: string[];
  timestamp: string;
}): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentW = pageW - margin * 2;
  let y = margin;

  const addPageIfNeeded = (extra = 12) => {
    if (y + extra > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Header bar ──
  doc.setFillColor(37, 99, 235); // blue-600
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(note.title, margin, 14, { maxWidth: contentW });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const dateLine = `${note.subject}  •  ${note.noteType}  •  ${new Date(note.timestamp).toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  doc.text(dateLine, margin, 22, { maxWidth: contentW });
  y = 36;

  // ── Key Points box ──
  if (note.keyPoints.length > 0) {
    doc.setDrawColor(37, 99, 235);
    doc.setFillColor(239, 246, 255); // blue-50
    const kpLines: string[] = [];
    note.keyPoints.forEach((p) => {
      kpLines.push(`•  ${p}`);
    });
    const kpText = kpLines.join('\n');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitKp = doc.splitTextToSize(kpText, contentW - 10);
    const boxH = splitKp.length * 5 + 14;
    addPageIfNeeded(boxH);
    doc.roundedRect(margin, y, contentW, boxH, 2, 2, 'FD');
    doc.setTextColor(30, 64, 175);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('🎯 मुख्य परिचय:', margin + 5, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(splitKp, margin + 5, y + 14);
    y += boxH + 6;
  }

  // ── Body content ──
  doc.setTextColor(30, 30, 30);
  const lines = note.content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 3;
      continue;
    }

    addPageIfNeeded(10);

    // Heading detection
    if (trimmed.startsWith('### ')) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      const split = doc.splitTextToSize(trimmed.replace(/^###\s*/, ''), contentW);
      doc.text(split, margin, y);
      y += split.length * 5.5 + 3;
    } else if (trimmed.startsWith('## ')) {
      y += 2;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(37, 99, 235);
      const split = doc.splitTextToSize(trimmed.replace(/^##\s*/, ''), contentW);
      doc.text(split, margin, y);
      y += split.length * 6 + 2;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y, pageW - margin, y);
      y += 3;
    } else if (trimmed.startsWith('# ')) {
      y += 3;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(20, 20, 20);
      const split = doc.splitTextToSize(trimmed.replace(/^#\s*/, ''), contentW);
      doc.text(split, margin, y);
      y += split.length * 7 + 3;
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.6);
      doc.line(margin, y, pageW - margin, y);
      doc.setLineWidth(0.2);
      y += 4;
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const bullet = trimmed.replace(/^[-*•]\s*/, '');
      // bold handling for **text**
      const clean = bullet.replace(/\*\*(.*?)\*\*/g, '$1');
      const split = doc.splitTextToSize(`●  ${clean}`, contentW - 6);
      addPageIfNeeded(split.length * 4.5 + 2);
      doc.text(split, margin + 4, y);
      y += split.length * 4.5 + 1.5;
    } else if (trimmed.startsWith('> ')) {
      doc.setFillColor(245, 245, 245);
      const quoteText = trimmed.replace(/^>\s*/, '');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9.5);
      const split = doc.splitTextToSize(quoteText, contentW - 14);
      const bh = split.length * 4.5 + 6;
      addPageIfNeeded(bh);
      doc.roundedRect(margin, y - 2, contentW, bh, 1, 1, 'F');
      doc.setFillColor(37, 99, 235);
      doc.rect(margin, y - 2, 1.5, bh, 'F');
      doc.setTextColor(80, 80, 80);
      doc.text(split, margin + 6, y + 3);
      y += bh + 2;
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      const clean = trimmed.replace(/\*\*(.*?)\*\*/g, '$1');
      const split = doc.splitTextToSize(clean, contentW);
      addPageIfNeeded(split.length * 4.5 + 2);
      doc.text(split, margin, y);
      y += split.length * 4.5 + 2;
    }
  }

  // ── Footer on each page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`StudyAI Notes  •  Page ${i} of ${totalPages}`, pageW / 2, pageH - 8, { align: 'center' });
  }

  return doc;
}
