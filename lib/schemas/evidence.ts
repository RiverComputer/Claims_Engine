import { z } from "zod";

export const EvidenceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  shortDescription: z.string().optional(),
  activity: z.string().optional(),
  fileRef: z.string().optional(),
  thumbnailRef: z.string().optional(),
  imageRotation: z.number().optional(),
  imageCrop: z
    .object({
      x: z.number(),
      y: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .optional(),
  imageAspectRatio: z.number().optional(),
  color: z.string().optional(),
  location: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      address: z.string().optional(),
    })
    .optional(),
  units: z.string().optional(),
  createdAt: z.string(),
});

export type EvidenceData = z.infer<typeof EvidenceSchema>;

