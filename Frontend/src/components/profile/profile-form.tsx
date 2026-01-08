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
import ImageDropzone from "../ui/shadcn-io/dropzone/image-dropzone.tsx";
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from "../ui/shadcn-io/dropzone/index.tsx";
import { useState } from "react";
import { Avatar } from "../avatar.tsx";
import { fileService } from "../../services/fileService.ts";
import Loading from "../ui/loading.tsx";

const schema = z.object({
  displayName: z.string().min(1, "Tên hiển thị là bắt buộc"),
  bio: z.string(),
  email: z.email("Email không đúng định dạng").min(1, "Email là bắt buộc"),
  phone: z.regex(
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

  const handleSubmitForm = async (data: profileSchema) => { };

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

export const EditAvatarForm = ({ handleBack }: { handleBack: () => void }) => {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<File[] | undefined>();
  const [filePreview, setFilePreview] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false)

  const handleDrop = async (files: File[]) => {
    try {
      setLoading(true)
      setFiles(files);
      if (files.length > 0) {
        const res = await fileService.uploadAvatar(files[0])
        setFilePreview(res.url);
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoading(false)
    }
  };

  const handleSubmit = () => {
    try {
      // const
    } catch (error) {

    }
  };

  return (
    <div className="flex flex-col items-center w-full gap-6">
      <Avatar
        name={user?.displayName!}
        avatarUrl={filePreview || user?.avtUrl}
        className="w-32 h-32 relative bg-"
        layer={
          loading &&
          <div className="absolute inset-0 flex items-center justify-center bg-gray-500/70">
            <Loading />
          </div>
        }
      />
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
        <Button variant="primary" onClick={handleBack}>
          <ChevronLeft />
          Trở lại
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!!files?.length}>
          Cập nhật
        </Button>
      </div>
    </div>
  );
};
