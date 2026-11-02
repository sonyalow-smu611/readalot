// Scaffolded with AI assistance — see AI_USAGE.md
// Each reader's room furniture: one row per reader in the room_furniture table
// (database/room_furniture.sql) holding their pieces. Without Supabase, rooms are kept in memory
// while the server runs.
import { env } from "./env.js";
import { supabase } from "./supabase.js";

export const PIECES_MAX = 200;
// the room's zones (client/src/buildings/house/strip/layout.js) and its size in art pixels
const ZONES = new Set(["wall", "room", "seat", "side-table", "nightstand", "chair", "curtains", "bed"]);
const ROOM = { width: 1240, height: 420 };

const shortText = (value) => typeof value === "string" && value.length > 0 && value.length <= 64;

// The pieces a reader sent, kept to their known fields, or null when any piece is malformed:
// { uid, id } in the inventory, { uid, id, zone, x, at? } placed.
export function cleanPieces(list) {
  if (!Array.isArray(list) || list.length > PIECES_MAX) return null;
  const clean = [];
  for (const piece of list) {
    if (!piece || !shortText(piece.uid) || !shortText(piece.id)) return null;
    const out = { uid: piece.uid, id: piece.id };
    if (piece.zone !== undefined) {
      if (!ZONES.has(piece.zone) || typeof piece.x !== "number" || !(piece.x >= 0 && piece.x <= 1)) return null;
      out.zone = piece.zone;
      out.x = piece.x;
      if (piece.at !== undefined) {
        const { x, y } = piece.at ?? {};
        if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x > ROOM.width || y < 0 || y > ROOM.height) return null;
        out.at = { x, y };
      }
    }
    clean.push(out);
  }
  return clean;
}

const demoRooms = new Map();

// A reader's pieces; [] for a reader who hasn't furnished their room.
export async function getPieces(ownerId) {
  if (!env.HAS_SUPABASE) return demoRooms.get(ownerId) ?? [];
  const { data, error } = await supabase.from("room_furniture").select("pieces").eq("owner_id", ownerId).maybeSingle();
  if (error) throw error;
  return data?.pieces ?? [];
}

// Replaces a reader's pieces (already cleaned).
export async function savePieces(ownerId, pieces) {
  if (!env.HAS_SUPABASE) {
    demoRooms.set(ownerId, pieces);
    return pieces;
  }
  const { data, error } = await supabase
    .from("room_furniture")
    .upsert({ owner_id: ownerId, pieces, updated_at: new Date().toISOString() })
    .select("pieces")
    .single();
  if (error) throw error;
  return data.pieces;
}
