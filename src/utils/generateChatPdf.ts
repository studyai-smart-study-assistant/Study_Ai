import jsPDF from 'jspdf';

/**
 * Generates a nicely formatted PDF from a chat/AI message content (markdown text).
 */
export function generateChatPdf(content: string, title?: string): jsPDF {
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
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  const heading = title || 'Study AI Notes';
  const splitTitle = doc.splitTextToSize(heading, contentW);
  doc.text(splitTitle, margin, 10);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(
    new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    margin,
    18
  );
  y = 28;

  // ── Body content ──
  doc.setTextColor(30, 30, 30);
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      y += 3;
      continue;
    }

    addPageIfNeeded(10);

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

  // ── Footer ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'normal');
    doc.text(`Study AI  •  Page ${i} of ${totalPages}`, pageW / 2, pageH - 8, { align: 'center' });
  }

  return doc;
}

/** Download chat content as PDF */
export function downloadChatPdf(content: string, title?: string) {
  const doc = generateChatPdf(content, title);
  doc.save(`${(title || 'Study-AI-Notes').replace(/\s+/g, '-')}.pdf`);
}

/** Share chat content as PDF (with fallback to download) */
export async function shareChatPdf(content: string, title?: string) {
  const doc = generateChatPdf(content, title);
  const blob = doc.output('blob');
  const fileName = `${(title || 'Study-AI-Notes').replace(/\s+/g, '-')}.pdf`;
  const file = new File([blob], fileName, { type: 'application/pdf' });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: title || 'Study AI Notes', files: [file] });
    return true;
  } else if (navigator.share) {
    await navigator.share({ title: title || 'Study AI Notes', text: content.slice(0, 500) });
    return true;
  }
  // fallback: just download
  doc.save(fileName);
  return false;
}
