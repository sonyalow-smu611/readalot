/**
 * Readalot DEMO messaging service.
 * Stores sample conversations in browser localStorage (not a shared database).
 * No Supabase, authentication, or Express API required.
 * Replace this service with authenticated server calls for real multi-user chat.
 */
const STORAGE_KEY = "readalot_demo_messages_v1";
const DEMO_USER_ID = "readalot-demo-me";

export function getChatIdentity() {
  return Promise.resolve({ id: DEMO_USER_ID, displayName: "You (Demo Reader)" });
}

function sampleMessages(readerId) {
  // Reader-specific seed data. These are fictional demo conversations.
  const now = Date.now();
  return [
    {
      id: `${readerId}-sample-1`,
      sender_id: readerId,
      receiver_id: DEMO_USER_ID,
      content: "Hey! What's your favourite book lately? 📚",
      created_at: new Date(now - 7200000).toISOString(),
    },
    {
      id: `${readerId}-sample-2`,
      sender_id: DEMO_USER_ID,
      receiver_id: readerId,
      content: "I've been enjoying mystery novels! What about you?",
      created_at: new Date(now - 3600000).toISOString(),
    },
  ];
}

function loadDatabase() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    throw new Error("Browser storage is unavailable. Enable website storage to save chats.");
  }
}

function saveDatabase(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    throw new Error("Couldn't save messages in this browser. Check storage settings.");
  }
}

function getConversation(readerId) {
  const database = loadDatabase();
  if (!Array.isArray(database[readerId])) {
    database[readerId] = sampleMessages(readerId);
    saveDatabase(database);
  }
  return { database, messages: database[readerId] };
}

export async function getMessages(readerId) {
  if (!readerId) throw new Error("Missing reader ID");
  return { messages: [...getConversation(String(readerId)).messages] };
}

export async function sendReaderMessage(readerId, content, senderId = DEMO_USER_ID) {
  if (!readerId) throw new Error("Missing reader ID");
  if (typeof content !== "string" || !content.trim() || content.trim().length > 1000) {
    throw new Error("Message must contain 1–1000 characters");
  }
  if (![DEMO_USER_ID, String(readerId)].includes(senderId)) {
    throw new Error("Invalid demo sender");
  }
  const { database, messages } = getConversation(String(readerId));
  const message = {
    id: globalThis.crypto?.randomUUID?.() || `message-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sender_id: senderId,
    receiver_id: senderId === DEMO_USER_ID ? String(readerId) : DEMO_USER_ID,
    content: content.trim(),
    created_at: new Date().toISOString(),
  };
  database[String(readerId)] = [...messages, message];
  saveDatabase(database);
  return { message };
}

export function clearDemoConversation(readerId) {
  const database = loadDatabase();
  delete database[String(readerId)];
  saveDatabase(database);
}

export { DEMO_USER_ID };
