import { z } from 'zod'
import { BriefBulletSchema, ConfidenceSchema } from '../contracts'

export const OverviewSectionSchema = z.object({
  headline: z.string(),
  bottomLine: z.string(),
  whyItMatters: z.string().nullable().optional(),
  confidence: ConfidenceSchema,
})

export const BulletSectionSchema = z.object({
  title: z.string(),
  bullets: z.array(BriefBulletSchema).max(6),
})

export type OverviewSection = z.infer<typeof OverviewSectionSchema>
export type BulletSection = z.infer<typeof BulletSectionSchema>
