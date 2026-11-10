/**
 * M11-02 メンバー管理の画面シード。正本: cases/M11-02_seed_data.tsv
 *
 * シードでの解釈（記録 review/M11-02_progress_2026-11-11_dev.md にも書く）:
 * - S-M11-02-MASTER: 所属「トレード」「EC運営」・権限「システム権限」「店舗権限」は開発環境に無く、所属・権限のマスタは全員が使うので新しく作らない。
 *   開発環境に既にあるもので読み替える: 所属 トレード→「試験所属A」・EC運営→「試験所属B」、権限 システム権限→「システム管理者」・店舗権限→「店舗オペレーター」。
 *   店舗「東京店」「大阪店」「名古屋店」は開発環境に同じ店名の店舗が複数あるので、店名がちょうど一致する店舗のうち番号のいちばん小さいものを使い、選択欄は番号で選ぶ。
 *   稼働「稼働」「非稼働」は既にある。マスタは作らず、DB と画面で確かめるだけ。
 * - 決め打ちのログインID・名前・メールアドレスには実行の印 rc() を付ける（開発環境に手動テスト用の同じログインIDのメンバーが多い）。
 *   値そのものの長さ・書式を確かめるログインID（019 の abcd、023 の A×255、044 の 50文字）は印を付けない。開発環境で未使用であることを DB の参照で確かめ、使われていれば止める。
 * - 表示順（画面で指定できない）は、E2E が作ったメンバーの行だけ lib/db_write.ts で書き足す。
 * - 「存在する場合は開始前に削除する」シード（NEW-xxx）は、印つきのログインIDなので存在しない。存在しないことを DB の参照で確かめるだけで、何も消さない。
 */
import { Browser } from "@playwright/test";
import { SETUP_ADMIN } from "../config/env";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, withAdminSession } from "../lib/session";
import { ログインIDのメンバー, 店名の店舗ID, 表示順にする } from "../db/m11_02";
import { MemberEditPage, メンバーの入力, 自動ログアウト時間を読む, 自動ログアウト時間を設定する } from "../pages/admin/m11_02_member";

/** 正本の所属・権限の名前を、開発環境に既にあるものへ読み替える */
export const 所属 = { トレード: "試験所属A", EC運営: "試験所属B" } as const;
export const 権限 = { システム権限: "システム管理者", 店舗権限: "店舗オペレーター" } as const;

let 店舗ID: Record<"東京店" | "大阪店" | "名古屋店", string> | null = null;
/** 店名から使う店舗ID（MASTER のシードで決める） */
export function 店舗の(店名: "東京店" | "大阪店" | "名古屋店"): string {
  if (!店舗ID) throw new Error("S-M11-02-MASTER をまだ作っていない（店舗IDが決まっていない）");
  return 店舗ID[店名];
}

/** 印つきのログインID（英小文字。開発環境のログインIDに合わせる） */
export const ログインID = (正本: string): string => rc(正本).toLowerCase();
/** 印つきのメールアドレス（@ の前に印を付ける） */
export const メール = (正本: string): string => { const [a, b] = 正本.split("@"); return `${rc(a).toLowerCase()}@${b}`; };

export const 試験管理者: Account = { loginId: ログインID("m1102_admin"), password: "AdminPass123!" };
export const 連携管理者: Account = { loginId: ログインID("m1102l_adm"), password: "M1102LinkAdm!1" };

defineSeed("S-M11-02-MASTER", async ({ browser, seed }) => {
  if (店舗ID) return;
  const ids = { 東京店: 店名の店舗ID("東京店"), 大阪店: 店名の店舗ID("大阪店"), 名古屋店: 店名の店舗ID("名古屋店") };
  for (const [k, v] of Object.entries(ids)) if (!v) throw new Error(`開発環境に店舗「${k}」が無い`);
  店舗ID = ids as Record<"東京店" | "大阪店" | "名古屋店", string>;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    const p = new MemberEditPage(page);
    await p.新規登録を開く();
    const 所属の選択肢 = await p.選択肢(p.所属欄);
    const 権限の選択肢 = await p.選択肢(p.権限欄);
    for (const n of Object.values(所属)) if (!所属の選択肢.includes(n)) throw new Error(`所属の選択肢に「${n}」が無い（${所属の選択肢.join("、")}）`);
    for (const n of Object.values(権限)) if (!権限の選択肢.includes(n)) throw new Error(`権限グループの選択肢に「${n}」が無い（${権限の選択肢.join("、")}）`);
  });
  reportSeedIssue(seed.シードID, `所属・権限は開発環境に既にあるものへ読み替えた（所属 トレード→${所属.トレード}・EC運営→${所属.EC運営}、権限 システム権限→${権限.システム権限}・店舗権限→${権限.店舗権限}）。店舗は店名が一致する店舗のうち番号のいちばん小さいもの（東京店=${ids.東京店}・大阪店=${ids.大阪店}・名古屋店=${ids.名古屋店}）`);
});

type メンバーの定め = メンバーの入力 & { 表示順?: number };

/** メンバー管理画面で新規登録し、移った先の編集画面のアドレスからメンバーIDを読む。表示順は E2E の行に DB で書き足す */
async function メンバーを作る(browser: Browser, seedId: string, v: メンバーの定め, 作る人: Account = SETUP_ADMIN): Promise<string> {
  if (v.ログインID && ログインIDのメンバー(v.ログインID).length > 0) throw new Error(`${seedId}: ログインID ${v.ログインID} のメンバーが既にいる`);
  const id = await withAdminSession(browser, 作る人, async (page) => {
    const p = new MemberEditPage(page);
    await p.一覧から新規登録を開く();
    await p.入れる(v);
    const r = await p.登録を押す();
    const m = /\/member\/(\d+)\/edit/.exec(page.url());
    if (!m || r.誤り.length) throw new Error(`${seedId}: メンバー「${v.名前}」を登録できない（${r.誤り.join(" / ") || page.url()}）`);
    return m[1];
  });
  if (v.表示順 !== undefined) 表示順にする(`${seedId}: 表示順`, id, v.表示順);
  return id;
}

/** シード表の「BASE」形のメンバー（所属店舗・デフォルト検索表示店舗・編集可能店舗=東京店、所属=トレード、権限=店舗権限、非稼働、表示順4） */
function 編集前のメンバー(n: string, pw: string, 上書き: Partial<メンバーの定め> = {}): メンバーの定め {
  return {
    名前: rc(`編集前メンバー-${n}`), 所属店舗ID: 店舗の("東京店"), 所属: 所属.トレード, ログインID: ログインID(`m1102_member-${n}`),
    メールアドレス: メール(`before-${n}@example.com`), パスワード: pw, 権限: 権限.店舗権限, 編集可能店舗ID: [店舗の("東京店")],
    デフォルト検索表示店舗ID: 店舗の("東京店"), 稼働: "非稼働", 二段階認証: false, 自動ログアウト: false, スマレジ用アカウント: false, 表示順: 4, ...上書き,
  };
}

let 管理者ID: string | null = null;
defineSeed("S-M11-02-ADM", { needs: ["S-M11-02-MASTER"] }, async ({ browser, notes, seed }) => {
  if (!管理者ID) {
    管理者ID = await メンバーを作る(browser, seed.シードID, {
      名前: rc("M11-02管理者"), 所属店舗ID: 店舗の("東京店"), 所属: 所属.トレード, ログインID: 試験管理者.loginId, メールアドレス: メール("m1102-admin@example.test"),
      パスワード: 試験管理者.password, 権限: 権限.システム権限, 編集可能店舗ID: [店舗の("東京店")], デフォルト検索表示店舗ID: 店舗の("東京店"),
      稼働: "稼働", 二段階認証: false, 自動ログアウト: false, スマレジ用アカウント: false, 表示順: 5,
    });
  }
  notes.set("〔メンバーID-M1102-共有A〕", 管理者ID);
});

// ---- 編集の対象のメンバー（BASE） ----
const BASE: Record<string, { pw: string; 上書き?: Partial<メンバーの定め> }> = {
  "005": { pw: "BeforePass1!" }, "006": { pw: "BeforePass1-006!" }, "011": { pw: "BeforePass1-011!" }, "012": { pw: "BeforePass1-012!" },
  "015": { pw: "BeforePass1-015!" }, "016": { pw: "BeforePass1-016!" }, "017": { pw: "BeforePass1-017!" }, "019": { pw: "BeforePass1-019!" },
  "020": { pw: "BeforePass1-020!" }, "022": { pw: "BeforePass1-022!" }, "026": { pw: "BeforePass1-026!" }, "030": { pw: "BeforePass1-030!" },
  "031": { pw: "BeforePass1-031!" }, "033": { pw: "BeforePass1-033!" },
};
for (const [n, b] of Object.entries(BASE)) {
  defineSeed(`S-M11-02-BASE-${n}`, { needs: ["S-M11-02-MASTER"] }, async ({ browser, notes, seed }) => {
    notes.set(`〔メンバーID-M1102-${n}〕`, await メンバーを作る(browser, seed.シードID, 編集前のメンバー(n, b.pw, b.上書き)));
  });
}

// ---- 新規登録するメンバーのログインIDが未登録であること（NEW） ----
/** 値そのものを確かめるので印を付けないログインID */
export const 印なしのログインID: Record<string, string> = {
  "023": "A".repeat(255), "024": "A".repeat(256), "044": "m1102-044-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
};
/** NEW のケースで登録するログインID（印つき。023・024・044 は印なし） */
export const 新規のログインID: Record<string, string> = {
  "008": ログインID("m1102_required"), "009": ログインID("m1102_all"), "010": ログインID("m1102_transition"), "014": ログインID("m1102_hash_new"),
  "041": ログインID("m1102-041-shop"), "043": ログインID("m1102-043-nodef"), "046": ログインID("m1102-046-pw50"), "048": ログインID("m1102_one-048"),
  ...印なしのログインID,
};
for (const n of Object.keys(新規のログインID)) {
  defineSeed(`S-M11-02-NEW-${n}`, async () => {
    const id = 新規のログインID[n];
    if (ログインIDのメンバー(id).length > 0) {
      throw new Error(`ログインID ${id.length > 60 ? `${id.slice(0, 20)}…（${id.length}文字）` : id} のメンバーが既にいる。正本は「存在する場合は削除」と定めるが、E2E のものと確かめられないので消さずに止める`);
    }
  });
}

// ---- 自動ログアウト（共有の設定） ----
let 元の自動ログアウト時間: string | null = null;
defineSeed("S-M11-02-AUTO-CONFIG", async ({ browser }) => {
  if (元の自動ログアウト時間 !== null) return;
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { 元の自動ログアウト時間 = await 自動ログアウト時間を読む(page); });
});
/** ケースの開始時に 1分にする（元の値は AUTO-CONFIG が控えた） */
export async function 自動ログアウトを1分にする(browser: Browser): Promise<void> {
  await withAdminSession(browser, SETUP_ADMIN, async (page) => { await 自動ログアウト時間を設定する(page, "1"); });
}
/** 控えた値へ戻し、戻せなければ文を返す */
export async function 自動ログアウトを戻す(browser: Browser): Promise<string> {
  if (元の自動ログアウト時間 === null) return "自動ログアウト時間の元の値を控えていない";
  const v = 元の自動ログアウト時間;
  try {
    await withAdminSession(browser, SETUP_ADMIN, async (page) => { await 自動ログアウト時間を設定する(page, v); });
    return "";
  } catch (e) { return `自動ログアウト時間を ${v} 分へ戻せない: ${String(e).slice(0, 160)}`; }
}
export const 自動ログアウトのメンバー = {
  "032": { loginId: ログインID("m1102_auto-032"), password: "AutoPass123!" },
  "052": { loginId: ログインID("m1102_noauto-052"), password: "Passw0rd-M1102052" },
};
for (const [n, 名前, mail, 表示順] of [["032", "自動ログアウト確認メンバー-032", "auto-032@example.com", 2], ["052", "自動ログアウト無効メンバー-052", "noauto-052@example.test", 2]] as const) {
  defineSeed(`S-M11-02-AUTO-${n}`, { needs: ["S-M11-02-MASTER"] }, async ({ browser, notes, seed }) => {
    const a = 自動ログアウトのメンバー[n];
    notes.set(`〔メンバーID-M1102-${n}〕`, await メンバーを作る(browser, seed.シードID, {
      名前: rc(名前), 所属店舗ID: 店舗の("東京店"), 所属: 所属.トレード, ログインID: a.loginId, メールアドレス: メール(mail), パスワード: a.password,
      権限: 権限.店舗権限, 編集可能店舗ID: [店舗の("東京店")], デフォルト検索表示店舗ID: 店舗の("東京店"), 稼働: "稼働",
      二段階認証: false, 自動ログアウト: false, スマレジ用アカウント: false, 表示順,
    }));
  });
}

// ---- デフォルト検索表示店舗の連携（L） ----
defineSeed("S-M11-02-L-SHOPS", { needs: ["S-M11-02-MASTER"] }, async () => { /* 東京店・大阪店は開発環境に開店中で既にある（MASTER で番号を決めた） */ });
let 連携管理者ID: string | null = null;
defineSeed("S-M11-02-L-ADM", { needs: ["S-M11-02-MASTER"] }, async ({ browser, seed }) => {
  if (連携管理者ID) return;
  連携管理者ID = await メンバーを作る(browser, seed.シードID, {
    名前: rc("M11-02連携管理者"), 所属店舗ID: 店舗の("東京店"), 所属: 所属.EC運営, ログインID: 連携管理者.loginId, メールアドレス: メール("m1102l-adm@example.test"),
    パスワード: 連携管理者.password, 権限: 権限.システム権限, 編集可能店舗ID: [店舗の("東京店")], デフォルト検索表示店舗ID: 店舗の("東京店"),
    稼働: "稼働", 二段階認証: false, 自動ログアウト: false, スマレジ用アカウント: false,
  });
});
export const 連携の対象 = {
  "039": { loginId: ログインID("m1102l_tgt002"), password: "M1102LinkTgt002!" },
  "040": { loginId: ログインID("m1102l_tgt003"), password: "M1102LinkTgt003!" },
};
for (const [n, 番, mail] of [["039", "002", "m1102l-002@example.test"], ["040", "003", "m1102l-003@example.test"]] as const) {
  defineSeed(`S-M11-02-L-TGT-${n}`, { needs: ["S-M11-02-MASTER"] }, async ({ browser, notes, seed }) => {
    const a = 連携の対象[n];
    notes.set(`〔メンバーID-M1102-${n}〕`, await メンバーを作る(browser, seed.シードID, {
      名前: rc(`連携確認メンバー-${番}`), 所属店舗ID: 店舗の("東京店"), 所属: 所属.トレード, ログインID: a.loginId, メールアドレス: メール(mail), パスワード: a.password,
      権限: 権限.システム権限, 編集可能店舗ID: [店舗の("東京店")], デフォルト検索表示店舗ID: 店舗の("東京店"), 稼働: "稼働",
      二段階認証: false, 自動ログアウト: false, スマレジ用アカウント: false, 表示順: 10,
    }));
  });
}

// ---- 稼働の変更（CB） ----
for (const [n, sid, 名前, login, pw, 権] of [
  ["055", "S-M11-02-CBACTOFF-055", "CB稼働変更メンバー-M1102-CB055", "cbm1102-055-tgt", "Passw0rd-CBM1102055", 権限.システム権限],
  ["056", "S-M11-02-CBACTKEEP-056", "CB稼働維持メンバー-M1102-CB056", "cbm1102-056-tgt", "Passw0rd-CBM1102056", 権限.店舗権限],
] as const) {
  defineSeed(sid, { needs: ["S-M11-02-MASTER"] }, async ({ browser, notes, seed }) => {
    notes.set(`〔メンバーID-M1102-${n}〕`, await メンバーを作る(browser, seed.シードID, {
      名前: rc(名前), 所属店舗ID: 店舗の("東京店"), 所属: 所属.トレード, ログインID: ログインID(login), メールアドレス: メール(`${login}@example.test`), パスワード: pw,
      権限: 権, 編集可能店舗ID: [店舗の("東京店")], デフォルト検索表示店舗ID: 店舗の("東京店"), 稼働: "稼働", スマレジ用アカウント: false,
    }));
  });
}

export type { Notes };
