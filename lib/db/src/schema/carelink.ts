import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const carelinkStateTable = pgTable("carelink_state", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertCarelinkStateSchema = createInsertSchema(carelinkStateTable).omit({
  id: true,
  updatedAt: true,
});
export type InsertCarelinkState = z.infer<typeof insertCarelinkStateSchema>;
export type CarelinkState = typeof carelinkStateTable.$inferSelect;