/**
 * M10-09 メール設定（メールテンプレート編集）のシード。正本: cases/M10-09_seed_data.tsv
 *
 * 正本は、固定のIDのテンプレート・専用店舗・本文ファイルを DB フィクスチャとファイルの配置で入れる前提。E2E では次のように読み替える。
 * - 専用店舗（店舗ID 9100001 など）は作らない。アプリのメール設定は、店舗で切り替えられず、モール共有の手動送信のテンプレートだけを扱う。
 *   「同店舗には…の4件だけ」は成り立たない（共有の一覧）ので、ケースは自分が作ったテンプレートについて確かめる。
 * - 手動送信のテンプレート（A〜C・B-nnn・F・G・連携テンプレート）は、管理画面の新規作成画面（メール設定→新規作成）で作る。
 *   テンプレート名の末尾に実行の印を付ける（例「Bテンプレート-006-<印>」。エビデンスに正本の名前との対応が出る）。ID は画面が振る（正本の ID 1009006 などは使えない）。
 *   メール種別は「固定情報なし」（雛形がヘッダーとフッターだけの本文）。正本の「本文」はヘッダーに入れる（本文ファイルの配置は行えないため、
 *   画面で編集できる本文＝ヘッダー・フッターで表す）。034 は定型文のある雛形が要るので「会員情報から作成(日本語)」、030 は会員への手動メールで選べる
 *   雛形が要るので同じく「会員情報から作成(日本語)」にした。
 *   作ったテンプレートは画面から削除できない作り（削除のボタンが出ない）なので、ケースの終わりに基盤が DB で消す
 *   （lib/shared_restore.ts の registerRestore。lib/db_write.ts の窓口で、テンプレート名に実行の印を含む行だけ。消したあと無いことを確かめる）。
 *   DB へ書けない回（E2E_DB_WRITE が無い）は、後始末ができないので作らずに止まる。
 * - 自動送信のテンプレート（D自動送信テンプレート-nnn）は、画面に新規作成の手段が無いので、M10-08 と同じ作り（db/m10_08_mail.ts）で、正本の ID のまま
 *   E2E の行として DB へ足す（メール識別キーに実行の印。番号が空いていなければ足さない）。足した行は基盤が必ず消す。
 * - 削除済みのテンプレート（E削除済みテンプレート-001・002）は、画面で作ってから DB で消して「存在しない」状態にする（アプリのテンプレートに削除の印は無く、削除は行ごと消える）。
 * - 最終更新日時（2026-08-01 09:00 など）は画面で過去にできないので、作ったテンプレートの行だけ DB で書き換える。最終更新者「試験 太郎」は、
 *   この機能の試験管理者（名前「試験 太郎」）でテンプレートを作ることで入る。「最終更新者と最終更新日時は未設定」は、作った行の最終更新者を DB で外す。
 * - 削除済み担当者（退任 花子-021・035）は、メンバー登録で印つきの管理者を作り、その管理者でテンプレートを保存してから、メンバー管理で削除する
 *   （保持される最終更新者名は、保存したときに記録される）。管理者ID 8009021 などは画面が振るので固定にしない。
 * - 管理者（m1009_admin・m1009l_admin・m1009-0NN-admin）は、権限「システム管理者」・所属/編集可能店舗は本店で作る。名前はシード表の「試験 太郎」
 *   （開発環境にほかにも同じ名前のメンバーがいるので、ログインIDで探す）。
 * - 連携（029・030）: 受注は、印つきの試験会員でフロントから注文して作る（M05-06 と同じ部品）。会員のメール配信履歴は、DB で入れず、
 *   会員への手動メール通知の画面から、連携テンプレート-002 を選び、件名「送信時件名-002」・本文「送信時本文-002」で送って作る（処理日は送った日）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { 管理者ID } from "../db/member";
import { テンプレートを足す, テンプレートを消す as 足した行を消す, テンプレートがあるか as 足した行がある, 使われている番号, 自動送信の既存 } from "../db/m10_08_mail";
import { テンプレートがある, 作ったテンプレートを消す, 手動メールの配信履歴, 更新日時を書く, 更新者を外す, 配信履歴の件名を書く, 配信履歴の件数 } from "../db/m10_09_mail";
import { 受注IDの } from "../db/m05_09";
import { rc, RUN_MARK } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { registerRestore } from "../lib/shared_restore";
import { Account, withAdminSession } from "../lib/session";
import { defineSeed } from "./current_seed";
import { markedMail, 本会員を作る } from "./f06-member";
import { 商品を作って入庫する } from "../pages/admin/f04_setup";
import { 本店の店名 } from "../pages/admin/m05_admin_member";
import { メンバーの編集可能店舗を外す, メンバーを削除する } from "../pages/admin/m05_20_standby";
import { CustomerManualMailPage } from "../pages/admin/m08_08_manual_mail";
import { テンプレートを新規作成する } from "../pages/admin/m10_09_mall_mail";
import { createMember, expectMember, MemberInput } from "../pages/admin/member";
import { 会員が商品を注文する } from "../pages/front/m05_front_order";

export const M1009_ADMIN: Account = { loginId: "m1009_admin", password: "Passw0rd!M1009" };
export const M1009L_ADMIN: Account = { loginId: "m1009l_admin", password: "Passw0rd!M1009L" };
export const M1009_CASE_ADMIN = (n: string): Account => ({ loginId: `m1009-${n}-admin`, password: `Passw0rd-M1009${n}` });
export const 太郎 = "試験 太郎";
const 会員のパスワード = "Passw0rd!M1009C";

/** 管理者をログインIDで探し、あれば内容を確かめて使い、無ければ登録する（名前「試験 太郎」はほかにもいるので名前では探さない） */
async function 管理者を用意する(browser: Browser, account: Account, 名前: string): Promise<string> {
  const shop = await 本店の店名(browser);
  const v: MemberInput = {
    名前, 所属店舗: shop, ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`, パスワード: account.password,
    権限: "システム管理者", デフォルト検索表示店舗: shop, 編集可能店舗: [shop],
  };
  return withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const id = 管理者ID(account.loginId);
    if (id) { await expectMember(page, id, v); return id; }
    return createMember(page, v);
  });
}

const 管理者の注記 = "メール設定を操作できる権限として「システム管理者」で作った（所属・編集可能店舗は本店）。シード表の「店舗コード M10-09-SHOP-nnn を操作できる」は、店舗を作らないので本店にした";
defineSeed("S-M10-09-ADM", async ({ browser, seed }) => { await 管理者を用意する(browser, M1009_ADMIN, 太郎); reportSeedIssue(seed.シードID, 管理者の注記); });
defineSeed("S-M10-09-L-ADM", async ({ browser, seed }) => {
  await 管理者を用意する(browser, M1009L_ADMIN, 太郎);
  reportSeedIssue(seed.シードID, "メール設定・受注管理・会員管理を操作できる権限として「システム管理者」で作った（所属・編集可能店舗は本店）");
});
for (const n of ["033", "034", "035", "036"]) {
  defineSeed(`S-M10-09-ADM-${n}`, async ({ browser, seed }) => { await 管理者を用意する(browser, M1009_CASE_ADMIN(n), 太郎); reportSeedIssue(seed.シードID, 管理者の注記); });
}

// ---- 手動送信のテンプレート（画面で作り、ケースの終わりに DB で消す） ----

type 作る定め = { 名前: string; 件名: string; 本文?: string; ヘッダー?: string; フッター?: string; 種別?: string };
const 固定情報なし = "固定情報なし";
const 会員情報 = "会員情報から作成(日本語)";

/** シードID → 正本の名前 → 画面が振ったテンプレートID */
const 作った = new Map<string, Map<string, string>>();
export function テンプレートIDの(seedId: string, 名前: string): string {
  const id = 作った.get(seedId)?.get(名前);
  if (!id) throw new Error(`${seedId} のテンプレート「${名前}」はまだ作っていない`);
  return id;
}
/** 画面で作るテンプレート名（正本の名前の末尾に実行の印） */
export const 印の名前 = (名前: string): string => rc(名前);

function 後始末ができるか(seedId: string): void {
  if (process.env.E2E_DB_WRITE !== "1") {
    throw new Error(`${seedId}: 画面で作ったメールテンプレートは画面から削除できず、ケースの終わりに DB で消す。DB へ書けない回（E2E_DB_WRITE が無い）は後始末ができないので作らない`);
  }
}

async function 画面で作る(browser: Browser, seedId: string, account: Account, defs: 作る定め[]): Promise<Map<string, string>> {
  後始末ができるか(seedId);
  const ids: string[] = [];
  const map = 作った.get(seedId) ?? new Map<string, string>();
  作った.set(seedId, map);
  registerRestore(
    `M10-09 で画面から作ったメールテンプレート（${seedId}）`,
    { 名前: defs.map((d) => 印の名前(d.名前)) },
    async () => { 作ったテンプレートを消す(`${seedId} の後始末`, ids); },
    async () => !ids.some(テンプレートがある),
  );
  await withAdminSession(browser, account, async (page) => {
    page.setDefaultTimeout(60_000);
    for (const d of defs) {
      const id = await テンプレートを新規作成する(page, d.種別 ?? 固定情報なし, { 名称: 印の名前(d.名前), 件名: d.件名, ヘッダー: d.本文 ?? d.ヘッダー ?? "", フッター: d.フッター ?? "" });
      ids.push(id);
      map.set(d.名前, id);
    }
  });
  reportSeedIssue(seedId,
    `正本のテンプレートを、メール設定の新規作成画面で、テンプレート名に実行の印を付けて作った（ID は画面が振る）: ${defs.map((d) => `「${印の名前(d.名前)}」= ID ${map.get(d.名前)}（メール種別「${d.種別 ?? 固定情報なし}」${d.本文 !== undefined ? `・正本の本文はヘッダーに入れた` : ""}）`).join("、")}。` +
    "本文ファイルの配置は行えない。作ったテンプレートは画面から削除できないので、ケースの終わりに基盤が DB で消す");
  return map;
}

/** 自動送信のテンプレートを、正本の ID のまま E2E の行として DB へ足す（M10-08 と同じ作り）。ケースの終わりに基盤が消す */
function 自動送信を足す(seedId: string, id: number, 名前: string): void {
  後始末ができるか(seedId);
  const 使用 = 使われている番号([id]);
  if (使用.length) throw new Error(`${seedId}: メールテンプレートの番号 ${id} が既に使われているので足さない（既存の行は上書きしない）`);
  const 既存 = 自動送信の既存();
  registerRestore(`M10-09 の自動送信テンプレート ${id}（${seedId}）`, { 足す番号: [id] }, async () => { 足した行を消す(`${seedId} の後始末`, [id]); }, async () => !足した行がある(id));
  テンプレートを足す(seedId, 既存.店舗, [{ id, 名称: 印の名前(名前), 件名: "自動送信更新前件名", 本文上部: "自動送信更新前本文", 雛形: 既存.雛形, 自動送信: true }]);
  const m = 作った.get(seedId) ?? new Map<string, string>();
  m.set(名前, String(id));
  作った.set(seedId, m);
  reportSeedIssue(seedId, `自動送信のテンプレート「${印の名前(名前)}」（ID ${id}）は、画面に新規作成の手段が無いので、M10-08 と同じく E2E の行として DB へ足した（雛形は既存の自動送信メールのもの。正本の本文は本文上部に入れた）。ケースの終わりに基盤が消す`);
}

/** 画面で作ったテンプレートを DB で消して「削除済みで存在しない」状態にする */
async function 作って消す(browser: Browser, seedId: string, 名前: string, 件名: string, 本文: string): Promise<void> {
  const tmp = `${seedId}（削除済みにする）`;
  const m = await 画面で作る(browser, tmp, M1009_ADMIN, [{ 名前, 件名, 本文 }]);
  const id = m.get(名前)!;
  作ったテンプレートを消す(`${seedId}: 削除済みにする`, [id]);
  if (テンプレートがある(id)) throw new Error(`${seedId}: 「${印の名前(名前)}」（ID ${id}）を DB で消したが、まだある`);
  const s = 作った.get(seedId) ?? new Map<string, string>();
  s.set(名前, id);
  作った.set(seedId, s);
  reportSeedIssue(seedId, `「${印の名前(名前)}」を画面で作り（ID ${id}）、DB で消して存在しない状態にした（正本の ID ${名前.includes("001") ? "5009001" : "5009002"} の代わり）`);
}

const B = (n: string): 作る定め => ({ 名前: `Bテンプレート-${n}`, 件名: "B更新前件名", 本文: "B更新前本文" });
const ABC = (n: string): 作る定め[] => [
  { 名前: `Aテンプレート-${n}`, 件名: "A更新前件名", 本文: "A更新前本文" },
  B(n),
  { 名前: `Cテンプレート-${n}`, 件名: "C更新前件名", 本文: "C更新前本文" },
];

defineSeed("S-M10-09-CHOICES-001", { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => {
  await 画面で作る(browser, seed.シードID, M1009_ADMIN, ABC("001"));
  自動送信を足す(seed.シードID, 4009001, "D自動送信テンプレート-001");
  await 作って消す(browser, seed.シードID, "E削除済みテンプレート-001", "E更新前件名", "E更新前本文");
});
defineSeed("S-M10-09-DELETED-002", { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => {
  await 画面で作る(browser, seed.シードID, M1009_ADMIN, [B("002")]);
  await 作って消す(browser, seed.シードID, "E削除済みテンプレート-002", "E更新前件名", "E更新前本文");
});
defineSeed("S-M10-09-SWITCH-004", { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => {
  await 画面で作る(browser, seed.シードID, M1009_ADMIN, [{ 名前: "Aテンプレート-004", 件名: "A更新前件名", 本文: "A更新前本文" }]);
});
defineSeed("S-M10-09-AUTO-005", { needs: ["S-M10-09-ADM"] }, async ({ seed }) => { 自動送信を足す(seed.シードID, 4009005, "D自動送信テンプレート-005"); });
defineSeed("S-M10-09-AUTO-033", { needs: ["S-M10-09-ADM-033"] }, async ({ seed }) => { 自動送信を足す(seed.シードID, 4009033, "D自動送信テンプレート-033"); });

for (const n of ["006", "009", "011", "013", "016", "018", "019", "024", "025"]) {
  defineSeed(`S-M10-09-BASE-${n}`, { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => { await 画面で作る(browser, seed.シードID, M1009_ADMIN, [B(n)]); });
}
defineSeed("S-M10-09-NOTFOUND-007", { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => {
  await 画面で作る(browser, seed.シードID, M1009_ADMIN, [B("007")]);
  if (テンプレートがある(999999)) throw new Error(`${seed.シードID}: メールテンプレートID 999999 が開発環境にある（正本は存在しない）。ほかの方の行なので消さない`);
  reportSeedIssue(seed.シードID, "メールテンプレートID 999999 が無いことを DB の参照で確かめた（消す操作はしていない）");
});
for (const n of ["008", "010", "023"]) {
  defineSeed(`S-M10-09-BASE-${n}`, { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => {
    const id = (await 画面で作る(browser, seed.シードID, M1009_ADMIN, [B(n)])).get(`Bテンプレート-${n}`)!;
    更新日時を書く(seed.シードID, id, "2026-08-01 09:00:00+09");
    reportSeedIssue(seed.シードID, `最終更新者「試験 太郎」は試験管理者で作って入れた。最終更新日時は DB で 2026-08-01 09:00（日本時間）に書き換えた（E2E が作った行だけ）`);
  });
}
defineSeed("S-M10-09-COUNT-015", { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => {
  await 画面で作る(browser, seed.シードID, M1009_ADMIN, [B("015")]);
  reportSeedIssue(seed.シードID, "「店舗のメールテンプレートは1件だけ」は成り立たない（店舗ごとに分かれないモール共有の一覧）。ケースは、メールテンプレートの全件数を登録の前後で比べる");
});
defineSeed("S-M10-09-HISTORY-020", { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => {
  const id = (await 画面で作る(browser, seed.シードID, M1009_ADMIN, [B("020")])).get("Bテンプレート-020")!;
  更新日時を書く(seed.シードID, id, "2026-08-01 09:00:00+09");
  reportSeedIssue(seed.シードID, "最終更新者「試験 太郎」は試験管理者で作って入れた。最終更新日時は DB で 2026-08-01 09:00（日本時間）に書き換えた（E2E が作った行だけ）");
});
for (const n of ["022", "036"]) {
  defineSeed(`S-M10-09-NOHIST-${n}`, { needs: [n === "022" ? "S-M10-09-ADM" : "S-M10-09-ADM-036"] }, async ({ browser, seed }) => {
    const 名前 = `G履歴なしテンプレート-${n}`;
    const id = (await 画面で作る(browser, seed.シードID, n === "022" ? M1009_ADMIN : M1009_CASE_ADMIN(n), [{ 名前, 件名: "履歴なし件名", 本文: "履歴なし本文" }])).get(名前)!;
    更新者を外す(seed.シードID, id);
    reportSeedIssue(seed.シードID, "画面で保存すると最終更新者が必ず入るので、作った行の最終更新者（と記録された名前）を DB で外して未設定にした（E2E が作った行だけ）");
  });
}

/** 印つきの管理者を作り、その管理者でテンプレートを作ってから、メンバー管理で削除する */
async function 退任した担当者で作る(browser: Browser, seedId: string, n: string, 定め: 作る定め): Promise<{ id: string; 名前: string }> {
  const 名前 = rc(`退任 花子-${n}`);
  const account: Account = { loginId: `m1009-former${n}-${RUN_MARK.toLowerCase()}`, password: `Passw0rd!Former${n}` };
  const 管理者 = await 管理者を用意する(browser, account, 名前);
  const id = (await 画面で作る(browser, seedId, account, [定め])).get(定め.名前)!;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    // 編集可能店舗のあるメンバーはアプリが削除できない（pages/admin/m05_20_standby.ts の メンバーの編集可能店舗を外す）ので、先に外す
    await メンバーの編集可能店舗を外す(page, 管理者);
    await メンバーを削除する(page, 管理者);
  });
  if (管理者ID(account.loginId)) throw new Error(`${seedId}: 管理者「${名前}」（管理者ID ${管理者}）をメンバー管理で削除したが、まだいる`);
  更新日時を書く(seedId, id, "2026-07-15 14:30:00+09");
  reportSeedIssue(seedId, `削除済み担当者は、印つきの管理者「${名前}」（管理者ID ${管理者}。正本の 80090${n.slice(1)} の代わり）をメンバー登録で作り、その管理者でテンプレートを作ってから、メンバー管理で削除した（編集可能店舗のあるメンバーはアプリが「関連するデータがあるため…削除できませんでした」で削除できないため、削除の前にメンバー編集で編集可能店舗を外した。アプリの不具合の候補）。最終更新日時は DB で 2026-07-15 14:30（日本時間）に書き換えた（E2E が作った行だけ）`);
  return { id, 名前 };
}
defineSeed("S-M10-09-HIST-DELETED-021", async ({ browser, seed }) => {
  await 退任した担当者で作る(browser, seed.シードID, "021", { 名前: "F履歴テンプレート-021", 件名: "履歴確認件名", 本文: "履歴確認本文" });
});
defineSeed("S-M10-09-BASE-035", { needs: ["S-M10-09-ADM-035"] }, async ({ browser, seed }) => {
  await 退任した担当者で作る(browser, seed.シードID, "035", B("035"));
});
defineSeed("S-M10-09-BASE-034", { needs: ["S-M10-09-ADM-034"] }, async ({ browser, seed }) => {
  await 画面で作る(browser, seed.シードID, M1009_CASE_ADMIN("034"), [{ 名前: "Bテンプレート-034", 件名: "B更新前件名", ヘッダー: "更新前ヘッダー-034", フッター: "更新前フッター-034", 種別: 会員情報 }]);
  reportSeedIssue(seed.シードID, "正本の定型文「定型文-M1009-034」は本文ファイルの配置が要り、作れない。定型文のある雛形（メール種別「会員情報から作成(日本語)」）を使い、その雛形の定型文で確かめる");
});
for (const n of ["026", "027", "028"]) {
  defineSeed(`S-M10-09-LIST-${n}`, { needs: ["S-M10-09-ADM"] }, async ({ browser, seed }) => {
    await 画面で作る(browser, seed.シードID, M1009_ADMIN, ABC(n));
    自動送信を足す(seed.シードID, Number(`4009${n}`), `D自動送信テンプレート-${n}`);
  });
}

// ---- 連携（029・030） ----

defineSeed("S-M10-09-L-TPL-029", { needs: ["S-M10-09-L-ADM"] }, async ({ browser, seed }) => {
  await 画面で作る(browser, seed.シードID, M1009L_ADMIN, [{ 名前: "連携テンプレート-001", 件名: "連携更新前件名-001", 本文: "連携更新前本文-001" }]);
});
defineSeed("S-M10-09-L-TPL-030", { needs: ["S-M10-09-L-ADM"] }, async ({ browser, seed }) => {
  await 画面で作る(browser, seed.シードID, M1009L_ADMIN, [{ 名前: "連携テンプレート-002", 件名: "連携更新前件名-002", 本文: "連携更新前本文-002", 種別: 会員情報 }]);
  reportSeedIssue(seed.シードID, "会員への手動メール通知で選べるのは会員情報の雛形のテンプレートだけなので、メール種別「会員情報から作成(日本語)」で作った");
});

let 連携の商品: string | null = null;
defineSeed("S-M10-09-L-ORD-029", { needs: ["S-M10-09-L-ADM"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  if (!連携の商品) {
    const made = await 商品を作って入庫する(browser, id, [{ 商品コード: rc("M1009-LINK-ITEM"), 商品名: rc("M10-09連携試験商品"), 価格: "1000", 入庫数: 20 }], (m) => reportSeedIssue(id, m));
    連携の商品 = made[0].productId;
  }
  const 前半 = "link-m1009-001";
  const メール = markedMail(前半);
  const 会員ID = await 本会員を作る(browser, { 姓: "連携", 名: "太郎", セイ: "レンケイ", メイ: "タロウ", 前半, パスワード: 会員のパスワード });
  const 注文番号 = await 会員が商品を注文する(browser, { メール, パスワード: 会員のパスワード }, [{ 商品ID: 連携の商品, 数量: 1 }], `${id}: 連携 太郎の受注`);
  notes.set("〔会員レコードID-M1009-029〕", 会員ID);
  notes.set("〔注文番号-M1009-029〕", 注文番号);
  notes.set("〔受注レコードID-M1009-029〕", 受注IDの(注文番号, メール));
  reportSeedIssue(id, `印つきの会員（${メール}）をフロントの会員登録で作り、印つきの試験商品（商品ID ${連携の商品}）を1点注文した。受注日時（2026-09-01 10:00）は書き換えていない（ケースは使わない）。購入完了のときに送られるメールの送信履歴は消していない（ケースはテンプレートの選択だけを見る）`);
});

defineSeed("S-M10-09-L-MEM-030", { needs: ["S-M10-09-L-ADM", "S-M10-09-L-TPL-030"] }, async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  const 前半 = "link-m1009-002";
  const 会員ID = await 本会員を作る(browser, { 姓: "連携", 名: "花子-002", セイ: "レンケイ", メイ: "ハナコ", 前半, パスワード: 会員のパスワード });
  notes.set("〔会員ID-M1009-030〕", 会員ID);
  const tpl = テンプレートIDの("S-M10-09-L-TPL-030", "連携テンプレート-002");
  await withAdminSession(browser, M1009L_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    const m = new CustomerManualMailPage(page);
    await m.入力画面を開く(会員ID);
    await m.テンプレを選ぶ(tpl);
    await m.件名を入れる("送信時件名-002");
    await m.本文を入れる("送信時本文-002");
    const st = await m.確認を押す();
    if (!(await m.確認画面か())) throw new Error(`${id}: 手動メール通知の確認画面へ移らない（応答 ${st}。お知らせ: ${(await m.お知らせ()).join(" / ")}）`);
    await m.送信を押す();
  });
  // アプリは手動メールの履歴の件名を「[店名] 送信時件名-002」で残す（2026-11-13 の IT-M10-09-030 は完全一致で数えて 0 件で止まっていた）。
  // シード表は送信時の件名「送信時件名-002」の履歴を DB で入れると定めるので、送って作った履歴の件名を、その値に DB で直す（E2E の会員の行だけ）
  const 送った = 手動メールの配信履歴(会員ID, tpl, "送信時件名-002");
  if (送った.length !== 1) throw new Error(`${id}: 会員 ${会員ID} への「送信時件名-002」の配信履歴が ${送った.length} 件（1件のはず。件名: ${送った.map((r) => r.件名).join(" / ") || "なし"}）`);
  const 送った件名 = 送った[0].件名;
  if (送った件名 !== "送信時件名-002") 配信履歴の件名を書く(`${id}: 送って作った配信履歴の件名をシード表の値にする`, 送った[0].id, "送信時件名-002");
  const n = 配信履歴の件数(会員ID, tpl, "送信時件名-002");
  if (n !== 1) throw new Error(`${id}: 会員 ${会員ID} への「送信時件名-002」の配信履歴が ${n} 件（1件のはず）`);
  reportSeedIssue(id, `印つきの会員（${markedMail(前半)}）をフロントの会員登録で作り、メール配信履歴は DB で入れず、会員への手動メール通知の画面から「${印の名前("連携テンプレート-002")}」を選んで件名「送信時件名-002」・本文「送信時本文-002」で送って作った（処理日は送った日。正本の 2026/09/03 ではない）。` +
    (送った件名 !== "送信時件名-002" ? `アプリは履歴の件名を「${送った件名}」で残すため、シード表の送信時の件名「送信時件名-002」に DB で直した（配信履歴ID ${送った[0].id}）。` : "") + "送ったメールは開発環境のメールの受け口に届く");
});
