import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fromNow(datetime: string | Date): string {
  const date = typeof datetime === "string" ? new Date(datetime) : datetime;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const yesterday = new Date(new Date().setDate(now.getDate() - 1));
  const startOfYesterday = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds} giây`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút`;

  const hours = Math.floor(minutes / 60);
  if (date > yesterday) return `${hours} giờ`;
  if (date < yesterday && date > startOfYesterday) return `Hôm qua`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày`;

  const months = Math.floor(days / 30);
  if (months < 12)
    return `${date.getDate().toString().padStart(2, "0")}/${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;

  return `${date.getDate().toString().padStart(2, "0")}/${String(
    date.getMonth() + 1
  ).padStart(2, "0")}/${date.getFullYear()}`;
}

export function getAcronym(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/Đ/g, "D")
    .replace(/đ/g, "d")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export const stringToHexColor = (str: string): any => {
  let hash = 0;
  for (let i = 0; i < str?.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Tạo hue từ 0–360
  const hue = Math.abs(hash) % 360;
  const saturation = 90; // độ bão hòa cao để giữ màu rõ
  const lightness = 45; // độ sáng cao

  return {
    backgroundColor: `hsla(${hue}, ${saturation}%, ${lightness}% , 0.2)`,
    color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
  };
};

export const diffMinutes = (a: Date, b: Date) => {
  return Math.abs(a.getTime() - b.getTime()) / 1000 / 60;
};

export const getMessageTime = (datetime: string | Date): string => {
  const date = dayjs(datetime);
  const startOfToday = dayjs()
    .set("hour", 0)
    .set("second", 0)
    .set("millisecond", 0);
  const startOfYesterday = dayjs(startOfToday).subtract(1, "day");

  if (date > startOfToday) return date.format("HH:mm");
  if (date > startOfYesterday) return `${date.format("HH:mm")} Hôm qua`;

  return date.format("HH:mm DD/MM/YYYY");
};
