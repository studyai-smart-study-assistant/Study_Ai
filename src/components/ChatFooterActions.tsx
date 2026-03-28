
import React, { useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Plus, Upload, Camera, SlidersHorizontal, Globe, Sparkles, ImageIcon, Telescope, Newspaper, Radio } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import ImageGallery from '@/components/ImageGallery';
import LiveTalkingMode from '@/components/chat/LiveTalkingMode';

export interface UploadedFile { /* ... (interface as before) ... */ }
// ... (helper functions as before) ...

interface ChatFooterActionsProps {
    webSearchEnabled?: boolean;
    onWebSearchToggle?: (enabled: boolean) => void;
    isImageMode: boolean;
    setIsImageMode: (value: boolean) => void;
    isDeepThinkingMode: boolean;
    setIsDeepThinkingMode: (value: boolean) => void;
    isNewsMode: boolean;
    setIsNewsMode: (value: boolean) => void;
    setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
    textareaRef: React.RefObject<HTMLTextAreaElement>;
    isLoading?: boolean;
    isDisabled?: boolean;
}

const ChatFooterActions: React.FC<ChatFooterActionsProps> = (props) => {
    const [isAttachOpen, setIsAttachOpen] = useState(false);
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Toggles a specific mode and disables others
    const toggleMode = (mode: 'web' | 'image' | 'deep' | 'news') => {
        props.onWebSearchToggle?.(mode === 'web' ? !props.webSearchEnabled : false);
        props.setIsImageMode(mode === 'image' ? !props.isImageMode : false);
        props.setIsDeepThinkingMode(mode === 'deep' ? !props.isDeepThinkingMode : false);
        props.setIsNewsMode(mode === 'news' ? !props.isNewsMode : false);
        setIsToolsOpen(false);
        props.textareaRef.current?.focus();
    };

    // ... (handleFileSelect function as before) ...

    return (
        <>
            {/* ... (input refs as before) ... */}

            <div className="flex items-center gap-1">
                {/* ... (Attachment Popover as before) ... */}

                <Popover open={isToolsOpen} onOpenChange={setIsToolsOpen}>
                     <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" disabled={props.isLoading || props.isDisabled}>
                            <SlidersHorizontal className="h-[18px] w-[18px]" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-60 p-1.5">
                         <button onClick={() => toggleMode('web')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.webSearchEnabled ? 'bg-emerald-100' : 'bg-muted'}`}><Globe className={`h-4 w-4 ${props.webSearchEnabled ? 'text-emerald-600' : 'text-muted-foreground'}`} /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Web Search</p>
                                <p className="text-xs text-muted-foreground">{props.webSearchEnabled ? 'ON' : 'Real-time web search'}</p>
                            </div>
                        </button>
                        <button onClick={() => toggleMode('image')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.isImageMode ? 'bg-primary/10' : 'bg-muted'}`}><Sparkles className={`h-4 w-4 ${props.isImageMode ? 'text-primary' : 'text-muted-foreground'}`} /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Image Create</p>
                                <p className="text-xs text-muted-foreground">{props.isImageMode ? 'ON' : 'Generate image with AI'}</p>
                            </div>
                        </button>
                        <button onClick={() => { setIsGalleryOpen(true); setIsToolsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                             <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-muted"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>
                             <div>
                                 <p className="text-sm font-semibold text-foreground">Image Gallery</p>
                                 <p className="text-xs text-muted-foreground">View generated images</p>
                             </div>
                        </button>
                         <button onClick={() => toggleMode('deep')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                             <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.isDeepThinkingMode ? 'bg-amber-100' : 'bg-muted'}`}><Telescope className={`h-4 w-4 ${props.isDeepThinkingMode ? 'text-amber-600' : 'text-muted-foreground'}`} /></div>
                             <div>
                                 <p className="text-sm font-semibold text-foreground">Deep Thinking</p>
                                 <p className="text-xs text-muted-foreground">{props.isDeepThinkingMode ? 'ON' : 'In-depth topic analysis'}</p>
                             </div>
                        </button>
                        <button onClick={() => toggleMode('news')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${props.isNewsMode ? 'bg-blue-100' : 'bg-muted'}`}><Newspaper className={`h-4 w-4 ${props.isNewsMode ? 'text-blue-600' : 'text-muted-foreground'}`} /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">News</p>
                                <p className="text-xs text-muted-foreground">{props.isNewsMode ? 'ON' : 'Search latest news'}</p>
                            </div>
                        </button>
                        <button onClick={() => { setIsLiveMode(true); setIsToolsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted">
                            <div className="h-7 w-7 rounded-lg flex items-center justify-center bg-destructive/10"><Radio className="h-4 w-4 text-destructive" /></div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Live Talking</p>
                                <p className="text-xs text-muted-foreground">Experience Gemini Live</p>
                            </div>
                        </button>
                    </PopoverContent>
                </Popover>
            </div>

            <ImageGallery open={isGalleryOpen} onClose={() => setIsGalleryOpen(false)} />
            <LiveTalkingMode open={isLiveMode} onClose={() => setIsLiveMode(false)} />
        </>
    );
};

export default ChatFooterActions;
