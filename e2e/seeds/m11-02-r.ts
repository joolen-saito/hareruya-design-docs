/**
 * M11-02 メンバー管理の追加分のシード（007・025）。正本: cases/M11-02_seed_data.tsv
 * - S-M11-02-NOEDIT（007）: 「メンバー編集権限なし」は、E2E が足した権限グループへ、メンバーの新規登録画面の拒否URL（/setting/system/member/new）だけを
 *   DB で足して作る（seeds/m11-03.ts の試験権限と同じ作り。既存の権限・拒否URLには触れない）。所属・権限の読み替えはしない（権限は新しく足す）。
 *   パスワードは正本の値（NoEditPass123!）のまま（13文字でアプリの最低12文字を満たす）。ログインIDには実行の印を付ける。
 * - S-M11-02-BASE-025（025）: 編集前のメンバー（seeds/m11-02.ts の BASE と同じ作り）。ログインIDを「A」×255文字（印なし）へ更新するので、
 *   前のケース（023）や前の実行が残した、名前「あ」×255・ログインID「A」×255・メールアドレス「a」×243＋@example.com の特徴が全部そろったメンバーが
 *   いれば、メンバー管理一覧の削除で消してから始める（特徴がそろわない・表示順の上にほかの方のメンバーがいるときは消さずに止める）。
 */
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { SETUP_ADMIN } from "../config/env";
import { withAdminSession } from "../lib/session";
import { ログインIDのメンバー } from "../db/m11_02";
import { 繰り下がる相手を確かめる } from "../db/m11_01";
import { MemberListPage } from "../pages/admin/m11_01_member_list";
import { メンバーを作る, 編集前のメンバー } from "./m11-02";
import { 試験権限を定める } from "./m11-03";

export const 長いログインID = "A".repeat(255);
export const 長い名前 = "あ".repeat(255);
export const 長いメール = "a".repeat(243) + "@example.com";

export const NOEDIT = { ログインID: "m1102_noedit", パスワード: "NoEditPass123!" };

試験権限を定める("S-M11-02-NOEDIT", {
  控え: "〔メンバーID-M1102-共有B〕", 権限名: "メンバー編集不可権限-M1102", 名前: "編集権限なし管理者", ログインID: NOEDIT.ログインID, パスワード: NOEDIT.パスワード,
  拒否URL: ["/setting/system/member/new"],
});

/** 特徴がそろった、前のケースの「A」×255のメンバーがいれば、メンバー管理一覧の削除で消す（ほかの方のメンバーは消さない） */
export async function 長いログインIDのメンバーを片付ける(browser: import("@playwright/test").Browser, 何: string): Promise<void> {
  for (const m of ログインIDのメンバー(長いログインID)) {
    if (m.名前 !== 長い名前 || m.メール !== 長いメール) throw new Error(`${何}: ログインID「A」×255のメンバー（ID ${m.ID}）がいるが、名前・メールアドレスが E2E の値でない。ほかの方のメンバーかもしれないので消さない`);
    繰り下がる相手を確かめる(m.ID);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(120_000);
      const l = new MemberListPage(page);
      await l.開く();
      await l.確認を開く(m.ID, "削除");
      await l.実行する(m.ID, "削除");
      const 帯 = await l.帯();
      if (!帯.成功.some((t) => t.includes("削除しました"))) throw new Error(`${何}: メンバー ${m.ID} を削除できない（${[...帯.誤り, ...帯.警告].join(" / ")}）`);
    });
  }
}

defineSeed("S-M11-02-BASE-025", { needs: ["S-M11-02-MASTER"] }, async ({ browser, notes, seed }) => {
  await 長いログインIDのメンバーを片付ける(browser, seed.シードID);
  reportSeedIssue(seed.シードID, "更新後のログインID「A」×255は、前のケース（023）が作ったメンバーと同じ値になるので、特徴（名前・ログインID・メールアドレス）がそろった E2E のメンバーだけを、メンバー管理一覧の削除で先に消した");
  notes.set("〔メンバーID-M1102-025〕", await メンバーを作る(browser, seed.シードID, 編集前のメンバー("025", "BeforePass1-025!")));
});
