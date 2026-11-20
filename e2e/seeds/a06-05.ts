/**
 * A06-05 店頭買取受注ステータス更新（MTGBuyer の API）のシードの作り方（画面操作）。
 * 値はシード表（integration_test/casegen/cases/A06-05_seed_data.tsv）の状態・属性と投入方法のとおり。
 *
 * シードでの解釈（正本の外の補い）:
 * - S-A06-05-ENV・S-A06-05-AB-ENV（送信元IPの許可・API と DB 確認の用意・署名方式）: 全員が使う環境の設定。書き換えず、この端末から API サーバーへ
 *   要求が届くことと、環境に設定済みの署名の値を使う（シード表の≪共有の設定≫）。MTGBuyer は使わず、API へ直接送る。
 * - 店舗ID 1・「A06-05 AB試験店舗」は、試験店舗の使い回し（依頼者決定 2026-11-13）で作らず、試験支店に読み替える（A06-04 と同じ）。
 * - S-A06-05-STATUSES・S-A06-05-AB-STATUSES（店頭買取ステータスの固定マスタ）は、DB へ投入・更新せず、記載のIDと名称であることだけを確かめる。
 * - 管理者は、実行をまたいで使い回す決まった印（rcFixed）を名前・ログインIDに付けて1度だけ作る（依頼者決定 2026-11-11）。メールアドレスは example.test。
 *   パスワードは開発環境のメンバー登録の決まり（12文字以上）に合わせる。権限グループ「システム権限」は開発環境に無いので「システム管理者」で読み替える。
 * - 店頭買取の受注は、試験支店のフロントの店頭買取査定申込（会員登録なし）で作り、受注IDは DB で査定IDから読む。申込者の姓には実行の印を付ける
 *   （画面で指定できない値を、E2E の受注の行にだけ DB で書くため。lib/db_write.ts）。電話番号・住所などは共通の申込の部品の固定の値。
 * - 現在ステータスは、シード表のとおり、査定担当の管理者（S-A06-05-ADM）で買取詳細のステータス変更画面から変える。「買取成立」だけは、シード表のとおり
 *   DB で書く（画面で選ぶと続けて未登録在庫ありか入庫待ちへ進むため）。査定担当者もシード表のとおり DB で書く。
 * - 更新日時 T0（2026-09-03 10:00:00）は入れない。「ステータス変更履歴を DB で削除して0件にする」もしない（行を消さない）。ケースは、シードを作り終えた
 *   ときの受注と履歴を手順1の前に控え、その値と比べる（spec の注記）。
 * - 金額900円は、受注の金額の欄に DB で書く。税・ポイント・在庫数量は店頭買取の受注の欄に無い（明細と在庫の関連付けが要る）ので、入れていない。
 * - S-A06-05-NOORDER・NOSTATUS・NOAUTH-ORDERSTATUS-027・NOORDER-NOSTATUS-028 は「DB で消して0件を確かめる」作り方。消さずに、0件であることだけを確かめる。
 * - S-A06-05-GHOST-TOKEN-014・015 は管理者を削除する作り方（依頼者決定 2026-11-17 で流さない）。作り方を書いていない（014・015 も書いていない）。
 * - 会員（S-A06-05-AB-ORDER-033・034）は、管理画面の会員登録編集画面の代わりに、本店のフロントの会員登録＋管理画面で本会員にする部品で作る
 *   （pages/admin/member_activate.ts）。メールアドレスには実行の印を付ける。
 */
import { Browser } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../config/env";
import { 申込のマスタにある, 査定IDの受注ID, 店頭買取の受注がある, 店頭買取ステータスの名称 } from "../db/a06";
import { 受注に書く, 受注の今, 店頭買取ステータスがある } from "../db/a06_05";
import { rc, rcFixed } from "../lib/run_marker";
import { defineSeed, reportSeedIssue, SeedBuilder } from "../lib/seeds";
import { Account, hideDebugToolbar, withAdminSession } from "../lib/session";
import { ensureMemberFixed } from "../pages/admin/member";
import { 会員を登録して本会員にする } from "../pages/admin/member_activate";
import { OtcStatusChangePage } from "../pages/admin/m06_04_status";
import { 試験支店 } from "../pages/admin/reuse_store";
import { 店舗読み替えの注記, 試験支店ID, 試験店舗の名前を読む } from "../pages/admin/test_store";
import { フロントにログインする } from "../pages/front/login_without_top";
import { applyAsMember, PurchaseHistoryPage } from "../pages/front/m06_otc_buy";
import { 申込を行う, 申込者の } from "./m06-common";

type 管理者 = Account & { 名前: string; メール: string };
const 管理者の = (ログインID: string, パスワード: string, 名前: string): 管理者 => {
  const loginId = rcFixed(ログインID).toLowerCase();
  const password = パスワード.length < 12 ? `${パスワード}${"X".repeat(12 - パスワード.length)}` : パスワード;
  return { loginId, password, 名前: rcFixed(名前), メール: `${loginId}@example.test` };
};
/** S-A06-05-ADM（有効なトークンを受け取り、更新する管理者） */
export const A0605_ADM = 管理者の("a0605adm", "Passw0rd-A0605", "A06-05試験管理者");
/** S-A06-05-OTHER-ADM（更新前の査定担当者・本人以外の判定に使う管理者） */
export const A0605_OTHER = 管理者の("a0605other", "Passw0rd-A0605O", "他査定担当管理者");
/** S-A06-05-AB-ADM（管理画面と API の両方を使う管理者） */
export const A0605_AB_ADM = 管理者の("a0605abadm", "Passw0rd-A0605AB", "A06-05 AB試験担当");

/** S-A06-05-AB-ORDER-033・034 の会員（メールアドレスに実行の印） */
export const A0605_会員 = (n: "003" | "004") => ({ メール: `${rc(`a0605ab-${n}`).toLowerCase()}@example.test`, パスワード: `Passw0rd-A0605AB-${n}` });

/** 店頭買取ステータスの名称（シード表の記載） */
export const ステータス名: Record<string, string> = {
  "1": "買取成立", "2": "買取キャンセル", "5": "査定前", "6": "査定中", "8": "査定中断", "9": "査定再開",
  "10": "経理払い出し待ち", "11": "入庫済み", "12": "未登録在庫あり", "13": "入庫待ち", "14": "管理者取消",
};

let 店名の控え = "";
async function 試験支店の店名(page: Parameters<Parameters<typeof withAdminSession>[2]>[0]): Promise<string> {
  if (!店名の控え) 店名の控え = (await 試験店舗の名前を読む(page)).試験支店;
  return 店名の控え;
}

const 環境のシード: SeedBuilder = async ({ seed }) => {
  reportSeedIssue(seed.シードID, "送信元IPの許可・API の認証の署名方式と秘密の値は、全員が使う環境の設定。書き換えず、この端末から API サーバーへ要求が届くことと、環境に設定済みの値を使う。MTGBuyer は使わず、API へ直接送る");
};
defineSeed("S-A06-05-ENV", 環境のシード);
defineSeed("S-A06-05-AB-ENV", 環境のシード);

const ステータスのシード: SeedBuilder = async ({ seed }) => {
  const 違う = Object.entries(ステータス名).map(([id, 名]) => [id, 名, 店頭買取ステータスの名称(id)] as const).filter(([, 名, 今]) => 今 !== 名);
  if (違う.length) throw new Error(`${seed.シードID}: 店頭買取ステータスのマスタがシード表と違う（共有のマスタは書き換えない）: ${違う.map(([id, 名, 今]) => `ID ${id} はシード表「${名}」・DB「${今 ?? "無い"}」`).join("／")}`);
  reportSeedIssue(seed.シードID, "店頭買取ステータスは画面で作れない固定マスタ。DB へ投入・更新せず、記載のIDと名称であることを DB で確かめた");
};
defineSeed("S-A06-05-STATUSES", ステータスのシード);
defineSeed("S-A06-05-AB-STATUSES", ステータスのシード);

defineSeed("S-A06-05-AB-STORE", async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    reportSeedIssue(seed.シードID, 店舗読み替えの注記("A06-05 AB試験店舗", await 試験支店の店名(page), 試験支店ID));
  });
  notes.set("〔店舗ID-A0605AB-共有〕", 試験支店ID);
});

/** 管理者を（無ければ）メンバー登録画面で登録し、管理者IDを控える。所属店舗・デフォルト検索表示店舗・編集可能店舗は試験支店 */
const 管理者のシード = (a: 管理者, 呼び名: string): SeedBuilder => async ({ browser, notes, seed }) => {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const 店名 = await 試験支店の店名(page);
    reportSeedIssue(seed.シードID, 店舗読み替えの注記("店舗ID 1 の店舗・A06-05 AB試験店舗", 店名, 試験支店ID));
    notes.set(呼び名, await ensureMemberFixed(page, {
      名前: a.名前, 所属店舗: 店名, ログインID: a.loginId, メールアドレス: a.メール, パスワード: a.password,
      権限: "システム管理者", デフォルト検索表示店舗: 店名, 編集可能店舗: [店名],
    }, (m) => reportSeedIssue(seed.シードID, m)));
  });
  reportSeedIssue(seed.シードID, "管理者の名前・ログインIDは決まった印つき（1度だけ作って使い回す）、メールアドレスは example.test、パスワードは12文字以上の値。所属は選択肢の先頭、権限グループは「システム管理者」（シード表の「任意の選択肢」「システム権限」の読み替え。全員が使う権限グループは足さない）、デフォルト検索表示店舗・編集可能店舗は試験支店");
};
defineSeed("S-A06-05-ADM", 管理者のシード(A0605_ADM, "〔管理者ID-A0605-共有ADM〕"));
defineSeed("S-A06-05-OTHER-ADM", 管理者のシード(A0605_OTHER, "〔管理者ID-A0605-共有OTHER-ADM〕"));
defineSeed("S-A06-05-AB-ADM", { needs: ["S-A06-05-AB-STORE"] }, 管理者のシード(A0605_AB_ADM, "〔管理者ID-A0605AB-共有〕"));

/** 作る受注1件の中身 */
type 受注の作り = { 名: string; 呼び名: string; ステータスID: string; 担当: "ADM" | "OTHER"; 金額?: number };

/**
 * 試験支店のフロントで会員登録なしの店頭買取査定申込を、受注の数だけ行い（申込者の姓に実行の印）、受注IDを控える。
 * 現在ステータスは査定担当の管理者（S-A06-05-ADM）でステータス変更画面から変え（買取成立だけ DB）、査定担当者・金額を DB で書く
 */
async function 受注を作る(ctx: Parameters<SeedBuilder>[0], 作り: 受注の作り[]): Promise<void> {
  const { browser, notes, seed } = ctx;
  const 姓 = rc("前提");
  const 査定IDs = await 申込を行う(browser, 試験支店.支店URL, 作り.map((x) => 申込者の(姓, x.名, "ゼンテイ", "ジュチュウ")));
  const 受注IDs = 査定IDs.map((q, i) => {
    const id = 査定IDの受注ID(q);
    if (!id) throw new Error(`${seed.シードID}: 申込んだ査定ID ${q}（${作り[i].名}）の店頭買取の受注が DB に無い`);
    return id;
  });
  const 画面で変える = 作り.map((x, i) => ({ x, id: 受注IDs[i] })).filter(({ x }) => !["5", "1"].includes(x.ステータスID));
  if (画面で変える.length) {
    await withAdminSession(browser, A0605_ADM, async (page) => {
      const s = new OtcStatusChangePage(page);
      for (const { x, id } of 画面で変える) {
        const 名 = ステータス名[x.ステータスID];
        expect200(await s.open(id), `${seed.シードID}: 受注 ${id} のステータス変更画面`);
        await s.選ぶ(名);
        const r = await s.保存を押す();
        if (!r.sent) throw new Error(`${seed.シードID}: 受注 ${id} のステータス変更の「保存」が送られない（${r.止めた理由}）`);
        const 今 = 受注の今(id);
        if (今?.ステータスID !== x.ステータスID) throw new Error(`${seed.シードID}: 受注 ${id} をステータス変更画面で「${名}」にしたが、DB のステータスが ${今?.ステータスID}`);
      }
    });
  }
  for (const [i, x] of 作り.entries()) {
    const id = 受注IDs[i];
    const 担当ID = notes.get(x.担当 === "ADM" ? "〔管理者ID-A0605-共有ADM〕" : "〔管理者ID-A0605-共有OTHER-ADM〕");
    受注に書く(id, 姓, { 査定担当者ID: 担当ID, ステータスID: x.ステータスID === "1" ? "1" : undefined, 金額: x.金額 });
    const 今 = 受注の今(id);
    if (今?.ステータスID !== x.ステータスID || 今?.査定担当者ID !== 担当ID) throw new Error(`${seed.シードID}: 受注 ${id} のステータス ${今?.ステータスID}・査定担当者 ${今?.査定担当者ID}（求めるのは ${x.ステータスID}・${担当ID}）`);
    notes.set(x.呼び名, id);
  }
  reportSeedIssue(seed.シードID, `試験支店のフロントで${作り.length}件申込んだ（申込者の姓「${姓}」・名は${作り.map((x) => `「${x.名}」`).join("")}。受注ID ${受注IDs.join("・")}）。` +
    `ステータスは${作り.map((x) => ステータス名[x.ステータスID]).join("・")}（査定前以外は管理者「${A0605_ADM.名前}」でステータス変更画面から変えた。買取成立だけ DB）、査定担当者は DB で書いた。` +
    "更新日時T0は入れず、申込み・ステータス変更で登録されたステータス変更履歴は消していない（ケースは手順1の前の値と比べる）");
}
function expect200(状態: number, 何: string): void { if (状態 >= 400) throw new Error(`${何}が HTTP ${状態}`); }

const 受注の前提 = { needs: ["S-A06-05-STATUSES", "S-A06-05-ADM", "S-A06-05-OTHER-ADM"] };
const 受注のシード = (作り: 受注の作り[], 補い?: string): SeedBuilder => async (ctx) => {
  if (!申込のマスタにある("職業", "会社員")) throw new Error(`${ctx.seed.シードID}: 職業のマスタに「会社員」が無い（書き換えずに使う前提を満たせない）`);
  await 受注を作る(ctx, 作り);
  if (補い) reportSeedIssue(ctx.seed.シードID, 補い);
};
const 金額の補い = "金額900円は受注の金額の欄に DB で書いた。税90円・ポイント90・在庫数量9は店頭買取の受注の欄に無い（明細と在庫の関連付けが要る）ので入れていない";

defineSeed("S-A06-05-BASE", 受注の前提, 受注のシード([{ 名: "受注BASE", 呼び名: "〔受注ID-A0605-共有BASE〕", ステータスID: "5", 担当: "OTHER", 金額: 900 }], 金額の補い));
defineSeed("S-A06-05-ORDER-001", 受注の前提, 受注のシード([{ 名: "受注001", 呼び名: "〔受注ID-A0605-001〕", ステータスID: "5", 担当: "OTHER" }]));
defineSeed("S-A06-05-ORDER-005", 受注の前提, 受注のシード([{ 名: "受注005", 呼び名: "〔受注ID-A0605-005〕", ステータスID: "5", 担当: "OTHER", 金額: 900 }], 金額の補い));
defineSeed("S-A06-05-SAME", 受注の前提, 受注のシード([
  { 名: "受注SAMEA", 呼び名: "〔受注ID-A0605-共有SAME-A〕", ステータスID: "6", 担当: "ADM" },
  { 名: "受注SAMEB", 呼び名: "〔受注ID-A0605-共有SAME-B〕", ステータスID: "8", 担当: "ADM" },
  { 名: "受注SAMEC", 呼び名: "〔受注ID-A0605-共有SAME-C〕", ステータスID: "9", 担当: "ADM" },
]));
defineSeed("S-A06-05-DISALLOWED-TARGETS", 受注の前提, 受注のシード(["A", "B", "C", "D", "E", "F", "G", "H"].map((k) => (
  { 名: `受注TARGETS${k}`, 呼び名: `〔受注ID-A0605-共有TARGETS-${k}〕`, ステータスID: "6", 担当: "ADM" as const }))));
defineSeed("S-A06-05-DISALLOWED-SOURCES", 受注の前提, 受注のシード([["A", "1"], ["B", "2"], ["C", "10"], ["D", "11"], ["E", "12"], ["F", "13"], ["G", "14"]].map(([k, s]) => (
  { 名: `受注SOURCES${k}`, 呼び名: `〔受注ID-A0605-共有SOURCES-${k}〕`, ステータスID: s, 担当: "ADM" as const }))));
defineSeed("S-A06-05-OTHER-ASSESSOR", 受注の前提, 受注のシード([["A", "9"], ["B", "6"], ["C", "9"], ["D", "6"]].map(([k, s]) => (
  { 名: `受注ASSESSOR${k}`, 呼び名: `〔受注ID-A0605-共有ASSESSOR-${k}〕`, ステータスID: s, 担当: "OTHER" as const }))));
defineSeed("S-A06-05-ALLOWED-002", 受注の前提, 受注のシード([["A", "5"], ["B", "5"], ["C", "5"], ["D", "6"], ["E", "6"], ["F", "8"], ["G", "8"], ["H", "9"], ["I", "9"]].map(([k, s]) => (
  { 名: `受注002${k}`, 呼び名: `〔受注ID-A0605-002${k}〕`, ステータスID: s, 担当: "ADM" as const }))));
defineSeed("S-A06-05-REPEAT-029", 受注の前提, 受注のシード([{ 名: "受注029", 呼び名: "〔受注ID-A0605-029〕", ステータスID: "5", 担当: "OTHER" }]));
defineSeed("S-A06-05-CHAIN-030", 受注の前提, 受注のシード([{ 名: "受注030", 呼び名: "〔受注ID-A0605-030〕", ステータスID: "5", 担当: "OTHER" }]));
defineSeed("S-A06-05-CBSAMEOTHER-035", 受注の前提, 受注のシード([{ 名: "受注A0605CB035", 呼び名: "〔受注ID-A0605-035〕", ステータスID: "8", 担当: "OTHER" }]));
defineSeed("S-A06-05-CBENDTOOPEN-036", 受注の前提, 受注のシード([{ 名: "受注A0605CB036", 呼び名: "〔受注ID-A0605-036〕", ステータスID: "1", 担当: "OTHER" }]));
defineSeed("S-A06-05-CBENDTORESUME-037", 受注の前提, 受注のシード([{ 名: "受注A0605CB037", 呼び名: "〔受注ID-A0605-037〕", ステータスID: "10", 担当: "OTHER" }]));
defineSeed("S-A06-05-CBENDTODENY-038", 受注の前提, 受注のシード([{ 名: "受注A0605CB038", 呼び名: "〔受注ID-A0605-038〕", ステータスID: "11", 担当: "OTHER" }]));

/** 無い受注・無いステータスの前提（消さずに、0件であることだけを確かめる） */
const 無いもののシード = (受注IDs: string[], ステータスIDs: string[]): SeedBuilder => async ({ seed }) => {
  for (const id of 受注IDs) if (店頭買取の受注がある(id)) throw new Error(`${seed.シードID}: 受注ID ${id} の店頭買取の受注がある（0件の前提を満たせない。消さない）`);
  for (const id of ステータスIDs) if (店頭買取ステータスがある(id)) throw new Error(`${seed.シードID}: 店頭買取ステータス ID ${id} がある（0件の前提を満たせない。消さない）`);
  reportSeedIssue(seed.シードID, `シード表の「DB で消して不存在を確かめる」は、消さずに0件であることだけを確かめた（${[...受注IDs.map((x) => `受注ID ${x}`), ...ステータスIDs.map((x) => `ステータスID ${x}`)].join("・")}）`);
};
defineSeed("S-A06-05-NOORDER", 無いもののシード(["699999"], []));
defineSeed("S-A06-05-NOSTATUS", 無いもののシード([], ["699999"]));
defineSeed("S-A06-05-NOAUTH-ORDERSTATUS-027", 無いもののシード(["699027"], ["699027"]));
defineSeed("S-A06-05-NOORDER-NOSTATUS-028", 無いもののシード(["699028"], ["699028"]));

/** AB: 試験支店のフロントで会員登録なしの申込をし、査定ID・受注IDを控える（ステータスは査定前のまま） */
const AB申込のシード = (n: "001" | "002"): SeedBuilder => async ({ browser, notes, seed }) => {
  const [査定ID] = await 申込を行う(browser, 試験支店.支店URL, [申込者の("A06-05", `査定${n}`, "ゼンテイ", "ジュチュウ")]);
  const 受注ID = 査定IDの受注ID(査定ID);
  if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
  if (受注の今(受注ID)?.ステータスID !== "5") throw new Error(`${seed.シードID}: 受注 ${受注ID} のステータスが査定前でない`);
  notes.set(`〔査定ID-A0605AB-${n}〕`, 査定ID);
  notes.set(`〔受注ID-A0605AB-${n}〕`, 受注ID);
  reportSeedIssue(seed.シードID, `店舗「A06-05 AB試験店舗」は試験支店に読み替えて、そのフロントで申込んだ（査定ID ${査定ID}・受注ID ${受注ID}）。電話番号・住所などは共通の申込の部品の固定の値`);
};
defineSeed("S-A06-05-AB-ORDER-031", { needs: ["S-A06-05-AB-STORE", "S-A06-05-AB-STATUSES"] }, AB申込のシード("001"));
defineSeed("S-A06-05-AB-ORDER-032", { needs: ["S-A06-05-AB-STORE", "S-A06-05-AB-STATUSES"] }, AB申込のシード("002"));

/** 会員でログインして試験支店の店頭買取を1件申込み、完了画面の査定番号を返す */
async function 会員で申込む(browser: Browser, 会員: { メール: string; パスワード: string }, 名: string): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    return await applyAsMember(page, 試験支店.支店URL, 会員, 申込者の("A06-05", 名, "ゼンテイ", "ジュチュウ"));
  } finally { await context.close(); }
}

/** 会員でログインして買取履歴一覧を開き、査定番号が末尾に付く買取番号（日付-店舗ID-連番の形）を読む */
async function 買取番号を読む(browser: Browser, 会員: { メール: string; パスワード: string }, 査定番号: string): Promise<string> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(context);
    const page = await context.newPage();
    page.setDefaultTimeout(60_000);
    await フロントにログインする(page, 会員);
    const h = new PurchaseHistoryPage(page);
    await h.openList();
    const 一覧 = (await page.locator(".p-hareruya-history-list__box a.c-hareruya-link").allInnerTexts()).map((t) => t.trim());
    const hit = 一覧.filter((t) => t === 査定番号 || t.endsWith(`-${査定番号}`));
    if (hit.length !== 1) throw new Error(`査定番号 ${査定番号} に当たる買取履歴一覧の買取番号が1件に定まらない（${hit.join(", ") || "無い"}）`);
    return hit[0];
  } finally { await context.close(); }
}

const AB会員のシード = (n: "003" | "004"): SeedBuilder => async ({ browser, notes, seed }) => {
  const 会員 = A0605_会員(n);
  const 会員ID = await 会員を登録して本会員にする(browser, { 姓: "A06-05", 名: `会員${n}`, セイ: "シケン", メイ: "カイイン", メール: 会員.メール, パスワード: 会員.パスワード },
    (m) => reportSeedIssue(seed.シードID, m));
  const 査定ID = await 会員で申込む(browser, 会員, `会員${n}`);
  const 受注ID = 査定IDの受注ID(査定ID);
  if (!受注ID) throw new Error(`${seed.シードID}: 申込んだ査定ID ${査定ID} の店頭買取の受注が DB に無い`);
  const 買取番号 = await 買取番号を読む(browser, 会員, 査定ID);
  notes.set(`〔会員ID-A0605AB-${n}〕`, 会員ID);
  notes.set(`〔査定ID-A0605AB-${n}〕`, 査定ID);
  notes.set(`〔受注ID-A0605AB-${n}〕`, 受注ID);
  notes.set(`〔買取番号-A0605AB-${n}〕`, 買取番号);
  reportSeedIssue(seed.シードID, `会員は、管理画面の会員登録編集画面の代わりに、フロントの会員登録＋管理画面で本会員にする部品で作った（メールアドレスに実行の印: ${会員.メール}）。` +
    `店舗「A06-05 AB試験店舗」は試験支店に読み替え、会員でログインして申込んだ（査定ID ${査定ID}・受注ID ${受注ID}・買取番号 ${買取番号}）`);
};
defineSeed("S-A06-05-AB-ORDER-033", { needs: ["S-A06-05-AB-STORE", "S-A06-05-AB-STATUSES"] }, AB会員のシード("003"));
defineSeed("S-A06-05-AB-ORDER-034", { needs: ["S-A06-05-AB-STORE", "S-A06-05-AB-STATUSES"] }, AB会員のシード("004"));
