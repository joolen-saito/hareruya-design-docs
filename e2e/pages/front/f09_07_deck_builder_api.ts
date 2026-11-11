/**
 * F09-07 のシード用: デッキビルダーの API を画面の外から呼んで、デッキの「一時保存」を作る。HTTP のパスはここだけに置く。
 *
 * - 対象は、E2E が作った実行の印つきの会員と、その会員が持つ実行の印つきのデッキだけ（依頼者の方針 2026-11-10）。
 * - ログインは、その会員のメールアドレスとパスワードで行う（アプリの設定の秘密の値は使わない）。
 * - 一時保存は、デッキの保存を「即時保存にしない」指定で送ると、デッキの識別子を鍵にしたキャッシュに保存される（保持時間 30 分）。
 *   採用カードの情報（デッキ本体）は変わらない。キャッシュの保持時間があるので、作ったらすぐに書き出しを確かめること。
 * - 値の形（デッキビルダーの API の入力）: 採用カードは { card_id, board_id, count }。ボードの番号は メイン 1・サイド 2・統率 3。
 */
import { request } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export const ボード番号 = { メイン: 1, サイド: 2, 統率: 3 } as const;
/** デッキ全体の公開設定の番号（公開） */
const 公開 = 1;

export type 一時保存の札 = { カードID: string; ボード: keyof typeof ボード番号; 枚数: number };

/** 会員でログインして、指定のデッキの一時保存（デッキリスト）を作る。失敗したら理由つきで投げる */
export async function 一時保存を作る(v: {
  メール: string; パスワード: string; デッキID: string; フォーマットID: string; アーキタイプID: string; 札: 一時保存の札[];
}): Promise<void> {
  const api = await request.newContext({ baseURL: BASE_URL, ignoreHTTPSErrors: true });
  try {
    const login = await api.post("/api/user/login", { data: { id: v.メール, password: v.パスワード } });
    if (login.status() !== 200) throw new Error(`デッキビルダーのログインに失敗した（会員 ${v.メール}・応答 ${login.status()}）: ${(await login.text()).slice(0, 300)}`);
    const token = ((await login.json()) as { access_token?: string }).access_token;
    if (!token) throw new Error(`デッキビルダーのログインの応答に利用券（アクセストークン）が無い（会員 ${v.メール}）`);
    const body = {
      format_id: Number(v.フォーマットID),
      archetype_id: Number(v.アーキタイプID),
      scope_id: 公開,
      instant_save_flag: false,
      cards: v.札.map((c) => ({ card_id: Number(c.カードID), board_id: ボード番号[c.ボード], count: c.枚数 })),
    };
    const put = await api.put(`/api/deck/${v.デッキID}`, { data: body, headers: { "jwt-token": token } });
    if (put.status() !== 200) throw new Error(`デッキ ${v.デッキID} の一時保存に失敗した（応答 ${put.status()}）: ${(await put.text()).slice(0, 300)}`);
  } finally {
    await api.dispose();
  }
}
