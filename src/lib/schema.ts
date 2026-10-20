import { pgTable, text, timestamp, bigint, integer } from 'drizzle-orm/pg-core';
export const users = pgTable('users', { walletAddress: text('wallet_address').primaryKey(), name: text('name').notNull(), bio: text('bio'), createdAt: timestamp('created_at').defaultNow().notNull() });
export const campaignMetadata = pgTable('campaigns', {
  id: text('id').primaryKey(), creatorAddress: text('creator_address').notNull().references(() => users.walletAddress),
  title: text('title').notNull(), description: text('description').notNull(), imageUrl: text('image_url').notNull(),
  category: text('category').notNull(), location: text('location').notNull(), organizer: text('organizer').notNull(),
  creationBlock: integer('creation_block').notNull(), transactionHash: text('transaction_hash').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
