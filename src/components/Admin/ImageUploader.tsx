"use client";

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, Link, Image } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  preview: string;
  onPreviewChange: (preview: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
  previewClassName?: string;
}

const MAX_IMAGE_SIZE = 800;
const IMAGE_QUALITY = 0.7;

export function ImageUploader({
  value,
  onChange,
  preview,
  onPreviewChange,
  label,
  placeholder = "https://exemplo.com/imagem.jpg",
  className = "",
  previewClassName = "w-32 h-32 object-cover rounded-lg border"
}: ImageUploaderProps) {
  const [useUrl, setUseUrl] = useState(!value?.startsWith('data:image'));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxSize: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new window.Image(); // Corrigido para usar window.Image
        if (!event.target?.result) {
          reject(new Error("Falha ao ler o arquivo"));
          return;
        }
        img.src = event.target.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = Math.round(height * maxSize / width);
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = Math.round(width * maxSize / height);
              height = maxSize;
            }
          }
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error("Não foi possível obter contexto 2D do canvas"));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          const compressedImage = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedImage);
        };
        img.onerror = () => {
          reject(new Error("Erro ao carregar a imagem"));
        };
      };
      reader.onerror = () => {
        reject(new Error("Erro ao ler o arquivo"));
      };
    });
  };

  const handleImageUpload = async (file: File) => {
    if (file && file.type.startsWith('image/')) {
      try {
        const compressedImage = await compressImage(file, MAX_IMAGE_SIZE, IMAGE_QUALITY);
        onPreviewChange(compressedImage);
        onChange(compressedImage);
        toast.success('Imagem carregada e otimizada com sucesso!');
      } catch (error) {
        console.error('Erro ao processar imagem:', error);
        toast.error('Erro ao processar a imagem. Tente uma imagem menor.');
      }
    } else {
      toast.error('Por favor, selecione um arquivo de imagem válido');
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between">
        <label className="text-sm font-medium">{label}</label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setUseUrl(!useUrl)}
          className="h-6 px-2 text-xs"
        >
          {useUrl ? (
            <>
              <Image className="w-3 h-3 mr-1" />
              Usar upload
            </>
          ) : (
            <>
              <Link className="w-3 h-3 mr-1" />
              Usar URL
            </>
          )}
        </Button>
      </div>

      {useUrl ? (
        <Input 
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            onPreviewChange(e.target.value);
          }}
          placeholder={placeholder}
        />
      ) : (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="w-4 h-4 mr-2" />
            Selecionar Imagem
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
            }}
            className="hidden"
          />
        </div>
      )}
      
      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Preview"
            className={previewClassName}
          />
        </div>
      )}
    </div>
  );
}