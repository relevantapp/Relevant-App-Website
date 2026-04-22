import { z } from 'zod'
import { ResearchTypeSchema } from './contracts'

export const ClaimFeedbackSentimentSchema = z.enum(['up', 'down'])
export type ClaimFeedbackSentiment = z.infer<typeof ClaimFeedbackSentimentSchema>

export const ClaimFeedbackFlagSchema = z.enum(['wrong', 'stale', 'generic'])
export type ClaimFeedbackFlag = z.infer<typeof ClaimFeedbackFlagSchema>

export const ClaimFeedbackPayloadSchema = z.object({
  briefId: z.string().uuid(),
  researchType: ResearchTypeSchema,
  claimKey: z.string().min(1).max(200),
  claimText: z.string().min(1).max(4000),
  sentiment: ClaimFeedbackSentimentSchema,
  flags: z.array(ClaimFeedbackFlagSchema).max(1).default([]),
  sourceIds: z.array(z.string()).default([]),
}).superRefine((value, ctx) => {
  if (value.sentiment === 'up' && value.flags.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Positive feedback cannot include flags.',
      path: ['flags'],
    })
  }
})

export type ClaimFeedbackPayload = z.infer<typeof ClaimFeedbackPayloadSchema>
