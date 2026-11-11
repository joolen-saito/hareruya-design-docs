/**
 * F06-04 パスワード再発行の続き（-b）のシード。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったもの。
 * 正本: cases/F06-04_seed_data.tsv。記録 review/F06-04_progress_2026-11-11_dev.md
 *
 * 型: 会員はフロントの会員登録で作る（seeds/f06-member.ts の 本会員を作る。メールアドレスの前半に実行の印）。会員IDは管理画面の会員一覧で控える。
 * 画面で作れない状態だけ、作った会員の行へ DB で書き足す（db/f06_04_b.ts・lib/db_write.ts。E2E_DB_WRITE=1 が要る）:
 * - リセットキーと有効期限（RESET-A・RESET-EXPIRED・RESET-PROVISIONAL・RESET-EQUAL・RESET-WITHDRAWN・CBRESET）。
 * - 仮会員の状態（RESET-PROVISIONAL）、退会済みでメールアドレスを保った状態（WITHDRAWN・RESET-WITHDRAWN）。
 * - パスワードと同じメールアドレス（RESET-EQUAL）、形式不正のメールアドレス（GFREG）。
 *
 * シードでの解釈（正本の外の補い。記録にも書く）:
 * - 共有の設定（仮会員機能）は書き換えない。会員登録は開発環境の今の設定のまま行う（本登録のメールのURLを開くかは部品が決める）。
 * - リセットキーは正本の値の末尾に実行の印（英数字だけ）を付ける（同じDBで流し直すと前の実行の会員が同じキーを持つため）。
 *   NOKEY（存在しないキー）は正本の値のまま。
 * - 会員ID（60412021 など）は画面が振る番号で読み替える。
 * - RESET-EQUAL: 登録画面はパスワードとメールアドレスが同じだと止める。メールアドレスの形のパスワード（実行の印つき）で登録し、
 *   メールアドレスをそのパスワードの文字列へ DB で書き換える（保存パスワードは、メールアドレスを基にした値になる）。
 * - 退会: アプリのマイページの退会が残す状態（削除の印・会員の状態は空）を、メールアドレスを書き換えずに作る。
 */
import { Browser } from "@playwright/test";
import { 会員の行に書く, リセットキーを持つ会員の数 } from "../db/f06_04_b";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed } from "../lib/seeds";
import { markedMail, 本会員を作る } from "./f06-member";

export { markedMail };

/** 作った会員（シードIDごと） */
export type 作った会員 = { 会員ID: string; メール: string; パスワード: string; リセットキー?: string };
const built = new Map<string, 作った会員>();
export function 会員の(seedId: string): 作った会員 {
  const m = built.get(seedId);
  if (!m) throw new Error(`${seedId} はまだ作っていない`);
  return m;
}

/** 正本のリセットキーに実行の印を付けた値（英数字だけ。アプリのキーの書式に合わせる） */
export const 印つきのキー = (キー: string): string => `${キー}${RUN_MARK}`;
export const 遠い期限 = "2099-12-31 23:59:59";
export const 過去の期限 = "2000-01-01 00:00:00";

function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

async function 会員を作る(browser: Browser, 前半: string, パスワード: string): Promise<{ 会員ID: string; メール: string }> {
  const 会員ID = await 本会員を作る(browser, { 姓: "F06-04", 名: "再設定会員", セイ: "エフゼロロクゼロヨン", メイ: "サイセッテイカイイン", 前半, パスワード });
  return { 会員ID, メール: markedMail(前半) };
}

type 定め = {
  seedId: string; 前半: string; パスワード: string; 呼び名?: string;
  キー?: string; 期限?: string; 状態?: "仮会員" | "退会";
};
const RESET_A = ["018", "019", "023", "024", "025", "027", "030", "031", "033", "034", "035", "037", "039", "042", "043", "044", "045", "046", "047"];
const 定めの一覧: 定め[] = [
  ...RESET_A.map((n) => ({
    seedId: `S-F06-04-RESET-A-${n}`, 前半: `f0604-reset-a-${n}`, パスワード: "BeforeReset!604",
    呼び名: n === "033" ? "〔会員ID-F0604-033A〕" : `〔会員ID-F0604-${n}〕`, キー: `ResetKeyA604${n}`, 期限: 遠い期限,
  })),
  { seedId: "S-F06-04-RESET-A-064", 前半: "f0604-reset-064", パスワード: "Before-F0604064", 呼び名: "〔会員ID-F0604-064〕", キー: "ResetKeyE604064", 期限: 遠い期限 },
  { seedId: "S-F06-04-RESET-A-065", 前半: "f0604-reset-065", パスワード: "Before-F0604065", 呼び名: "〔会員ID-F0604-065〕", キー: "ResetKeyE604065", 期限: 遠い期限 },
  { seedId: "S-F06-04-REG-B-033", 前半: "f0604-b-033", パスワード: "BeforeReset!604B-033", 呼び名: "〔会員ID-F0604-033B〕" },
  { seedId: "S-F06-04-RESET-EXPIRED-021", 前半: "f0604-expired-021", パスワード: "BeforeReset!Expired", キー: "ExpiredKey604021", 期限: 過去の期限 },
  { seedId: "S-F06-04-RESET-EXPIRED-048", 前半: "f0604-expired-048", パスワード: "BeforeReset!Expired", キー: "ExpiredKey604048", 期限: 過去の期限 },
  { seedId: "S-F06-04-RESET-PROVISIONAL-022", 前半: "f0604-temp-key-022", パスワード: "BeforeReset!Temp", キー: "ProvisionalKey604022", 期限: 遠い期限, 状態: "仮会員" },
  { seedId: "S-F06-04-WITHDRAWN-059", 前半: "f0604-w-059", パスワード: "Before-F0604059", 呼び名: "〔会員ID-F0604-059〕", 状態: "退会" },
  { seedId: "S-F06-04-WITHDRAWN-060", 前半: "f0604-w-060", パスワード: "Before-F0604060", 呼び名: "〔会員ID-F0604-060〕", 状態: "退会" },
  { seedId: "S-F06-04-RESET-WITHDRAWN-063", 前半: "f0604-w-063", パスワード: "Before-F0604063", 呼び名: "〔会員ID-F0604-063〕", キー: "ResetKeyW604063", 期限: 遠い期限, 状態: "退会" },
  { seedId: "S-F06-04-CBRESET-066", 前半: "cbf0604-066", パスワード: "Passw0rd-CBF0604066", 呼び名: "〔会員ID-F0604-066〕", キー: "ResetKeyCBF0604066", 期限: 遠い期限 },
];

for (const d of 定めの一覧) {
  defineSeed(d.seedId, async ({ browser, notes }) => {
    const m = await 会員を作る(browser, d.前半, d.パスワード);
    const キー = d.キー ? 印つきのキー(d.キー) : undefined;
    if (キー || d.状態) 会員の行に書く(d.seedId, m.会員ID, { リセットキー: キー, 有効期限: d.期限, 状態: d.状態 });
    if (d.呼び名) 控える(notes, d.seedId, d.呼び名, m.会員ID);
    built.set(d.seedId, { ...m, パスワード: d.パスワード, リセットキー: キー });
  });
}

// パスワードと同じメールアドレスの会員: メールアドレスの形のパスワードで登録し、メールアドレスをそのパスワードの文字列へ書き換える
defineSeed("S-F06-04-RESET-EQUAL-026", async ({ browser }) => {
  const 同じ値 = markedMail("equal604-026");
  const m = await 会員を作る(browser, "f0604-equal-026", 同じ値);
  const キー = 印つきのキー("EqualKey604026");
  会員の行に書く("S-F06-04-RESET-EQUAL-026", m.会員ID, { メールアドレス: 同じ値, リセットキー: キー, 有効期限: 遠い期限 });
  built.set("S-F06-04-RESET-EQUAL-026", { 会員ID: m.会員ID, メール: 同じ値, パスワード: 同じ値, リセットキー: キー });
});

// 形式不正のメールアドレス（@ の無い値）の本会員: 正しい形で登録し、メールアドレスを形式不正の値へ書き換える
export const 形式不正のメール = (): string => `${rc("f0604-056-a")}.example.test`;
defineSeed("S-F06-04-GFREG-056", async ({ browser }) => {
  const m = await 会員を作る(browser, "f0604-056-a", "BeforeGf!F0604-056-A");
  会員の行に書く("S-F06-04-GFREG-056", m.会員ID, { メールアドレス: 形式不正のメール() });
  built.set("S-F06-04-GFREG-056", { 会員ID: m.会員ID, メール: 形式不正のメール(), パスワード: "BeforeGf!F0604-056-A" });
});

// 会員に保存されていないリセットキー: 持つ会員が0件であることを確かめる（ほかの方の会員なら書き換えずに止める）
export const 存在しないキー = "NoSuchResetKey999";
defineSeed("S-F06-04-NOKEY-020", async () => {
  const n = リセットキーを持つ会員の数(存在しないキー);
  if (n !== 0) throw new Error(`リセットキー「${存在しないキー}」を持つ会員が ${n} 件ある（E2E の会員でないので未設定に戻さない。判断待ち）`);
});
