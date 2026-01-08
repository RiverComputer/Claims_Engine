import { z } from "zod";

export const ClaimSchema = z.object({
  title: z.string().min(1, "Title is required"),
  shortDescription: z.string().min(1, "Short description is required"),
  evidenceCID: z.array(z.string()).min(1, "At least one evidence CID is required"),
  validationCID: z.array(z.string()).min(1, "At least one validation CID is required"),
  image: z.string().optional(),
  project: z.string().optional(),
  createdAt: z.string(),
});

export type ClaimData = z.infer<typeof ClaimSchema>;

