import React, { useState, useCallback } from 'react';
import { Upload, CheckCircle } from 'lucide-react';

interface ResumeDropzoneProps {
  onFileDrop: (file: File) => void;
  fileNameToDisplay?: string | null;
}

const ResumeDropzone: React.FC<ResumeDropzoneProps> = ({ onFileDrop, fileNameToDisplay }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [internalFileName, setInternalFileName] = useState<string | null>(null);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const file = files[0];
      setInternalFileName(file.name);
      onFileDrop(file);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
    handleFileChange(e.dataTransfer.files);
  }, [onFileDrop]);

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovered(false);
  };

  const displayedFileName = fileNameToDisplay || internalFileName;

  return (
    <label
      htmlFor="resume-upload"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer block
        ${isHovered ? 'bg-purple-50 border-brand' : 'bg-gray-50 border-gray-300'}
      `}
    >
      <input 
        id="resume-upload" 
        type="file" 
        className="hidden" 
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => handleFileChange(e.target.files)}
      />
      <div className="flex flex-col items-center justify-center space-y-2 text-gray-600">
        {!displayedFileName ? (
            <>
                <Upload className="w-8 h-8 opacity-60" />
                <p className="text-sm">
                  <span className="font-semibold text-gray-800">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, TXT (Max 5MB)</p>
            </>
        ) : (
            <>
                <CheckCircle className="w-8 h-8 text-green-500" />
                <p className="text-sm mt-2 text-green-600 font-medium">{displayedFileName}</p>
                <p className="text-xs text-gray-500">File selected successfully!</p>
            </>
        )}
      </div>
    </label>
  );
};

export default ResumeDropzone;