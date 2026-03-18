/**
 * Migration: Backfill `participantNameNormsById` map from active participants.
 *
 * Why:
 *   The old `participantNameNorms: [String]` array cannot distinguish between
 *   two users with identical searchNames.  The new map keyed by userId is exact.
 *
 * Run:
 *   node Backend/scripts/migrate-participant-name-norms.js
 *   (from the repository root, or adjust paths)
 *
 * Options (env vars):
 *   DRY_RUN=true  – preview without writing to the database.
 *
 * Safety:
 *   - Idempotent: calling multiple times produces the same result.
 *   - Only overwrites `participantNameNormsById`; does not touch any other field.
 *   - Processes conversations in batches of 100 to limit memory usage.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DRY_RUN = process.env.DRY_RUN === 'true';
const BATCH_SIZE = 100;

// ---------------------------------------------------------------------------
// Minimal inline schemas (avoids importing full models with hooks/virtuals)
// ---------------------------------------------------------------------------

const ConversationSchema = new mongoose.Schema({
    participants: [
        {
            userId: mongoose.Schema.Types.ObjectId,
            status: String,
            _id: false,
        }
    ],
    participantNameNormsById: { type: Map, of: String, default: {} },
}, { strict: false, timestamps: true });

const UserSchema = new mongoose.Schema({
    searchName: String,
}, { strict: false });

const Conversation = mongoose.model('Conversation', ConversationSchema);
const User = mongoose.model('User', UserSchema);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set in .env');
        process.exit(1);
    }

    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    if (DRY_RUN) {
        console.log('DRY_RUN mode enabled – no writes will be made.\n');
    }

    const total = await Conversation.countDocuments();
    console.log(`Total conversations: ${total}`);

    let processed = 0;
    let updated = 0;
    let skipped = 0;

    // Stream in batches using skip/limit
    for (let offset = 0; offset < total; offset += BATCH_SIZE) {
        const conversations = await Conversation.find({})
            .skip(offset)
            .limit(BATCH_SIZE)
            .lean();

        // Collect all unique active participant userIds for this batch
        const activeUserIds = new Set();
        for (const conv of conversations) {
            for (const p of conv.participants ?? []) {
                if (p.status === 'ACTIVE') {
                    activeUserIds.add(p.userId.toString());
                }
            }
        }

        // Load searchNames for all active users in one query
        const users = await User.find(
            { _id: { $in: [...activeUserIds] } },
            { searchName: 1 }
        ).lean();

        const searchNameById = new Map(
            users.map(u => [u._id.toString(), u.searchName ?? ''])
        );

        // Build bulkWrite ops
        const ops = [];

        for (const conv of conversations) {
            const mapToSet = {};

            for (const p of conv.participants ?? []) {
                if (p.status !== 'ACTIVE') continue;
                const uid = p.userId.toString();
                const searchName = searchNameById.get(uid);
                if (searchName) {
                    mapToSet[`participantNameNormsById.${uid}`] = searchName;
                }
            }

            if (Object.keys(mapToSet).length === 0) {
                skipped++;
                continue;
            }

            ops.push({
                updateOne: {
                    filter: { _id: conv._id },
                    update: { $set: mapToSet },
                }
            });

            updated++;
        }

        processed += conversations.length;

        if (ops.length > 0 && !DRY_RUN) {
            await Conversation.bulkWrite(ops, { ordered: false });
        }

        const pct = Math.round((processed / total) * 100);
        console.log(
            `Progress: ${processed}/${total} (${pct}%)` +
            ` | updated: ${updated} | skipped: ${skipped}` +
            (DRY_RUN ? ' [DRY RUN]' : '')
        );
    }

    console.log('\nMigration complete.');
    console.log(`  Total processed : ${processed}`);
    console.log(`  Updated         : ${updated}`);
    console.log(`  Skipped (no ops): ${skipped}`);

    await mongoose.disconnect();
}

run().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
