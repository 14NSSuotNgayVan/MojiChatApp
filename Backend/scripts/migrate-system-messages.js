/**
 * Migration: Convert plain-text system messages to structured systemType + meta format.
 *
 * Run:
 *   node --experimental-vm-modules Backend/scripts/migrate-system-messages.js
 *   (from the repository root, or adjust paths accordingly)
 *
 * Safety:
 *   - Idempotent: skips documents that already have systemType set.
 *   - Does NOT delete or overwrite content — keeps original content intact.
 *   - Unresolvable messages get systemType = 'UNKNOWN'.
 *   - Dry-run mode: set DRY_RUN=true env var to preview without writing.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ---------------------------------------------------------------------------
// Inline minimal schemas (avoids importing full models with hooks/virtuals)
// ---------------------------------------------------------------------------

const MessageSchema = new mongoose.Schema({
    conversationId: mongoose.Schema.Types.ObjectId,
    senderId: mongoose.Schema.Types.ObjectId,
    type: String,
    systemType: String,
    meta: {
        actorId: mongoose.Schema.Types.ObjectId,
        targetUserId: mongoose.Schema.Types.ObjectId,
        oldValue: String,
        newValue: String,
    },
    content: String,
    isDeleted: Boolean,
}, { timestamps: true, strict: false });

const UserSchema = new mongoose.Schema({
    displayName: String,
}, { strict: false });

const Message = mongoose.model('Message', MessageSchema);
const User = mongoose.model('User', UserSchema);

// ---------------------------------------------------------------------------
// Pattern definitions — order matters (more specific patterns first)
// ---------------------------------------------------------------------------

const PATTERNS = [
    {
        regex: /^(.+) đã thêm (.+) vào nhóm\.$/,
        systemType: 'USER_ADDED',
        actorGroup: 1,
        targetGroup: 2,
    },
    {
        regex: /^(.+) đã xóa (.+) khỏi nhóm\.$/,
        systemType: 'USER_REMOVED',
        actorGroup: 1,
        targetGroup: 2,
    },
    {
        regex: /^(.+) đã trao quyền quản trị viên cho (.+)\.$/,
        systemType: 'ADMIN_PROMOTED',
        actorGroup: 1,
        targetGroup: 2,
    },
    {
        regex: /^(.+) đã xóa quyền quản trị viên của (.+)\.$/,
        systemType: 'ADMIN_REMOVED',
        actorGroup: 1,
        targetGroup: 2,
    },
];

// ---------------------------------------------------------------------------
// Helper: resolve displayName → ObjectId (with in-memory cache)
// ---------------------------------------------------------------------------

const nameCache = new Map(); // displayName -> ObjectId | null

async function resolveUserId(displayName) {
    if (!displayName) return null;
    if (nameCache.has(displayName)) return nameCache.get(displayName);

    // displayName is NOT unique in general — take the first match.
    // In practice system messages were created at the moment of the action
    // so there should be only one match, or the first match is good enough.
    const user = await User.findOne({ displayName }).select('_id').lean();
    const id = user ? user._id : null;
    nameCache.set(displayName, id);
    return id;
}

// ---------------------------------------------------------------------------
// Parse a single message content string
// ---------------------------------------------------------------------------

async function parseContent(content) {
    if (!content) return { systemType: 'UNKNOWN', meta: {} };

    for (const pattern of PATTERNS) {
        const match = content.match(pattern.regex);
        if (!match) continue;

        const actorName = match[pattern.actorGroup]?.trim();
        const targetName = pattern.targetGroup ? match[pattern.targetGroup]?.trim() : null;

        const actorId = await resolveUserId(actorName);
        const targetUserId = targetName ? await resolveUserId(targetName) : null;

        const meta = {};
        if (actorId) meta.actorId = actorId;
        if (targetUserId) meta.targetUserId = targetUserId;

        return { systemType: pattern.systemType, meta };
    }

    return { systemType: 'UNKNOWN', meta: {} };
}

// ---------------------------------------------------------------------------
// Main migration
// ---------------------------------------------------------------------------

const BATCH_SIZE = 200;
const DRY_RUN = process.env.DRY_RUN === 'true';

async function migrate() {
    await mongoose.connect(process.env.MONGO_DB_CONNECTION_STRING);
    console.log('Connected to MongoDB.');

    if (DRY_RUN) {
        console.log('DRY RUN MODE — no writes will be performed.');
    }

    let processed = 0;
    let updated = 0;
    let skipped = 0;
    let unknown = 0;
    let lastId = null;

    console.log('Starting migration of system messages...\n');

    // Paginate through all type=system messages that don't yet have systemType
    while (true) {
        const query = { type: 'system', systemType: { $exists: false } };
        if (lastId) query._id = { $gt: lastId };

        const batch = await Message.find(query)
            .sort({ _id: 1 })
            .limit(BATCH_SIZE)
            .lean();

        if (!batch.length) break;

        lastId = batch[batch.length - 1]._id;

        const bulkOps = [];

        for (const msg of batch) {
            processed++;
            const { systemType, meta } = await parseContent(msg.content);

            if (systemType === 'UNKNOWN') unknown++;

            if (!DRY_RUN) {
                bulkOps.push({
                    updateOne: {
                        filter: { _id: msg._id },
                        update: { $set: { systemType, meta } },
                    },
                });
            } else {
                console.log(`[DRY RUN] _id=${msg._id} | content="${msg.content}" => systemType=${systemType}`);
            }
        }

        if (!DRY_RUN && bulkOps.length) {
            const result = await Message.bulkWrite(bulkOps, { ordered: false });
            updated += result.modifiedCount;
        }

        console.log(`Processed ${processed} messages so far (updated: ${updated}, unknown: ${unknown})...`);
    }

    // Also migrate lastMessage.systemType on Conversation documents
    // where lastMessage.type = 'system' but lastMessage.systemType is missing
    console.log('\nMigrating lastMessage.systemType on Conversation documents...');

    const Conversation = mongoose.connection.collection('conversations');
    const convCursor = Conversation.find({
        'lastMessage.type': 'system',
        'lastMessage.systemType': { $exists: false },
        'lastMessage.content': { $exists: true, $ne: null }
    });

    let convUpdated = 0;
    const convBulkOps = [];

    for await (const conv of convCursor) {
        skipped++;
        const content = conv.lastMessage?.content;
        if (!content) continue;

        const { systemType } = await parseContent(content);

        convBulkOps.push({
            updateOne: {
                filter: { _id: conv._id },
                update: { $set: { 'lastMessage.systemType': systemType } },
            },
        });

        if (convBulkOps.length >= BATCH_SIZE) {
            if (!DRY_RUN) {
                const r = await Conversation.bulkWrite(convBulkOps, { ordered: false });
                convUpdated += r.modifiedCount;
            }
            convBulkOps.length = 0;
        }
    }

    if (!DRY_RUN && convBulkOps.length) {
        const r = await Conversation.bulkWrite(convBulkOps, { ordered: false });
        convUpdated += r.modifiedCount;
    }

    console.log(`\nMigration complete.`);
    console.log(`  Messages processed : ${processed}`);
    console.log(`  Messages updated   : ${DRY_RUN ? '(dry run)' : updated}`);
    console.log(`  Unknown (fallback) : ${unknown}`);
    console.log(`  Conversations updated: ${DRY_RUN ? '(dry run)' : convUpdated}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
