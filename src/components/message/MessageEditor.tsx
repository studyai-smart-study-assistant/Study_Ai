
import React, { useRef } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Code, List, Heading, Check, X } from "lucide-react";

interface MessageEditorProps {
  editedContent: string;
  setEditedContent: (content: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
}

const MessageEditor: React.FC<MessageEditorProps> = ({
  editedContent,
  setEditedContent,
  handleSaveEdit,
  handleCancelEdit
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertMarkdown = (pattern: string) => {
    if (!textareaRef.current) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = editedContent.substring(start, end);
    const beforeText = editedContent.substring(0, start);
    const afterText = editedContent.substring(end);
    
    let newText;
    switch (pattern) {
      case 'bold':
        newText = beforeText + `**${selectedText || 'bold text'}**` + afterText;
        break;
      case 'italic':
        newText = beforeText + `*${selectedText || 'italic text'}*` + afterText;
        break;
      case 'code':
        newText = beforeText + `\`\`\`\n${selectedText || 'code block'}\n\`\`\`` + afterText;
        break;
      case 'list':
        newText = beforeText + `\n- ${selectedText || 'list item'}\n- another item\n` + afterText;
        break;
      case 'heading':
        newText = beforeText + `\n## ${selectedText || 'Heading'}\n` + afterText;
        break;
      default:
        newText = editedContent;
    }
    
    setEditedContent(newText);
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="flex gap-1 mb-2">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => insertMarkdown('bold')}
          className="h-7 px-2 text-xs"
        >
          <Bold size={14} />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => insertMarkdown('italic')}
          className="h-7 px-2 text-xs"
        >
          <Italic size={14} />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => insertMarkdown('code')}
          className="h-7 px-2 text-xs"
        >
          <Code size={14} />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => insertMarkdown('list')}
          className="h-7 px-2 text-xs"
        >
          <List size={14} />
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => insertMarkdown('heading')}
          className="h-7 px-2 text-xs"
        >
          <Heading size={14} />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        className="w-full min-h-[120px] mb-2 resize-none border-gray-300 dark:border-gray-600 rounded-xl"
      />
      <div className="flex gap-2 justify-end">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleCancelEdit}
          className="flex items-center gap-1 text-sm"
        >
          <X size={14} /> Cancel
        </Button>
        <Button 
          size="sm" 
          onClick={handleSaveEdit}
          className="flex items-center gap-1 text-sm bg-purple-600 hover:bg-purple-700"
        >
          <Check size={14} /> Save
        </Button>
      </div>
    </div>
  );
};

export default MessageEditor;
