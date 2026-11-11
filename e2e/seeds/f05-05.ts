/**
 * F05-05 ネット買取カート（フロント）の画面シード。正本: cases/F05-05_seed_data.tsv
 *
 * 作るシード:
 * - 会員（S-F05-05-CUS-nnn・S-F05-05-CBCUS-nnn）: フロントの会員情報登録 → 本登録のメールのURL → 管理画面の会員一覧で会員IDを控える（F06 の部品）。
 *   ログインと買取カートへの追加は、ケースの事前準備（spec）で行う（カートはブラウザのセッションに紐づくので、シードからケースのブラウザへは渡せない）。
 * - 商品（S-F05-05-CART-nnn・NOIMAGE・CBCART-nnn）: カード登録 → カード商品CSV登録 → 商品規格の商品コードと買取価格（F05-04 の部品）。
 * - 空のカート（EMPTY）: 作るものが無い。
 *
 * 作らないシード（理由は PM への報告に書いた）: CUS-022・CART-022・CUS-029・CART-029（共有の基本設定「まとめて買取商品ID」を書き換える）。
 *
 * 決め打ちの識別の値（商品コード・商品名・メールアドレスの前半）には実行ごとの印を付ける（rc。依頼者決定 2026-10-28）。
 * シード表が値を定めないもの・値を代えたもので、ここで決めたこと:
 * - 同じ商品名（「更新前カードA」「カードB」）が004〜016の複数シードに出る。商品名で商品IDを探すので、重ならないよう末尾に「-nnn」（シードの番号）を付けた。
 *   商品コード（規格識別子）は正本の値のまま（印だけ付く）。
 * - 画像ファイル名は、ケースが画像を確かめない（003 の画像未登録を除く）ので、画像は登録しない。
 * - 買取価格 100 円の商品は買取商品詳細に「カートに追加」ボタンが出ない（画面の作り。500円以上のときだけ出る）。
 *   021 は、手順で「カートに入れる」ので、ボタンの出る 600 円で作った（ケースは買取価格を確かめない）。
 * - 言語 EN の商品（003・026）は、カード商品CSVで日本語を取り込んだあと英語を取り込み、英語・NM の規格に商品コードと買取価格を入れた。
 * - 会員のログインID（f0505_user-nnn）は画面で指定できずDBへ直接設定する指定。ログインはメールアドレスで行うので設定しない。
 */
import { Browser } from "@playwright/test";
import { Notes } from "../lib/notes";
import { rc } from "../lib/run_marker";
import { reportSeedIssue } from "../lib/seeds";
import { defineSeed } from "./current_seed";
import { カード商品を作る } from "./f05-04";
import { markedMail, 本会員を作る } from "./f06-member";

// ---- 会員 ----

export type F0505会員 = { メール: string; パスワード: string; 会員ID: string };
const members = new Map<string, F0505会員>();
/** 作った会員（キーはシードID） */
export function f0505会員(シードID: string): F0505会員 {
  const m = members.get(シードID);
  if (!m) throw new Error(`会員 ${シードID} はまだ作っていない`);
  return m;
}

function defineMemberSeed(seedId: string, 前半: string, パスワード: string): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const 会員ID = await 本会員を作る(browser, { 姓: "買取", 名: "試験", セイ: "カイトリ", メイ: "シケン", 前半, パスワード });
    members.set(seedId, { メール: markedMail(前半), パスワード, 会員ID });
    for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
      if (/^〔会員ID-F0505-[A-Z0-9]+〕$/.test(l)) notes.set(l, 会員ID);
    }
    reportSeedIssue(seedId, `シード作成時の問題（読み替え）: 会員のメールアドレスは実行の印を付けた ${markedMail(前半)}。ログインID（DB直接の指定）は設定せず、メールアドレスでログインする。ログインと買取カートへの追加は、ケースの事前準備で行う`);
  });
}
defineMemberSeed("S-F05-05-CUS-001", "f0505-user-001", "F05CARTPW001!Aa");
defineMemberSeed("S-F05-05-CUS-003", "f0505-user-003", "F05CARTPW003!Aa");
defineMemberSeed("S-F05-05-CUS-004", "f0505-user-004", "F05CARTPW004!Aa");
defineMemberSeed("S-F05-05-CUS-005", "f0505-user-005", "F05CARTPW005!Aa");
defineMemberSeed("S-F05-05-CUS-006", "f0505-user-006", "F05CARTPW006!Aa");
defineMemberSeed("S-F05-05-CUS-007", "f0505-user-007", "F05CARTPW007!Aa");
defineMemberSeed("S-F05-05-CUS-008", "f0505-user-008", "F05CARTPW008!Aa");
defineMemberSeed("S-F05-05-CUS-009", "f0505-user-009", "F05CARTPW009!Aa");
defineMemberSeed("S-F05-05-CUS-010", "f0505-user-010", "F05CARTPW010!Aa");
defineMemberSeed("S-F05-05-CUS-011", "f0505-user-011", "F05CARTPW011!Aa");
defineMemberSeed("S-F05-05-CUS-012", "f0505-user-012", "F05CARTPW012!Aa");
defineMemberSeed("S-F05-05-CUS-013", "f0505-user-013", "F05CARTPW013!Aa");
defineMemberSeed("S-F05-05-CUS-014", "f0505-user-014", "F05CARTPW014!Aa");
defineMemberSeed("S-F05-05-CUS-015", "f0505-user-015", "F05CARTPW015!Aa");
defineMemberSeed("S-F05-05-CUS-016", "f0505-user-016", "F05CARTPW016!Aa");
defineMemberSeed("S-F05-05-CUS-021", "f0505-user-021", "F05CARTPW021!Aa");
defineMemberSeed("S-F05-05-CUS-023", "f0505-user-023", "F05CARTPW023!Aa");
defineMemberSeed("S-F05-05-CUS-024", "f0505-user-024", "F05CARTPW024!Aa");
defineMemberSeed("S-F05-05-CUS-025", "f0505-user-025", "F05CARTPW025!Aa");
defineMemberSeed("S-F05-05-CUS-026", "f0505-user-026", "F05CARTPW026!Aa");
defineMemberSeed("S-F05-05-CUS-027", "f0505-user-027", "F05CARTPW027!Aa");
defineMemberSeed("S-F05-05-CUS-028", "f0505-user-028", "F05CARTPW028!Aa");
defineMemberSeed("S-F05-05-CBCUS-030", "f0505-user-cb030", "Passw0rd-CBF0505030");
defineMemberSeed("S-F05-05-CBCUS-031", "f0505-user-cb031", "Passw0rd-CBF0505031");
defineMemberSeed("S-F05-05-CBCUS-032", "f0505-user-cb032", "Passw0rd-CBF0505032");
defineMemberSeed("S-F05-05-CBCUS-033", "f0505-user-cb033", "Passw0rd-CBF0505033");
defineMemberSeed("S-F05-05-CBCUS-034", "f0505-user-cb034", "Passw0rd-CBF0505034");
defineMemberSeed("S-F05-05-CBCUS-035", "f0505-user-cb035", "Passw0rd-CBF0505035");
defineMemberSeed("S-F05-05-CBCUS-036", "f0505-user-cb036", "Passw0rd-CBF0505036");
defineMemberSeed("S-F05-05-CBCUS-037", "f0505-user-cb037", "Passw0rd-CBF0505037");
defineMemberSeed("S-F05-05-CBCUS-038", "f0505-user-cb038", "Passw0rd-CBF0505038");

// ---- 商品 ----

export type F0505商品 = { 商品ID: string; 規格ID: string; 商品コード: string; 商品名: string; 買取: number; 数量: number; 言語: "JP" | "EN" };
const carts = new Map<string, Record<string, F0505商品>>();
/** カートのシードが作った商品（キーは A・B） */
export function f0505商品(シードID: string, キー: string): F0505商品 {
  const p = carts.get(シードID)?.[キー];
  if (!p) throw new Error(`商品 ${シードID}-${キー} はまだ作っていない`);
  return p;
}

type 商品定義 = { キー: string; コード: string; 名: string; 買取: number; 数量: number; 言語?: "JP" | "EN" };

function defineProductSeed(seedId: string, defs: 商品定義[], 注記?: string): void {
  defineSeed(seedId, async ({ browser, notes, seed }) => {
    const out: Record<string, F0505商品> = {};
    for (const d of defs) out[d.キー] = await 商品を作る(browser, seedId, notes, d);
    carts.set(seedId, out);
    for (const l of Notes.labelsIn(seed["状態・属性"] + seed.投入方法)) {
      const m = /^〔(商品ID|商品規格ID)-F0505-[A-Z0-9]+([AB])〕$/.exec(l);
      const p = m ? out[m[2]] : undefined;
      if (m && p) notes.set(l, m[1] === "商品ID" ? p.商品ID : p.規格ID);
    }
    reportSeedIssue(seedId, `シード作成時の問題（読み替え）: 商品はカード登録・カード商品CSV登録・規格の商品コードと買取価格で作った。商品コード・商品名には実行の印を付けた。販売価格・基準価格は買取価格と同じ。画像は登録していない${注記 ? `。${注記}` : ""}`);
  });
}

async function 商品を作る(browser: Browser, seedId: string, notes: Notes, d: 商品定義): Promise<F0505商品> {
  const en = d.言語 === "EN";
  const クラス = en ? "EN-NM" : "JP-NM";
  const made = await カード商品を作る(browser, seedId, notes, { 名英: `${d.コード} Card` }, {
    名: d.名, 言語: en ? ["JP", "EN"] : ["JP"], 買取: d.買取, 残す状態: ["NM"],
    規格: { [クラス]: { 商品コード: d.コード, 買取: d.買取 } },
  }, false);
  const 規格ID = made.規格[クラス];
  if (!規格ID) throw new Error(`${seedId}: 商品 ${d.名} の ${クラス} の規格が無い`);
  return { 商品ID: made.商品ID, 規格ID, 商品コード: rc(d.コード), 商品名: rc(d.名), 買取: d.買取, 数量: d.数量, 言語: d.言語 ?? "JP" };
}

/** 004〜016 の「更新前カードA（100円）とカードB（200円）」の形 */
function defineABSeed(seedId: string, n: string): void {
  defineProductSeed(seedId, [
    { キー: "A", コード: `F0505-A-001-${n}`, 名: `更新前カードA-${n}`, 買取: 100, 数量: 2 },
    { キー: "B", コード: `F0505-B-001-${n}`, 名: `カードB-${n}`, 買取: 200, 数量: 3 },
  ]);
}
defineABSeed("S-F05-05-CART-001", "001");
defineABSeed("S-F05-05-CART-004", "004");
defineABSeed("S-F05-05-CART-005", "005");
defineABSeed("S-F05-05-CART-006", "006");
defineABSeed("S-F05-05-CART-007", "007");
defineABSeed("S-F05-05-CART-008", "008");
defineABSeed("S-F05-05-CART-009", "009");
defineABSeed("S-F05-05-CART-010", "010");
defineABSeed("S-F05-05-CART-011", "011");
defineABSeed("S-F05-05-CART-012", "012");
defineABSeed("S-F05-05-CART-013", "013");
defineABSeed("S-F05-05-CART-014", "014");
defineABSeed("S-F05-05-CART-016", "016");

defineProductSeed("S-F05-05-NOIMAGE-003", [{ キー: "A", コード: "F0505-NOIMG-001-003", 名: "画像なしカード", 買取: 500, 数量: 1, 言語: "EN" }]);
defineProductSeed("S-F05-05-CART-021", [{ キー: "A", コード: "F0505-A-021", 名: "モーダル確認カードF0505-021-A", 買取: 600, 数量: 0 }],
  "買取価格は正本の 100 円ではなく 600 円（100 円だと買取商品詳細に「カートに追加」ボタンが出ない。ケースは価格を確かめない）");
defineProductSeed("S-F05-05-CART-024", [
  { キー: "A", コード: "F0505-A-024", 名: "再計算確認カードF0505-024-A", 買取: 100, 数量: 2 },
  { キー: "B", コード: "F0505-B-024", 名: "再計算確認カードF0505-024-B", 買取: 200, 数量: 3 },
]);
defineProductSeed("S-F05-05-CART-025", [{ キー: "A", コード: "F0505-A-025", 名: "最後の明細削除確認カードF0505-025-A", 買取: 600, 数量: 2 }]);
defineProductSeed("S-F05-05-CART-026", [{ キー: "A", コード: "F0505-A-026", 名: "言語コード表示確認カードF0505-026-A", 買取: 600, 数量: 1, 言語: "EN" }]);
defineProductSeed("S-F05-05-CART-027", [{ キー: "A", コード: "F0505-A-027", 名: "同一規格加算確認カードF0505-027-A", 買取: 600, 数量: 0 }]);
defineProductSeed("S-F05-05-CART-028", [{ キー: "A", コード: "F0505-A-028", 名: "加算後ちょうど20確認カードF0505-028-A", 買取: 600, 数量: 0 }]);

const one = (キー: string, 名: string, 数量: number): 商品定義 => ({ キー: "A", コード: `F0505-${キー}-A`, 名, 買取: 600, 数量 });
defineProductSeed("S-F05-05-CBCART-030", [one("CB030", "組合せ加算確認カードF0505-CB030-A", 2)]);
defineProductSeed("S-F05-05-CBCART-031", [one("CB031", "組合せ新規追加確認カードF0505-CB031-A", 0)]);
defineProductSeed("S-F05-05-CBCART-032", [one("CB032", "組合せ上限超過確認カードF0505-CB032-A", 20)]);
defineProductSeed("S-F05-05-CBCART-033", [one("CB033", "組合せ21点追加確認カードF0505-CB033-A", 0)]);
defineProductSeed("S-F05-05-CBCART-034", [one("CB034", "組合せ更新前の数量変更確認カードF0505-CB034-A", 2)]);
defineProductSeed("S-F05-05-CBCART-037", [one("CB037", "組合せ一覧なし更新確認カードF0505-CB037-A", 2)]);
defineProductSeed("S-F05-05-CBCART-038", [one("CB038", "組合せカート無し更新確認カードF0505-CB038-A", 2)]);
const two = (キー: string, 名: string): 商品定義[] => [
  { キー: "A", コード: `F0505-${キー}-A`, 名: `${名}F0505-${キー}-A`, 買取: 600, 数量: 2 },
  { キー: "B", コード: `F0505-${キー}-B`, 名: `${名}F0505-${キー}-B`, 買取: 700, 数量: 3 },
];
defineProductSeed("S-F05-05-CBCART-035", two("CB035", "組合せ数量0取り外し確認カード"));
defineProductSeed("S-F05-05-CBCART-036", two("CB036", "組合せ20超更新中断確認カード"));

// ---- 空のカート（作るものが無い） ----

function defineEmptySeed(seedId: string): void {
  defineSeed(seedId, async ({ seed }) => { reportSeedIssue(seed.シードID, "投入不要（買取カートは空のまま。会員のシードでログインしたブラウザの買取カートは空から始まる）"); });
}
defineEmptySeed("S-F05-05-EMPTY-015");
defineEmptySeed("S-F05-05-EMPTY-023");
