/**
 * F08-04（店頭買取査定申込 会員登録フォーム）の画面シード。正本: cases/F08-04_seed_data.tsv
 *
 * 依頼者の方針（2026-11-10）で、シード表の「DBで準備」は、画面で作れる同じ前提か既存データへ読み替えた。DB へは書き込まない。
 * - 店舗（STORE・STORE-026・STORE-027）: 店舗識別名（f0804_shop など）は画面で指定できない。ケースごとに店舗を作らず、F08-05 で共通の試験店舗
 *   「店頭買取PD0805-003」（支店URL itf0805pd003。無ければ登録）を使う。手順の店舗識別名はこの店舗の支店URLとして読む。
 * - 店舗が存在しない状態（NOSTORE-028）: 店舗識別名 f0804_028_nostore の店舗は作っていない。何もしない（消す対象が無い）。
 * - 会員（MEMBER-016・033・034）: フロントの会員登録で作り、管理画面の会員登録編集で本会員にする。メールアドレスの前半に実行の印を付ける。
 *   会員登録フォームに入れるメールアドレス（およびパスワード＝メールアドレスの値）も、同じ印つきの値にする。パスワードは正本の値。
 * - 会員登録フォームの入力値（ENTRY-*・CBENTRY-*）: テスト資材。会員登録フォームの入力は確認画面までで、会員・プレイヤーを作らないので、
 *   メールアドレスは正本の値のまま入れる。「同じメールアドレスの会員・プレイヤーを DB で削除して0件にする」は、
 *   このテストがその値の会員・プレイヤーを作らないので何もしない。
 */
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { withAdminSession } from "../lib/session";
import { SETUP_ADMIN } from "../config/env";
import { ensureStore } from "../pages/admin/m04_24_store";
import type { 申込入力, 申込者 } from "../pages/front/f08_05_confirm";
import { F0802会員, PD_STORE, 会員を作る } from "./f08-02";

export { PD_STORE };

const 店舗の注記 = (正本の店舗識別名: string) =>
  `店舗識別名「${正本の店舗識別名}」の店舗を新しく作らず（店舗識別名は画面で指定できない）、F08-05 と共通の試験店舗「${PD_STORE.店名}」` +
  `（支店URL ${PD_STORE.支店URL}。無ければ登録）に読み替えた。手順の店舗識別名もこの店舗の支店URLとして読む`;

for (const [seedId, 呼び名, 識別名] of [
  ["S-F08-04-STORE", "共有", "f0804_shop"], ["S-F08-04-STORE-026", "026", "f0804_026_shop"], ["S-F08-04-STORE-027", "027", "f0804_027_shop"],
] as const) {
  defineSeed(seedId, async ({ browser, notes }) => {
    notes.set(`〔店舗ID-F0804-${呼び名}〕`, await withAdminSession(browser, SETUP_ADMIN, async (page) => {
      page.setDefaultTimeout(60_000);
      return ensureStore(page, PD_STORE, (m) => reportSeedIssue(seedId, m));
    }));
    reportSeedIssue(seedId, 店舗の注記(識別名));
  });
}

defineSeed("S-F08-04-NOSTORE-028", async ({ seed }) => {
  reportSeedIssue(seed.シードID, "店舗識別名 f0804_028_nostore の店舗は作っていない（存在しない状態）。消す対象が無いので、何もしなかった");
});

// ---- 入力値（シード表の取り決め） ----

/** S-F08-04-IN-COMMON（職業・返却希望サプライはシード表に無い。職業は必須の欄なので「会社員」を入れ、サプライは選ばない） */
export const IN_COMMON: 申込入力 = {
  言語: "JP", 国: "日本", 郵便番号: ["100", "0001"], 都道府県: "東京都", 住所1: "千代田区", 住所2: "千代田1-1",
  生年月日: ["1990", "1", "1"], 電話: ["03", "1234", "5678"], 職業: "会社員", サプライ: [],
  電話連絡: "不必要", 大会参加: "いいえ", 適格請求書発行事業者: "いいえ", 利用規約同意: true,
};
/** 氏名（セイ・メイは氏名カナ、住所3は空） */
export const 申込者の = (姓: string, 名: string): 申込者 => ({ 姓, 名, セイ: "ケツゴウ", メイ: "タロウ" });

defineSeed("S-F08-04-IN-COMMON", async () => { /* 入力値の取り決め。投入は要らない */ });

const ENTRY番号 = [
  "001", "002", "003", "011", "013", "016", "018", "019", "020", "021", "022", "023", "024", "025", "033", "034", "035", "036", "037",
  "038", "039", "040", "041", "042", "043", "044",
];
for (const n of ENTRY番号) {
  defineSeed(`S-F08-04-ENTRY-${n}`, async ({ seed }) => {
    reportSeedIssue(seed.シードID, "会員登録フォームの入力値。会員登録フォームの入力は確認画面までで会員・プレイヤーを作らないので、メールアドレスは正本の値のまま入れる" +
      (["016", "033", "034"].includes(n) ? "（重複させる会員のメールアドレスだけ、会員のシードと同じ実行の印つきの値）" : ""));
  });
}
for (const id of ["S-F08-04-CBENTRY-045", "S-F08-04-CBENTRY-046"]) {
  defineSeed(id, async ({ seed }) => {
    reportSeedIssue(seed.シードID, "メールアドレスの会員・プレイヤーを0件にする作り方（会員の削除とプレイヤーのDB削除）は、このテストがその値の会員・プレイヤーを作らず、" +
      "共有のデータを消さないので行わなかった");
  });
}
defineSeed("S-F08-04-CBSESSION-048", async () => { /* 入力値の取り決め。投入は要らない */ });

// ---- 会員（重複させる会員） ----

const 会員の定義 = {
  "016": { 正本のメール: "f0804-016-dup@example.invalid", 名: "会員F0804016" },
  "033": { 正本のメール: "f0804-033-both@example.invalid", 名: "会員F0804033" },
  "034": { 正本のメール: "f0804-034-dup@example.invalid", 名: "会員F0804034" },
} as const;

const 印つき = (正本: string): string => {
  const [local, domain] = 正本.split("@");
  return `${rc(local)}@${domain}`;
};

/** 重複させる会員（メールアドレスは実行の印つき。パスワードは正本の値） */
export function F0804の会員(n: keyof typeof 会員の定義): F0802会員 {
  const d = 会員の定義[n];
  return {
    姓: "結合", 名: d.名, セイ: "ケツゴウ", メイ: "カイイン", 生年月日: ["1990", "1", "2"], 住所3: "晴れる屋ビル3階",
    メール: 印つき(d.正本のメール), パスワード: `F0804-${n}-Pw99`,
  };
}

for (const n of ["016", "033", "034"] as const) {
  defineSeed(`S-F08-04-MEMBER-${n}`, async ({ browser, notes, seed }) => {
    const m = F0804の会員(n);
    notes.set(`〔会員ID-F0804-${n}〕`, await 会員を作る(browser, m, (s) => reportSeedIssue(seed.シードID, s)));
    reportSeedIssue(seed.シードID, `メールアドレスの前半に実行の印を付けた（${m.メール}）。電話番号などシード表に無い必須項目は任意の有効な値`);
  });
}
