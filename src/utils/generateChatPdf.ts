import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Creates a temporary styled HTML element from markdown content,
 * renders it via html2canvas, and produces a proper PDF with Unicode support.
 */
async function renderContentToCanvas(content: string, title?: string): Promise<HTMLCanvasElement> {
  // Convert markdown to simple HTML
  const htmlContent = markdownToHtml(content);

  // Create a temporary container
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed; left: -9999px; top: 0;
    width: 794px; /* A4 at 96dpi */
    padding: 40px 48px;
    background: white;
    font-family: 'Noto Sans Devanagari', 'Noto Sans', Arial, sans-serif;
    font-size: 14px;
    line-height: 1.7;
    color: #1a1a1a;
  `;

  // Load Noto Sans Devanagari for Hindi support
  const fontLink = document.createElement('link');
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&family=Noto+Sans:wght@400;600;700&display=swap';
  fontLink.rel = 'stylesheet';
  document.head.appendChild(fontLink);

  // Wait for font to load
  await new Promise(resolve => setTimeout(resolve, 500));

  const heading = title || 'Study AI Notes';
  const dateStr = new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  container.innerHTML = `
    <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 20px 28px; border-radius: 12px 12px 0 0; margin: -40px -48px 24px -48px;">
      <div style="font-size: 20px; font-weight: 700; margin-bottom: 6px; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;">${escapeHtml(heading)}</div>
      <div style="font-size: 12px; opacity: 0.85; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;">Study AI  •  ${dateStr}</div>
    </div>
    <div style="font-family: 'Noto Sans Devanagari', 'Noto Sans', Arial, sans-serif;">
      ${htmlContent}
    </div>
    <div style="text-align: center; color: #999; font-size: 11px; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;">
      Study AI  •  Generated PDF
    </div>
  `;

  document.body.appendChild(container);

  // Small delay to ensure rendering
  await new Promise(resolve => setTimeout(resolve, 300));

  const canvas = await html2canvas(container, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  document.body.removeChild(container);
  document.head.removeChild(fontLink);

  return canvas;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function markdownToHtml(md: string): string {
  const lines = md.split('\n');
  let html = '';
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (inList) { html += '</ul>'; inList = false; }
      html += '<div style="height: 8px;"></div>';
      continue;
    }

    // Headings
    if (trimmed.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = inlineFormat(trimmed.replace(/^###\s*/, ''));
      html += `<h3 style="font-size: 16px; font-weight: 700; color: #1e293b; margin: 16px 0 8px 0; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;">${text}</h3>`;
    } else if (trimmed.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = inlineFormat(trimmed.replace(/^##\s*/, ''));
      html += `<h2 style="font-size: 18px; font-weight: 700; color: #2563eb; margin: 20px 0 8px 0; padding-bottom: 6px; border-bottom: 2px solid #dbeafe; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;">${text}</h2>`;
    } else if (trimmed.startsWith('# ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = inlineFormat(trimmed.replace(/^#\s*/, ''));
      html += `<h1 style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 24px 0 10px 0; padding-bottom: 8px; border-bottom: 3px solid #2563eb; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;">${text}</h1>`;
    }
    // Bullet points
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      if (!inList) { html += '<ul style="margin: 6px 0; padding-left: 0; list-style: none;">'; inList = true; }
      const text = inlineFormat(trimmed.replace(/^[-*•]\s*/, ''));
      html += `<li style="padding: 3px 0 3px 20px; position: relative; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;"><span style="position: absolute; left: 4px; color: #2563eb; font-weight: bold;">●</span>${text}</li>`;
    }
    // Numbered list
    else if (/^\d+\.\s/.test(trimmed)) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = inlineFormat(trimmed.replace(/^\d+\.\s*/, ''));
      const num = trimmed.match(/^(\d+)\./)?.[1] || '1';
      html += `<div style="padding: 3px 0 3px 24px; position: relative; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;"><span style="position: absolute; left: 0; color: #2563eb; font-weight: 700;">${num}.</span>${text}</div>`;
    }
    // Blockquote
    else if (trimmed.startsWith('> ')) {
      if (inList) { html += '</ul>'; inList = false; }
      const text = inlineFormat(trimmed.replace(/^>\s*/, ''));
      html += `<div style="border-left: 3px solid #2563eb; background: #f8fafc; padding: 10px 14px; margin: 8px 0; border-radius: 0 6px 6px 0; font-style: italic; color: #475569; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;">${text}</div>`;
    }
    // Regular paragraph
    else {
      if (inList) { html += '</ul>'; inList = false; }
      const text = inlineFormat(trimmed);
      html += `<p style="margin: 4px 0; color: #334155; font-family: 'Noto Sans Devanagari', 'Noto Sans', sans-serif;">${text}</p>`;
    }
  }

  if (inList) html += '</ul>';
  return html;
}

function inlineFormat(text: string): string {
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 700; color: #0f172a;">$1</strong>');
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code
  text = text.replace(/`(.*?)`/g, '<code style="background: #f1f5f9; padding: 1px 5px; border-radius: 3px; font-size: 13px;">$1</code>');
  return text;
}

/** Generate a PDF document from chat content */
export async function generateChatPdfAsync(content: string, title?: string): Promise<jsPDF> {
  const canvas = await renderContentToCanvas(content, title);

  const imgWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  return pdf;
}

/** Download chat content as PDF */
export async function downloadChatPdf(content: string, title?: string) {
  const { safeDownload } = await import('./webviewDownload');
  const doc = await generateChatPdfAsync(content, title);
  const blob = doc.output('blob');
  const fileName = `${(title || 'Study-AI-Notes').replace(/\s+/g, '-')}.pdf`;
  await safeDownload({ blob, filename: fileName, mimeType: 'application/pdf' });
}

/** Share chat content as PDF (with fallback to download) */
export async function shareChatPdf(content: string, title?: string) {
  const { safeDownload } = await import('./webviewDownload');
  const doc = await generateChatPdfAsync(content, title);
  const blob = doc.output('blob');
  const fileName = `${(title || 'Study-AI-Notes').replace(/\s+/g, '-')}.pdf`;

  try {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title: title || 'Study AI Notes', files: [file] });
      return true;
    }
  } catch { /* fallback */ }

  await safeDownload({ blob, filename: fileName, mimeType: 'application/pdf' });
  return false;
}
