import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../ui/field.tsx";
import { Input } from "../ui/input.tsx";
import { Textarea } from "../ui/textarea.tsx";
import { useAuthStore } from "../../stores/useAuthStore.ts";
import { DialogFooter } from "../ui/dialog.tsx";
import { Button } from "../ui/button.tsx";
import { ChevronLeft } from "lucide-react";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "../ui/shadcn-io/dropzone/index.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { Avatar } from "../avatars/avatar.tsx";
import { fileService } from "../../services/fileService.ts";
import Loading from "../ui/loading.tsx";
import { userService } from "../../services/userService.ts";
import { toast } from "sonner";

const schema = z.object({
  displayName: z.string().min(1, "Tên hiển thị là bắt buộc"),
  bio: z.string(),
  email: z.email("Email không đúng định dạng").min(1, "Email là bắt buộc"),
  phone: z.string().regex(
    /^(0|\+84)(3|5|7|8|9)\d{8}$/,
    "Số điện thoại không đúng định dạng"
  ),
});

type profileSchema = z.infer<typeof schema>;

export const EditProfileForm = ({ handleBack }: { handleBack: () => void }) => {
  const { user } = useAuthStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<profileSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...user,
    },
  });

  const handleSubmitForm = async (data: profileSchema) => {
    try {
      await userService.updateProfile({
        bio: data?.bio,
        displayName: data?.displayName,
        email: data?.email,
        phone: data?.phone
      })
      toast.success('Cập nhật thành công!')
      handleBack()
    } catch (error) {
      console.error("Lỗi khi gọi EditAvatarForm - handleSubmit:", error);
    }
  };

  return (
    <div className="relative h-full">
      <form className="overflow-y-scroll mb-12">
        <FieldGroup className="gap-4">
          <Field>
            <Field>
              <FieldLabel htmlFor="displayName">Tên hiển thị</FieldLabel>
              <Input
                id="displayName"
                {...register("displayName")}
                type="string"
                placeholder="User 123"
              />

              {errors?.displayName && (
                <FieldDescription>
                  {errors?.displayName?.message}
                </FieldDescription>
              )}
            </Field>
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              {...register("email")}
              type="email"
              placeholder="m@example.com"
            />

            {errors?.email && (
              <FieldDescription>{errors?.email?.message}</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
            <Input
              id="phone"
              {...register("phone")}
              type="phone"
              placeholder="0987654321"
            />

            {errors?.phone && (
              <FieldDescription>{errors?.phone?.message}</FieldDescription>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="phone">Tiểu sử</FieldLabel>
            <Textarea id="bio" {...register("bio")} placeholder="0987654321" />

            {errors?.bio && (
              <FieldDescription>{errors?.bio?.message}</FieldDescription>
            )}
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="primary" onClick={handleBack}>
          <ChevronLeft />
          Trở lại
        </Button>
        <Button variant="primary" onClick={handleSubmit(handleSubmitForm)}>
          Lưu
        </Button>
      </DialogFooter>
    </div>
  );
};

export const EditAvatarForm = ({ handleBack, updateType }: { handleBack: () => void, updateType: 'avatar' | 'background' }) => {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<File[] | undefined>();
  const [filePreview, setFilePreview] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false)
  const isUpdateAvatar = updateType === 'avatar';
  const filePreviewRef = useRef<string | undefined>(filePreview);

  const handleDrop = async (files: File[]) => {
    try {
      setLoading(true)
      setFiles(files);
      if (files.length > 0) {
        const res = await (isUpdateAvatar ? fileService.uploadAvatar : fileService.uploadBackground)(files[0])
        setFilePreview(res.url);
        filePreviewRef.current = res.url;
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      await userService.updateProfile(isUpdateAvatar ? {
        avtUrl: filePreview
      } : {
        bgUrl: filePreview
      })
      handleBack();
      toast.success('Cập nhật thành công!');
    } catch (error) {
      console.error("Lỗi khi gọi EditAvatarForm - handleSubmit:", error);
    }
  }, [filePreview, isUpdateAvatar, handleBack]);

  const handleDeleteCurrentFile = async () => {
    try {
      if (filePreviewRef.current) {
        await fileService.deleteFile(filePreviewRef.current);
      }
    } catch (error) {
      console.error("Lỗi khi gọi deleteFile:", error);
    }
  }

  const onBack = async () => {
    handleBack()
    handleDeleteCurrentFile()
  }

  useEffect(() => {
    return () => {
      handleDeleteCurrentFile()
    }
  }, [])

  return (
    <div className="flex flex-col items-center w-full gap-6">
      {user && isUpdateAvatar && <Avatar
        name={user.displayName!}
        avatarUrl={filePreview || user.avtUrl}
        className="w-32 h-32 relative bg-"
        layer={
          loading &&
          <div className="absolute inset-0 flex items-center justify-center bg-gray-500/70">
            <Loading />
          </div>
        }
      />}
      {user && !isUpdateAvatar &&
        <div
          className={
            "relative w-full aspect-video overflow-hidden bg-gray-200 rounded-lg group"
          }
        >
          {(user.bgUrl || filePreview) && (
            <img
              src={filePreview || user.bgUrl}
              onLoad={() => {
                setLoading(false)
              }}
              alt="Background"
              className="w-full h-full object-cover"
            />
          )}
          {loading &&
            <div className="absolute inset-0 flex items-center justify-center bg-gray-500/70">
              <Loading />
            </div>}
        </div>
      }
      <Dropzone
        accept={{ "image/*": [".png", ".jpg", ".jpeg"] }}
        onDrop={handleDrop}
        onError={console.error}
        src={files}
      >
        <DropzoneEmptyState />
        <DropzoneContent></DropzoneContent>
      </Dropzone>
      <div className="flex justify-end gap-2 w-full">
        <Button variant="primary" onClick={onBack}>
          <ChevronLeft />
          Trở lại
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!filePreview}>
          Cập nhật
        </Button>
      </div>
    </div>
  );
};
