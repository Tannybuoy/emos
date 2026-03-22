import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const feedbackTable = pgTable("feedback", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  role: text("role"),
  states: jsonb("states").$type<string[]>(),
  profile: jsonb("profile").$type<Record<string, unknown>>(),
  rating: text("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFeedbackSchema = createInsertSchema(feedbackTable).omit({ id: true, createdAt: true });
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;
export type Feedback = typeof feedbackTable.$inferSelect;
