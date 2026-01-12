import api from "../lib/axios.ts";

export const fileService = {
  uploadAvatar: async (file: File) => {
    const sigRes = await api.get("/file/signature/avatar");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sigRes.data.apiKey);
    formData.append("timestamp", sigRes.data.timestamp);
    formData.append("signature", sigRes.data.signature);
    formData.append("folder", sigRes.data.folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sigRes.data.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    return res.json();
  },
  uploadBackground: async (file: File) => {
    const sigRes = await api.get("/file/signature/bg");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", sigRes.data.apiKey);
    formData.append("timestamp", sigRes.data.timestamp);
    formData.append("signature", sigRes.data.signature);
    formData.append("folder", sigRes.data.folder);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${sigRes.data.cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    return res.json();
  },
  deleteFile: async (publicId: string) => {
    const res = await api.delete(`/file/delete`, {params: { publicId }});
    return res.data;
  },
};
