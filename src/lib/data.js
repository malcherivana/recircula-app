import { supabase } from "./supabase";

function getClient() {
  if (!supabase) {
    throw new Error("O Supabase não está configurado para este ambiente.");
  }
  return supabase;
}

function throwOnError({ data, error }) {
  if (error) throw error;
  return data;
}

export function getErrorMessage(error) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  if (error && typeof error.message === "string" && error.message) return error.message;
  return "Ocorreu um erro inesperado. Tente novamente.";
}

export async function loadListings() {
  const client = getClient();
  const rows = throwOnError(
    await client
      .from("listings")
      .select("*, profiles!listings_owner_id_fkey(display_name, created_at)")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(100),
  );

  return rows.map((row) => ({
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    description: row.description,
    category: row.category,
    tipo: row.kind,
    bairro: row.neighborhood,
    cidade: row.city,
    imagePath: row.image_path,
    imageUrl: row.image_path
      ? client.storage.from("listing-images").getPublicUrl(row.image_path).data.publicUrl
      : null,
    dono: row.profiles?.display_name || "Membro",
    membro: row.profiles?.created_at
      ? `Membro desde ${new Date(row.profiles.created_at).getFullYear()}`
      : "Membro",
  }));
}

export async function loadFavorites(userId) {
  const rows = throwOnError(
    await getClient().from("favorites").select("listing_id").eq("user_id", userId),
  );
  return Object.fromEntries(rows.map(({ listing_id: id }) => [id, true]));
}

export async function saveFavorite(userId, listingId, wasSaved) {
  const client = getClient();
  if (wasSaved) {
    throwOnError(
      await client
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId),
    );
    return;
  }

  throwOnError(
    await client.from("favorites").insert({
      user_id: userId,
      listing_id: listingId,
    }),
  );
}

export async function loadConversations(userId) {
  const rows = throwOnError(
    await getClient()
      .from("conversations")
      .select(`
        id,
        listing_id,
        requester_id,
        owner_id,
        listings(title),
        requester:profiles!conversations_requester_id_fkey(display_name),
        owner:profiles!conversations_owner_id_fkey(display_name),
        messages(id, sender_id, body, created_at)
      `)
      .or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
      .order("updated_at", { ascending: false }),
  );

  return rows.map((row) => ({
    id: row.id,
    itemTitle: row.listings?.title || "Anúncio indisponível",
    contato:
      row.requester_id === userId
        ? row.owner?.display_name || "Membro"
        : row.requester?.display_name || "Membro",
    messages: (row.messages || [])
      .sort((first, second) => new Date(first.created_at) - new Date(second.created_at))
      .map((message) => ({
        id: message.id,
        from: message.sender_id === userId ? "me" : "them",
        text: message.body,
      })),
  }));
}

export async function createOrGetConversation(listing) {
  const client = getClient();
  const { data: userData, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  const requesterId = userData.user?.id;
  if (!requesterId) throw new Error("Entre na sua conta para iniciar uma conversa.");
  if (listing.ownerId === requesterId) {
    throw new Error("Você não pode iniciar uma conversa com seu próprio anúncio.");
  }

  const inserted = await client
    .from("conversations")
    .insert({
      listing_id: listing.id,
      requester_id: requesterId,
      owner_id: listing.ownerId,
    })
    .select("id")
    .single();
  if (!inserted.error) return inserted.data.id;
  if (inserted.error.code !== "23505") throw inserted.error;

  const existing = throwOnError(
    await client
      .from("conversations")
      .select("id")
      .eq("listing_id", listing.id)
      .eq("requester_id", requesterId)
      .single(),
  );
  return existing.id;
}

export async function sendConversationMessage(conversationId, senderId, body) {
  throwOnError(
    await getClient().from("messages").insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body,
    }),
  );
}

export async function setListingVisibility(listingId, status) {
  if (!["active", "hidden"].includes(status)) {
    throw new Error("Status de anúncio inválido.");
  }
  const rows = throwOnError(
    await getClient()
      .from("listings")
      .update({ status })
      .eq("id", listingId)
      .select("id"),
  );
  if (rows.length === 0) throw new Error("Anúncio não encontrado ou sem permissão para alterá-lo.");
}

export async function loadAdminDashboard() {
  const result = throwOnError(await getClient().rpc("admin_dashboard"));
  return result;
}
