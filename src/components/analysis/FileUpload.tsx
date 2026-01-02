import { useState, useCallback } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string[];
  maxSize?: number; // in MB
}

export function FileUpload({ 
  onFileSelect, 
  acceptedFormats = [".csv", ".json", ".xlsx"],
  maxSize = 10 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedFormats.includes(extension)) {
      return `Formato não suportado. Use: ${acceptedFormats.join(", ")}`;
    }
    if (file.size > maxSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxSize}MB`;
    }
    return null;
  };

  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setFile(null);
    } else {
      setError(null);
      setFile(file);
      onFileSelect(file);
    }
  }, [acceptedFormats, maxSize, onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  }, [handleFile]);

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "glass-card aurora-border relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl p-8 text-center transition-all duration-300",
          isDragging && "border-primary bg-primary/10 shadow-[0_0_30px_hsl(var(--aurora-cyan)/0.3)]",
          error && "border-destructive/50"
        )}
      >
        <input
          type="file"
          accept={acceptedFormats.join(",")}
          onChange={handleInputChange}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
        
        <div className={cn(
          "mb-4 rounded-xl p-4 transition-all duration-300",
          isDragging 
            ? "bg-primary/20 text-primary" 
            : "bg-muted text-muted-foreground"
        )}>
          <Upload className="h-8 w-8" />
        </div>

        <h4 className="mb-2 font-display text-lg font-semibold text-foreground">
          Arraste e solte seus arquivos aqui
        </h4>
        <p className="text-sm text-muted-foreground">
          ou <span className="text-primary">clique para selecionar</span>
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Formatos aceitos: {acceptedFormats.join(", ")} (máx. {maxSize}MB)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Selected File */}
      {file && !error && (
        <div className="glass-card flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/20 p-2 text-primary">
              <File className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-aurora-green" />
            <Button variant="ghost" size="icon" onClick={removeFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
