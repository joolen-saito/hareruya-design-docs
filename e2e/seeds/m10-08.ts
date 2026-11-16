/**
 * M10-08 自動送信メールテンプレート編集 の画面シード。正本: cases/M10-08_seed_data.tsv
 *
 * ≪共有のものを書き換える≫ 画面に新規作成の手段が無いので、検証用の自動送信メールのテンプレートを、E2E が作る行としてDBへ足す
 *   （lib/db_write.ts の窓口。メール識別キーに実行の印を付ける。決まった番号は、空いていなければ足さない）。足した行は、基盤が必ず消す
 *   （lib/shared_restore.ts の registerRestore。消したあと、番号が無いことを確かめる）。既存の共有のテンプレートは書き換えない。
 *
 * シードでの解釈（アプリの作りに合わせたもの）:
 * - 対象店舗（店舗ID 10890002 など）は作らない・切り替えない。アプリの画面は、店舗で切り替えられず、モール共有の自動送信メールのテンプレートだけを扱う。
 *   足すテンプレートは、既存の自動送信メールと同じ側（同じ店舗・同じ本文の雛形）に足す。画面の一覧にはほかの共有のテンプレートも並ぶ。
 * - 「店舗に紐づくテンプレートは0件／4件だけ」は成り立たない（共有の一覧）。ケースが確かめる名前・番号の行について確かめる。
 * - 固定本文と本文上部・本文下部の差込位置は、既存の自動送信メールの本文の雛形を使う（雛形はファイルで決まり、シードでは作れない）。
 * - 最終更新者「試験 太郎」はこの機能の試験管理者。開発環境には、ほかの方の試験や前の実行の「試験 太郎」が複数いて名前では1人に決められない
 *   （2026-11-13 に準備が止まった）ので、決まった印を付けた名前「試験 太郎-E2E」・ログインID「m1008_admin-e2e」で1度だけ作り、ログインIDで選ぶ。
 *   画面の最終更新者の表示も「試験 太郎-E2E」と読み替える（エビデンスの「控えた番号」に正本の値との対応が残る）。退任 花子も同じ。
 *   管理者ID 10880001・10880002 は画面が振るので固定にしない。
 * - 退任 花子（削除済みの管理者）は、削除済みにできないため、通常の管理者として作る（031 は更新者が自分以外であることだけを使う）。
 * 作らないシード: HIST-DELETED（009）・BODY（013・014）。本文が雛形のファイルで決まる・削除済みの管理者を作れないため、そのケースは実装しない。
 */
import { SETUP_ADMIN } from "../config/env";
import { テンプレートがあるか, テンプレートを消す, テンプレートを足す, 管理者の番号, 自動送信の既存, 使われている番号, 足すテンプレート } from "../db/m10_08_mail";
import { registerRestore } from "../lib/shared_restore";
import { rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { 管理者ID as 管理者IDを引く } from "../db/member";
import { メンバーの編集可能店舗を外す, メンバーを削除する } from "../pages/admin/m05_20_standby";
import { 本店の店名 } from "../pages/admin/f04_setup";
import { ensureAnalysisAdmin } from "./m12-common";

/** 正本の「試験 太郎」（ログインID m1008_admin）。名前が開発環境で重なるので、名前・ログインIDに決まった印を付けて1度だけ作る */
export const M1008_ADMIN: Account = { loginId: rcFixed("m1008_admin").toLowerCase(), password: "Passw0rd!M1008" };
/** 画面に出る最終更新者の名前（正本の「試験 太郎」の読み替え） */
export const M1008_太郎 = rcFixed("試験 太郎");
const 通常日時 = "2026-08-01 09:10:11+09";
const 旧日時 = "2018-12-31 23:59:59+09";

defineSeed("S-M10-08-ADM", async ({ browser, seed }) => {
  await ensureAnalysisAdmin(browser, { 名前: M1008_太郎, account: M1008_ADMIN, メール: `${M1008_ADMIN.loginId}@example.test` });
  reportSeedIssue(seed.シードID, `管理者「試験 太郎」（ログインID m1008_admin）は、名前「${M1008_太郎}」・ログインID「${M1008_ADMIN.loginId}」で作った（開発環境に同じ名前のメンバーが複数いて、名前で1人に決められないため。ログインIDで選ぶ）。最終更新者の表示も「${M1008_太郎}」と読み替える`);
});
defineSeed("S-M10-08-TARGET", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "アプリの自動送信メール画面には、対象店舗を店舗IDで切り替える仕組みが無く、モール共有の自動送信メールのテンプレートだけを扱う。店舗IDの指定・反映はしていない");
});
defineSeed("S-M10-08-EMPTY", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "共有のテンプレート一覧は店舗ごとに0件にできないので、0件の店舗は用意していない。ケースが確かめる内容は、一覧の中身の件数に依らないものだけ");
});

/** テンプレートを足す。足す前に番号の空きを確かめ、基盤へ「消す」手続きを登録してから足す */
function 用意する(seedId: string, 行: Omit<足すテンプレート, "雛形">[]): void {
  const 使用 = 使われている番号(行.map((r) => r.id));
  if (使用.length) throw new Error(`${seedId}: メールテンプレートの番号 ${使用.join("・")} が既に使われているので足さない（既存の行は上書きしない）`);
  const 既存 = 自動送信の既存();
  const ids = 行.map((r) => r.id);
  registerRestore(`メールテンプレート ${ids.join("・")}（${seedId}）`, { 足す番号: ids }, async () => { テンプレートを消す(`${seedId} の後始末`, ids); }, async () => !ids.some(テンプレートがあるか));
  テンプレートを足す(seedId, 既存.店舗, 行.map((r) => ({ ...r, 雛形: 既存.雛形 })));
}

defineSeed("S-M10-08-BASE", { needs: ["S-M10-08-ADM"] }, async ({ seed }) => {
  const 太郎ID = 管理者の番号(M1008_ADMIN.loginId);
  用意する(seed.シードID, [
    { id: 10802, 名称: "A自動テンプレート", 件名: "A更新前件名", 自動送信: true },
    { id: 10801, 名称: "B自動テンプレート", 件名: "B更新前件名", 本文上部: "B保存済み上部", 本文下部: "B保存済み下部", 自動送信: true, 更新者ID: 太郎ID, 更新日時: 通常日時 },
    { id: 10803, 名称: "C自動テンプレート", 件名: "C更新前件名", 自動送信: true },
    { id: 10804, 名称: "D通常テンプレート", 件名: "D更新前件名", 自動送信: false },
  ]);
});
defineSeed("S-M10-08-NOHIST", { needs: ["S-M10-08-ADM"] }, async ({ seed }) => {
  用意する(seed.シードID, [{ id: 10806, 名称: "F更新者未記録テンプレート", 件名: "F更新前件名", 本文上部: "F保存済み上部", 本文下部: "F保存済み下部", 自動送信: true, 更新者ID: null, 更新日時: 旧日時 }]);
});
defineSeed("S-M10-08-OLD-DATE", { needs: ["S-M10-08-ADM"] }, async ({ seed }) => {
  用意する(seed.シードID, [{ id: 10807, 名称: "G旧更新日テンプレート", 件名: "G更新前件名", 本文上部: "G保存済み上部", 本文下部: "G保存済み下部", 自動送信: true, 更新者ID: 管理者の番号(M1008_ADMIN.loginId), 更新日時: 旧日時 }]);
});
const 管理者IDが残っているか = (loginId: string) => !!管理者IDを引く(loginId);
const FORMER = { 名前: rcFixed("退任 花子"), loginId: rcFixed("m1008_former").toLowerCase(), password: "Passw0rd!M1008F" };
defineSeed("S-M10-08-FORMER-ADM", async ({ browser, seed }) => {
  const 店名 = await 本店の店名(browser);
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await ensureMember(page, { 名前: FORMER.名前, 所属店舗: 店名, ログインID: FORMER.loginId, メールアドレス: `${FORMER.loginId}@example.test`, パスワード: FORMER.password, 権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名] });
  });
  reportSeedIssue(seed.シードID, `管理者「${FORMER.名前}」（ログインID「${FORMER.loginId}」）を印つきで作った。削除済みにするのは、この管理者を最終更新者にしたテンプレートを作った後（S-M10-08-DP-031。最終更新者の行があるうちに削除する）`);
});

// ケース専用: B自動テンプレート-nnn（番号 108010nn）
for (const n of ["015", "016", "017", "018", "021"]) {
  defineSeed(`S-M10-08-CASE-${n}`, { needs: ["S-M10-08-ADM"] }, async ({ seed }) => {
    const 上下 = n === "017" ? {} : { 本文上部: `B保存済み上部-${n}`, 本文下部: `B保存済み下部-${n}` };
    用意する(seed.シードID, [{ id: Number(`10801${n}`), 名称: `B自動テンプレート-${n}`, 件名: `B更新前件名-${n}`, ...上下, 自動送信: true, 更新者ID: 管理者の番号(M1008_ADMIN.loginId), 更新日時: 通常日時 }]);
  });
}
defineSeed("S-M10-08-DP-030", { needs: ["S-M10-08-ADM"] }, async ({ seed }) => {
  用意する(seed.シードID, [{ id: 10801130, 名称: "D通常テンプレート-030", 件名: "D更新前件名-030", 自動送信: false }]);
});
defineSeed("S-M10-08-DP-031", { needs: ["S-M10-08-ADM", "S-M10-08-FORMER-ADM"] }, async ({ browser, seed }) => {
  const 花子ID = 管理者の番号(FORMER.loginId);
  用意する(seed.シードID, [{ id: 10801131, 名称: "B自動テンプレート-031", 件名: "B更新前件名-031", 本文上部: "B保存済み上部-031", 本文下部: "B保存済み下部-031", 自動送信: true, 更新者ID: 花子ID, 更新日時: "2026-07-15 14:30:25+09" }]);
  // 正本どおり、最終更新者を「削除済み」にする。編集可能店舗のあるメンバーはアプリが削除できないので、先に外す（M10-09 と同じ手順。E2E の印つきの管理者だけ）
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    await メンバーの編集可能店舗を外す(page, 花子ID);
    await メンバーを削除する(page, 花子ID);
  });
  if (管理者IDが残っているか(FORMER.loginId)) throw new Error(`${seed.シードID}: 管理者「${FORMER.名前}」をメンバー管理で削除したが、まだいる`);
  reportSeedIssue(seed.シードID, `最終更新者の管理者「${FORMER.名前}」（管理者ID ${花子ID}）は、テンプレートを作ったあとにメンバー管理で削除済みにした（削除の前に編集可能店舗を外した）`);
});
defineSeed("S-M10-08-DP-032", { needs: ["S-M10-08-ADM"] }, async ({ seed }) => {
  用意する(seed.シードID, [{ id: 10801132, 名称: "B自動テンプレート-032", 件名: "B更新前件名-032", 本文上部: "B保存済み上部-032", 本文下部: "B保存済み下部-032", 自動送信: true, 更新者ID: null, 更新日時: 旧日時 }]);
});
