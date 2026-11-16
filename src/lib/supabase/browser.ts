"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabasePublishableKey, supabaseUrl } from "./config";

/** 後台瀏覽器端用：照片直接從瀏覽器上傳到 Storage，不經過網站伺服器，大檔也不會卡住。 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
