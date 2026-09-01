import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { Camera, Upload, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';

interface DocumentArchiverProps {
  attachments: string[];
  onAddAttachment: (url: string) => void;
  onRemoveAttachment?: (url: string) => void;
  disabled?: boolean;
}

export const DocumentArchiver: React.FC<DocumentArchiverProps> = ({
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional: add a size limit (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف يجب أن لا يتجاوز 5 ميغابايت');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const storageRef = ref(storage, `archives/${fileName}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(Math.round(progress));
      },
      (error) => {
        console.error('Upload failed:', error);
        alert('حدث خطأ أثناء رفع المستند. يرجى المحاولة مرة أخرى.');
        setIsUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onAddAttachment(downloadURL);
        setIsUploading(false);
        setUploadProgress(0);
      }
    );
  };

  return (
    <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-500" />
          أرشفة المستندات (المرفقات)
        </h3>
        
        {!disabled && (
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            {/* The 'capture' attribute prompts mobile devices to open the camera */}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              ref={cameraInputRef}
              onChange={handleFileUpload}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition shadow-sm"
              disabled={isUploading}
            >
              <Upload className="w-3.5 h-3.5" />
              رفع ملف
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition shadow-sm"
              disabled={isUploading}
            >
              <Camera className="w-3.5 h-3.5" />
              تصوير مستند
            </button>
          </div>
        )}
      </div>

      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
          <div className="flex items-center justify-between mb-2 text-xs font-bold text-blue-800">
            <span className="flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              جاري الرفع...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {attachments.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-3">
          {attachments.map((url, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white aspect-square flex items-center justify-center">
              {url.includes('.pdf') || url.includes('alt=media') === false ? (
                 <a href={url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center text-slate-500 hover:text-blue-600 transition p-2">
                   <FileText className="w-8 h-8 mb-2" />
                   <span className="text-[10px] font-mono break-all text-center">مستند {idx + 1}</span>
                 </a>
              ) : (
                <a href={url} target="_blank" rel="noopener noreferrer" className="block w-full h-full cursor-pointer">
                  <img src={url} alt={`مرفق ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
                </a>
              )}
              
              {!disabled && onRemoveAttachment && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onRemoveAttachment(url);
                  }}
                  className="absolute top-1 right-1 p-1 bg-white/90 text-rose-600 rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-rose-50"
                  title="حذف المرفق"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl">
          <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">لا توجد مرفقات مرتبطة بهذا المستند.</p>
        </div>
      )}
    </div>
  );
};
