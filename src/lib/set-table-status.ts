import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/integrations/supabase/types";
import type { TableStatus } from "@/lib/mock-data";
import { getSupabaseProjectRef } from "@/lib/supabase-env";

export function formatSetTableStatusError(message: string): string {
  const ref = getSupabaseProjectRef();
  const projectHint = ref ? ` (연결 프로젝트: ${ref})` : "";

  if (
    message.includes("Could not find the function") ||
    message.includes("PGRST202") ||
    message.includes("function public.set_table_status") ||
    message.includes("schema cache")
  ) {
    return (
      `set_table_status 함수를 API에서 찾을 수 없습니다${projectHint}. ` +
      `Supabase SQL Editor에서 supabase/apply-fix.sql 전체를 실행하고, ` +
      `Dashboard → Project Settings → API → Reload schema cache 후 dev 서버를 재시작하세요.`
    );
  }

  return message;
}

function isMissingRpcError(message: string) {
  return (
    message.includes("Could not find the function") ||
    message.includes("PGRST202") ||
    message.includes("function public.set_table_status") ||
    message.includes("schema cache")
  );
}

async function runSetTableStatusDirect(
  client: SupabaseClient<Database>,
  params: {
    table_id: string;
    new_status: TableStatus;
    source?: string;
    payload?: Json;
  },
) {
  const { data: table, error: fetchError } = await client
    .from("restaurant_tables")
    .select("id, restaurant_id, table_number, status")
    .eq("id", params.table_id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!table) throw new Error("table not found");

  const previous = table.status as TableStatus;
  const now = new Date().toISOString();
  const occupied_at = params.new_status === "OCCUPIED" ? now : null;

  const { error: updateError } = await client
    .from("restaurant_tables")
    .update({
      status: params.new_status,
      occupied_at,
      updated_at: now,
    })
    .eq("id", params.table_id);

  if (updateError) throw new Error(updateError.message);

  const { error: logError } = await client.from("table_status_logs").insert({
    restaurant_id: table.restaurant_id,
    table_id: table.id,
    table_number: table.table_number,
    previous_status: previous,
    new_status: params.new_status,
    source: params.source ?? "admin",
    payload: params.payload ?? { via: "admin-ui" },
  });

  if (logError) throw new Error(logError.message);

  return {
    ok: true as const,
    previous_status: previous,
    new_status: params.new_status,
  };
}

export async function runSetTableStatus(
  client: SupabaseClient<Database>,
  params: {
    table_id: string;
    new_status: TableStatus;
    source?: string;
    payload?: Json;
  },
) {
  const { data, error } = await client.rpc("set_table_status", {
    p_table_id: params.table_id,
    p_new_status: params.new_status,
    p_source: params.source ?? "admin",
    p_payload: params.payload ?? { via: "admin-ui" },
  });

  if (!error) {
    return data as {
      ok: true;
      previous_status: TableStatus;
      new_status: TableStatus;
    };
  }

  if (isMissingRpcError(error.message)) {
    console.warn(
      "[Supabase] set_table_status RPC missing — using direct update. Run supabase/apply-fix.sql for production.",
    );
    return runSetTableStatusDirect(client, params);
  }

  throw new Error(formatSetTableStatusError(error.message));
}
