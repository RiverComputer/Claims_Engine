import { z } from "zod";

export const ValidationSchema = z.object({
  shortSummary: z.string().min(1, "Summary is required"),
  validatorNames: z.array(z.string()).min(1, "At least one validator name is required"),
  validationType: z.string().min(1, "Validation type is required"),
  evidenceCID: z.array(z.string()).min(1, "At least one evidence CID is required"),
  location: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      address: z.string().optional(),
    })
    .optional(),
  createdAt: z.string(),
});

export type ValidationData = z.infer<typeof ValidationSchema>;

