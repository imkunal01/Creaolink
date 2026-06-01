import { NextRequest, NextResponse } from "next/server";
import { getPool, getAuthUser } from "@/lib/db";
import { v4 as uuid } from "uuid";
import {
  readThroughCache,
  rateLimit,
  chatKey,
  invalidateChatCache,
  CHAT_CACHE_TTL,
} from "@/lib/cache";
import { invalidateChat } from "@/lib/invalidation";

const MAX_ATTACHMENTS = 6;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 4000;

async function assertProjectMember(projectId: string, userId: string) {
  const db = await getPool();
  const { rows } = await db.query(
    "SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2",
    [projectId, userId]
  );
  return rows.length > 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!(await assertProjectMember(id, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const db = await getPool();

    const messages = await readThroughCache({
      key: chatKey(id),
      ttlSeconds: CHAT_CACHE_TTL,
      source: "api/projects/[id]/chat",
      compute: async () => {
        const { rows } = await db.query(
          `WITH recent_messages AS (
             SELECT cm.*
             FROM chat_messages cm
             WHERE cm.project_id = $1
             ORDER BY cm.created_at DESC
             LIMIT 100
           )
           SELECT rm.id,
                  rm.project_id,
                  rm.sender_id,
                  rm.body,
                  rm.created_at,
                  u.name AS sender_name,
                  u.email AS sender_email,
                  u.username AS sender_username,
                  u.role AS sender_role,
                  COALESCE(
                    JSON_AGG(
                      JSON_BUILD_OBJECT(
                        'id', ca.id,
                        'file_name', ca.file_name,
                        'mime_type', ca.mime_type,
                        'file_size', ca.file_size,
                        'data_url', ca.data_url,
                        'created_at', ca.created_at
                      )
                    ) FILTER (WHERE ca.id IS NOT NULL),
                    '[]'::json
                  ) AS attachments
           FROM recent_messages rm
           INNER JOIN users u ON u.id = rm.sender_id
           LEFT JOIN chat_attachments ca ON ca.message_id = rm.id
           GROUP BY rm.id, rm.project_id, rm.sender_id, rm.body, rm.created_at, u.name, u.email, u.username, u.role
           ORDER BY rm.created_at ASC`,
          [id]
        );
        return rows;
      },
    });

    return NextResponse.json({ messages });
  } catch (err) {
    console.error("List chat messages error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    if (!(await assertProjectMember(id, user.id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limit: 20 messages per minute per user per project
    const rl = await rateLimit(`chat:${user.id}:${id}`, 20, 60);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many messages — please slow down" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.resetInSeconds),
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    const form = await request.formData();
    const body = String(form.get("body") || "").trim();
    const files = form
      .getAll("attachments")
      .filter((value): value is File => value instanceof File && value.size > 0);

    if (body.length === 0 && files.length === 0) {
      return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 });
    }

    if (body.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer` }, { status: 400 });
    }

    if (files.length > MAX_ATTACHMENTS) {
      return NextResponse.json({ error: `Upload up to ${MAX_ATTACHMENTS} files per message` }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `${file.name} is larger than 25MB` },
          { status: 400 }
        );
      }
    }

    const db = await getPool();
    const client = await db.connect();
    const messageId = uuid();

    try {
      await client.query("BEGIN");
      const { rows: messageRows } = await client.query(
        `INSERT INTO chat_messages (id, project_id, sender_id, body)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [messageId, id, user.id, body]
      );

      const attachments = [];
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mimeType = file.type || "application/octet-stream";
        const dataUrl = `data:${mimeType};base64,${buffer.toString("base64")}`;

        const { rows } = await client.query(
          `INSERT INTO chat_attachments (id, message_id, file_name, mime_type, file_size, data_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id, file_name, mime_type, file_size, data_url, created_at`,
          [uuid(), messageId, file.name || "attachment", mimeType, file.size, dataUrl]
        );
        attachments.push(rows[0]);
      }

      await client.query("UPDATE projects SET updated_at = NOW() WHERE id = $1", [id]);
      await client.query("COMMIT");

      // Invalidate chat cache and project list caches for all members
      await invalidateChat(id).catch(() => {});

      return NextResponse.json(
        {
          message: {
            ...messageRows[0],
            sender_name: user.name,
            sender_email: user.email,
            sender_username: user.username,
            sender_role: user.role,
            attachments,
          },
        },
        { status: 201 }
      );
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Create chat message error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
