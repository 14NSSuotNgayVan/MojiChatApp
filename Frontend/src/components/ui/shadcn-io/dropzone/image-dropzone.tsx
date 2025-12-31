import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "@/components/ui/shadcn-io/dropzone";
import { useState } from "react";
import { cn } from "../../../../lib/utils.ts";
interface ImageDropzoneProps {
  onChangeFile: (file: File) => void;
  preview: "normal" | "avatar";
  defaultImageUrl?: string;
}

const ImageDropzone = ({
  onChangeFile,
  preview = "normal",
  defaultImageUrl,
}: ImageDropzoneProps) => {
  const [files, setFiles] = useState<File[] | undefined>();
  const [filePreview, setFilePreview] = useState<string | undefined>(
    defaultImageUrl
  );

  const handleDrop = (files: File[]) => {
    setFiles(files);
    onChangeFile(files?.[0]);
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") {
          setFilePreview(e.target?.result);
        }
      };
      reader.readAsDataURL(files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {filePreview && (
        <div
          className={cn(
            "w-full aspect-video",
            preview === "avatar" && "w-20 h-20"
          )}
        >
          <img
            alt="Preview"
            className="h-full w-full object-cover"
            src={filePreview}
          />
        </div>
      )}
      <Dropzone
        accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
        onDrop={handleDrop}
        onError={console.error}
        src={files}
      >
        <DropzoneEmptyState />
        <DropzoneContent></DropzoneContent>
      </Dropzone>
    </div>
  );
};
export default ImageDropzone;
