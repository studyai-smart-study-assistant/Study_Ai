import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, X, ArrowLeft, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAllImages, deleteImageFromGallery, downloadImage, GalleryImage } from '@/lib/imageGalleryDB';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import ImageModal from '@/components/ui/image-modal';

interface ImageGalleryProps {
  open: boolean;
  onClose: () => void;
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ open, onClose }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const { language } = useLanguage();

  useEffect(() => {
    if (open) loadImages();
  }, [open]);

  const loadImages = async () => {
    try {
      const imgs = await getAllImages();
      setImages(imgs);
    } catch (e) {
      console.error('Failed to load gallery:', e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteImageFromGallery(id);
      setImages(prev => prev.filter(img => img.id !== id));
      toast.success(language === 'hi' ? 'Image हटा दी गई' : 'Image deleted');
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleDownload = (img: GalleryImage, e: React.MouseEvent) => {
    e.stopPropagation();
    const filename = `ai-image-${new Date(img.createdAt).toISOString().slice(0, 10)}.png`;
    downloadImage(img.imageData, filename);
  };

  if (!open) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold">
          {language === 'hi' ? 'Image Gallery' : 'Image Gallery'}
        </h2>
        <span className="text-sm text-muted-foreground ml-auto">
          {images.length} {language === 'hi' ? 'images' : 'images'}
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
            <ImageIcon className="h-16 w-16 opacity-30" />
            <p className="text-sm">{language === 'hi' ? 'अभी कोई image नहीं है' : 'No images yet'}</p>
            <p className="text-xs">{language === 'hi' ? 'Image Create mode से image बनाएं' : 'Generate images using Image Create mode'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map(img => (
              <motion.div
                key={img.id}
                layout
                className="relative group rounded-xl overflow-hidden border border-border bg-card aspect-square cursor-pointer"
                onClick={() => setSelectedImage(img)}
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src={img.imageData}
                  alt={img.prompt}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-end">
                  <div className="w-full p-2 opacity-0 group-hover:opacity-100 transition-opacity flex justify-between items-end">
                    <p className="text-white text-xs line-clamp-2 flex-1 mr-2">{img.prompt}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => handleDownload(img, e)}
                        className="p-1.5 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/40 transition-colors"
                      >
                        <Download className="h-3.5 w-3.5 text-white" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(img.id, e)}
                        className="p-1.5 bg-red-500/60 backdrop-blur-sm rounded-full hover:bg-red-500/80 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Full image modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          imageUrl={selectedImage.imageData}
          alt={selectedImage.prompt}
        />
      )}
    </motion.div>
  );
};

export default ImageGallery;
