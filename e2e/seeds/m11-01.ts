/**
 * M11-01 メンバー管理一覧の画面シード。正本: cases/M11-01_seed_data.tsv
 *
 * シードでの解釈（正本の外の補い。記録 review/M11-01_progress_2026-11-11_dev.md にも書く）:
 * - S-M11-01-MASTER: 所属「東京店」「大阪店」・権限「システム権限」「店舗権限」は開発環境に無く、所属・権限のマスタは全員が使うので新しく作らない。
 *   M11-02 と同じく既存のもので読み替える: 所属 東京店→「試験所属A」・大阪店→「試験所属B」、権限 システム権限→「システム管理者」・店舗権限→「店舗オペレーター」。
 *   店舗「東京店」「大阪店」は、店名がちょうど一致する店舗のうち番号のいちばん小さいものを番号で選ぶ。稼働「稼働」「非稼働」は既にある。
 * - 正本の「既存メンバーの退避（削除されていないメンバーを本シードのメンバーだけにする）と終了後の復元」は、ほかの方のメンバーを動かすので行わない。
 *   代わりに、ケースのメンバーの表示順を「いまの全メンバーの表示順の最大＋正本の表示順」にして（E2E の行だけに DB で書く）、一覧の先頭にケースのメンバーだけが
 *   正本の並びで来るようにする。期待結果の表示順の値は、この「基準＋正本の値」で読み替える。
 * - 名前・ログインID・メールアドレスには実行の印 rc() を付ける。パスワードは正本の値（9文字）がアプリの最低12文字に足りないので、末尾を足した12文字以上の値で作る。
 * - 正本が値を示さない必須項目は、入力チェックを通る値（所属店舗=東京店、所属=東京店の読み替え、権限=店舗権限の読み替え、稼働=稼働、編集可能店舗・デフォルト検索表示店舗=所属店舗）を入れる。
 * - 「削除済みメンバー」は、ほかのメンバーと同じく登録してから、メンバー管理一覧の削除で消す（アプリの削除は行を消す）。表示順はケースのメンバーのいちばん上なので、
 *   削除で繰り下がるメンバーはいない（押す前に DB で確かめる）。
 * - 2段階認証の「設定済み」（001 の大阪システム担当）は、本人が認証アプリで設定したときだけ鍵が入るので、E2E の行に試験用の鍵を DB で入れる。
 * - 042 の関連データ（正本: 大阪システム担当-042 が作った支払方法）は、支払方法が全員の注文画面に出る共有の設定なので作らない。
 *   代わりに、大阪システム担当-042 でログインして、東京システム担当-042・大阪店舗担当-042 を登録する（作成者として、ほかのメンバーの行から参照される）。
 * - 「ログインID=m1101-036-guest のメンバーは未登録」などは、印つきのログインIDなので未登録（DB の参照で確かめる）。
 * 作らないシード: S-M11-01-LASTSYS-034（稼働中のシステム権限のメンバーを1人だけにするには、ほかの方のメンバーを非稼働・退避にする必要がある）。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { ログインIDの数, 表示順の最大, 表示順にする, 二段階認証を設定済みにする, 繰り下がる相手を確かめる, いるか } from "../db/m11_01";
import { 店名の店舗ID } from "../db/m11_02";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { MemberListPage } from "../pages/admin/m11_01_member_list";
import { MemberEditPage, メンバーの入力 } from "../pages/admin/m11_02_member";

/** 正本の所属・権限の名前を、開発環境に既にあるものへ読み替える（M11-02 と同じ） */
export const 所属 = { 東京店: "試験所属A", 大阪店: "試験所属B" } as const;
export const 権限 = { システム権限: "システム管理者", 店舗権限: "店舗オペレーター", ゲスト権限: "ゲスト", 顧客権限: "顧客" } as const;
export const 読み替えの文 = `所属 東京店→${所属.東京店}・大阪店→${所属.大阪店}、権限 システム権限→${権限.システム権限}・店舗権限→${権限.店舗権限}`;

let 店舗ID: Record<"東京店" | "大阪店", string> | null = null;
export function 店舗の(店名: "東京店" | "大阪店"): string {
  if (!店舗ID) throw new Error("S-M11-01-MASTER をまだ作っていない（店舗IDが決まっていない）");
  return 店舗ID[店名];
}

export const ログインID = (正本: string): string => rc(正本).toLowerCase();
/** 正本のパスワード（9〜12文字）に足して、アプリの最低12文字以上にした値 */
export const パスワード = (正本: string): string => `${正本}-E2Epw`;

defineSeed("S-M11-01-MASTER", async ({ browser, seed }) => {
  if (店舗ID) return;
  const ids = { 東京店: 店名の店舗ID("東京店"), 大阪店: 店名の店舗ID("大阪店") };
  for (const [k, v] of Object.entries(ids)) if (!v) throw new Error(`開発環境に店舗「${k}」が無い`);
  店舗ID = ids as Record<"東京店" | "大阪店", string>;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const p = new MemberEditPage(page);
    await p.新規登録を開く();
    const 所属の選択肢 = await p.選択肢(p.所属欄);
    const 権限の選択肢 = await p.選択肢(p.権限欄);
    for (const n of Object.values(所属)) if (!所属の選択肢.includes(n)) throw new Error(`所属の選択肢に「${n}」が無い（${所属の選択肢.join("、")}）`);
    for (const n of Object.values(権限)) if (!権限の選択肢.includes(n)) throw new Error(`権限グループの選択肢に「${n}」が無い（${権限の選択肢.join("、")}）`);
    const 稼働 = [await p.稼働の選択("稼働").count(), await p.稼働の選択("非稼働").count()];
    if (稼働.some((c) => c === 0)) throw new Error("稼働の選択肢「稼働」「非稼働」が無い");
  });
  reportSeedIssue(seed.シードID, `所属・権限のマスタは作らず、開発環境に既にあるものへ読み替えた（${読み替えの文}）。店舗は店名が一致する店舗のうち番号のいちばん小さいもの（東京店=${ids.東京店}・大阪店=${ids.大阪店}）`);
});

// ---- ケースのメンバーの定め ----
type 人の定め = {
  記号: string; 名前: string; 表示順: number;
  所属?: "東京店" | "大阪店"; 権限?: keyof typeof 権限; 稼働?: "稼働" | "非稼働";
  ログイン?: { 正本のID: string; 正本のパスワード: string };
  デフォルト検索表示店舗?: "東京店" | "大阪店"; 編集可能店舗?: ("東京店" | "大阪店")[]; 自動ログアウト?: boolean; 二段階認証?: "設定済み";
  削除済み?: true;
};
type ケースの定め = { 番号: string; 人: 人の定め[]; 作る人?: string; 作られる人?: string[] };

/** 基本の5人（ログイン管理者・東京店舗担当・大阪システム担当・東京システム担当・大阪店舗担当） */
function 基本の5人(n: string, 上書き: Partial<Record<string, Partial<人の定め>>> = {}): 人の定め[] {
  const base: 人の定め[] = [
    { 記号: "A", 名前: `ログイン管理者-${n}`, 表示順: 5, 所属: "東京店", 権限: "システム権限", 稼働: "稼働", ログイン: { 正本のID: `m1101_admin-${n}`, 正本のパスワード: `M11P${n}X9` } },
    { 記号: "B", 名前: `東京店舗担当-${n}`, 表示順: 4, 所属: "東京店", 権限: "店舗権限", 稼働: "稼働" },
    { 記号: "C", 名前: `大阪システム担当-${n}`, 表示順: 3, 所属: "大阪店", 権限: "システム権限", 稼働: "非稼働" },
    { 記号: "D", 名前: `東京システム担当-${n}`, 表示順: 2, 所属: "東京店", 権限: "システム権限", 稼働: "稼働" },
    { 記号: "E", 名前: `大阪店舗担当-${n}`, 表示順: 1, 所属: "大阪店", 権限: "店舗権限", 稼働: "稼働" },
  ];
  return base.map((p) => ({ ...p, ...(上書き[p.記号] ?? {}) }));
}
const 削除済み = (n: string, 名前 = `削除済みメンバー-${n}`): 人の定め => ({ 記号: "F", 名前, 表示順: 6, 削除済み: true });
const ひとり = (n: string): 人の定め[] => [
  { 記号: "", 名前: `ログイン管理者-${n}`, 表示順: 1, 所属: "東京店", 権限: "システム権限", 稼働: "稼働", ログイン: { 正本のID: `m1101_admin-${n}`, 正本のパスワード: `M11P${n}X9` } },
];
const 欠番 = (n: string): 人の定め[] => [
  { 記号: "A", 名前: `ログイン管理者-${n}`, 表示順: 50, 所属: "東京店", 権限: "システム権限", 稼働: "稼働", ログイン: { 正本のID: `m1101_admin-${n}`, 正本のパスワード: `M11P${n}X9` } },
  { 記号: "B", 名前: `表示順欠番メンバー-${n}`, 表示順: 30, 権限: "システム権限", 稼働: "稼働" },
  { 記号: "C", 名前: `下位メンバー-${n}`, 表示順: 10, 稼働: "稼働" },
];

export const ケース: Record<string, ケースの定め> = {
  "001": { 番号: "001", 人: [...基本の5人("001", { C: { デフォルト検索表示店舗: "大阪店", 編集可能店舗: ["東京店", "大阪店"], 自動ログアウト: true, 二段階認証: "設定済み" } }), 削除済み("001", "削除済メンバー-001")] },
  "002": { 番号: "002", 人: [...基本の5人("002"), 削除済み("002")] },
  "003": { 番号: "003", 人: [...基本の5人("003"), 削除済み("003")] },
  "015": { 番号: "015", 人: 欠番("015") },
  "016": { 番号: "016", 人: 欠番("016") },
  "036": { 番号: "036", 人: ひとり("036") },
  "037": { 番号: "037", 人: ひとり("037") },
  "038": { 番号: "038", 人: ひとり("038") },
  "039": { 番号: "039", 人: ひとり("039") },
  "040": {
    番号: "040", 人: [
      { 記号: "A", 名前: "ログイン管理者-040", 表示順: 4, 所属: "東京店", 権限: "システム権限", 稼働: "稼働", ログイン: { 正本のID: "m1101_admin-040", 正本のパスワード: "M11P040X9" } },
      { 記号: "B", 名前: "大阪システム担当-040", 表示順: 5, 所属: "大阪店", 権限: "システム権限", 稼働: "非稼働" },
      { 記号: "C", 名前: "東京店舗担当-040", 表示順: 3, 所属: "東京店", 権限: "店舗権限", 稼働: "稼働" },
      { 記号: "D", 名前: "東京システム担当-040", 表示順: 2, 所属: "東京店", 権限: "システム権限", 稼働: "稼働" },
      { 記号: "E", 名前: "大阪店舗担当-040", 表示順: 1, 所属: "大阪店", 権限: "店舗権限", 稼働: "稼働" },
    ],
  },
  "042": {
    番号: "042", 作る人: "C", 作られる人: ["D", "E"],
    人: 基本の5人("042", {
      A: { ログイン: { 正本のID: "m1101-cb042-admin", 正本のパスワード: "M1101CB042x9" } },
      C: { 稼働: "稼働", ログイン: { 正本のID: "m1101-cb042-osaka", 正本のパスワード: "M1101CB042y9" } },
    }),
  },
};
for (const n of ["005", "006", "009", "010", "011", "012", "013", "014", "017", "018", "019", "020", "021", "022", "023", "024", "041"]) ケース[n] = { 番号: n, 人: 基本の5人(n) };

/** ケースの使用シードID */
export function シードIDの(n: string): string {
  if (["036", "038"].includes(n)) return `S-M11-01-AUTHGUEST-${n}`;
  if (["037", "039"].includes(n)) return `S-M11-01-AUTHCUST-${n}`;
  if (n === "042") return "S-M11-01-CBMEMBERS-042";
  return `S-M11-01-MEMBERS-${n}`;
}
/** 控える番号の呼び名 */
export const 呼び名 = (n: string, 記号: string): string => `〔メンバーID-M1101-${n}${記号}〕`;
/** ケースのログイン管理者のアカウント */
export function ログイン管理者(n: string, 記号 = ケース[n].人.find((p) => p.ログイン && p.名前.startsWith("ログイン管理者"))?.記号 ?? "A"): Account {
  const p = ケース[n].人.find((x) => x.記号 === 記号);
  if (!p?.ログイン) throw new Error(`${n} の ${記号} はログインするメンバーでない`);
  return { loginId: ログインID(p.ログイン.正本のID), password: パスワード(p.ログイン.正本のパスワード) };
}
/** ケースのメンバーの、正本の表示順（記号ごと） */
export function 正本の表示順(n: string): Record<string, number> {
  return Object.fromEntries(ケース[n].人.filter((p) => !p.削除済み).map((p) => [p.記号, p.表示順]));
}
/** ケースのメンバーの名前（印つき・記号ごと） */
export function 名前の(n: string, 記号: string): string {
  const p = ケース[n].人.find((x) => x.記号 === 記号);
  if (!p) throw new Error(`${n} に記号 ${記号} のメンバーがいない`);
  return rc(p.名前);
}

function 入力の(n: string, p: 人の定め): メンバーの入力 {
  const 店 = 店舗の(p.所属 ?? "東京店");
  const login = p.ログイン ? ログインID(p.ログイン.正本のID) : ログインID(`m1101-${n}${p.記号 || "x"}`);
  const pw = パスワード(p.ログイン?.正本のパスワード ?? `M11P${n}${p.記号 || "x"}9`);
  const 編集可能 = (p.編集可能店舗 ?? [p.所属 ?? "東京店"]).map((s) => 店舗の(s));
  return {
    名前: rc(p.名前), 所属店舗ID: 店, 所属: 所属[p.所属 ?? "東京店"], ログインID: login, メールアドレス: `${login}@example.test`, パスワード: pw,
    権限: 権限[p.権限 ?? "店舗権限"], 編集可能店舗ID: 編集可能, デフォルト検索表示店舗ID: 店舗の(p.デフォルト検索表示店舗 ?? p.所属 ?? "東京店"),
    稼働: p.稼働 ?? "稼働", 二段階認証: p.二段階認証 === "設定済み", 自動ログアウト: p.自動ログアウト ?? false, スマレジ用アカウント: false,
  };
}

async function 登録する(browser: Browser, seedId: string, who: Account, defs: { n: string; p: 人の定め }[]): Promise<Record<string, string>> {
  return withAdminSession(browser, who, async (page) => {
    page.setDefaultTimeout(60_000);
    const out: Record<string, string> = {};
    for (const { n, p } of defs) {
      const v = 入力の(n, p);
      if (ログインIDの数(v.ログインID!) > 0) throw new Error(`${seedId}: ログインID ${v.ログインID} のメンバーが既にいる`);
      const e = new MemberEditPage(page);
      await e.新規登録を開く();
      await e.入れる(v);
      const r = await e.登録を押す();
      const m = /\/member\/(\d+)\/edit/.exec(page.url());
      if (!m || r.誤り.length) throw new Error(`${seedId}: メンバー「${v.名前}」を登録できない（${r.誤り.join(" / ") || page.url()}）`);
      out[p.記号] = m[1];
    }
    return out;
  });
}

const 作った = new Map<string, Record<string, string>>();
/** ケースのメンバーのID（記号ごと。削除済みのものも含む） */
export function IDの(n: string): Record<string, string> {
  const r = 作った.get(n);
  if (!r) throw new Error(`${n} のメンバーをまだ作っていない`);
  return r;
}

async function ケースのメンバーを作る(browser: Browser, seedId: string, c: ケースの定め, notes: { set(l: string, v: string): void }, issue: (m: string) => void): Promise<void> {
  const 後で = new Set(c.作られる人 ?? []);
  const ids = await 登録する(browser, seedId, SETUP_ADMIN, c.人.filter((p) => !後で.has(p.記号)).map((p) => ({ n: c.番号, p })));
  if (c.作る人) {
    // 042: 大阪システム担当-042 でログインして、東京システム担当-042・大阪店舗担当-042 を登録する（関連データの読み替え）
    const 作る人 = ログイン管理者(c.番号, c.作る人);
    Object.assign(ids, await 登録する(browser, seedId, 作る人, c.人.filter((p) => 後で.has(p.記号)).map((p) => ({ n: c.番号, p }))));
    issue(`関連データは、正本の支払方法（全員の注文画面に出る共有の設定）の代わりに、${c.作る人}（${名前の(c.番号, c.作る人)}）でログインして ${[...後で].map((k) => 名前の(c.番号, k)).join("・")} を登録した（作成者としてほかのメンバーの行から参照される）`);
  }
  // 表示順: いまの全メンバーの最大＋正本の表示順（ケースのメンバーが一覧の先頭に正本の並びで来る）
  const 基準 = 表示順の最大();
  for (const p of c.人) 表示順にする(`${seedId}: 表示順（${p.名前}）`, ids[p.記号], 基準 + p.表示順);
  issue(`表示順は、正本の値に基準 ${基準}（登録したときの全メンバーの表示順の最大）を足した値で DB に書いた（ほかの方のメンバーより上に、正本の並びで並べるため。正本の退避・復元は行わない）`);
  for (const p of c.人) if (p.二段階認証 === "設定済み") 二段階認証を設定済みにする(`${seedId}: 2段階認証の設定済み（${p.名前}）`, ids[p.記号]);
  // 削除済みのメンバー: 一覧の削除で消す（ケースのメンバーのいちばん上なので、繰り下がるメンバーはいない）
  for (const p of c.人.filter((x) => x.削除済み)) {
    const id = ids[p.記号];
    const 相手 = 繰り下がる相手を確かめる(id);
    if (相手.length) throw new Error(`${seedId}: ${p.名前} の上にメンバー（${相手.join("・")}）がいて、削除で表示順が変わる`);
    await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      const l = new MemberListPage(page);
      await l.開く();
      await l.確認を開く(id, "削除");
      await l.実行する(id, "削除");
      const 帯 = await l.帯();
      if (!帯.成功.some((t) => t.includes("削除しました"))) throw new Error(`${seedId}: ${p.名前} を削除できない（${[...帯.誤り, ...帯.警告].join(" / ") || "結果の表示なし"}）`);
    });
    if (いるか(id)) throw new Error(`${seedId}: ${p.名前}（${id}）が DB に残っている`);
  }
  作った.set(c.番号, ids);
  for (const p of c.人) notes.set(呼び名(c.番号, p.記号), ids[p.記号]);
}

for (const c of Object.values(ケース)) {
  defineSeed(シードIDの(c.番号), { needs: ["S-M11-01-MASTER"] }, async ({ browser, notes, seed }) => {
    await ケースのメンバーを作る(browser, seed.シードID, c, notes, (m) => reportSeedIssue(seed.シードID, m));
  });
}
