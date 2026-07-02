/**
 * シード↔spec 契約（追加のみ・既存specは非改変）。
 *
 * e2e/seed/lib/seed-env.sh が manifest.json の envVars を export したものを、
 * default.config.ts と同じ `||=` 既定スタイルで再エクスポートする。
 * 今後の新規specは `import { ORDER_ID } from "../../../config/seed.config"` で参照できる。
 * 既存spec（process.env.ORDER_ID を直接読む）はそのまま動く。
 *
 * 値が未設定（シード未適用）の場合は空文字。spec 側の test.skip / test.fixme で自己スキップさせる。
 */
process.env.ORDER_ID ||= "";
process.env.MAIL_TEMPLATE_ID ||= "";
process.env.MAIL_TEMPLATE_DEFAULT_ID ||= "";
process.env.MAIL_TEMPLATE_MISSING_ID ||= "";
process.env.FRONT_MEMBER_ID ||= "";
process.env.FRONT_MEMBER_EMAIL ||= "";
process.env.CARD_SET_NAME_EN ||= "";

/** 受注メール/受注編集で参照する非破壊シード受注ID（SEED-M05-15-ORDER）。 */
export const ORDER_ID = process.env.ORDER_ID;
/** 受注メールの正常テンプレID（SEED-M05-15-TEMPLATE）。 */
export const MAIL_TEMPLATE_ID = process.env.MAIL_TEMPLATE_ID;
/** file_name 空の既定テンプレID（SEED-M05-15-DEFAULT-TPL）。 */
export const MAIL_TEMPLATE_DEFAULT_ID = process.env.MAIL_TEMPLATE_DEFAULT_ID;
/** file_name 実在しないテンプレID（SEED-M05-15-MISSING-TPL）。 */
export const MAIL_TEMPLATE_MISSING_ID = process.env.MAIL_TEMPLATE_MISSING_ID;
/** 会員変更用の既存会員ID／email（SEED-F06-CUSTOMER）。 */
export const FRONT_MEMBER_ID = process.env.FRONT_MEMBER_ID;
export const FRONT_MEMBER_EMAIL = process.env.FRONT_MEMBER_EMAIL;
/** カードCSV成功系が参照するカードセット英名（SEED-M14-05-MASTER）。 */
export const CARD_SET_NAME_EN = process.env.CARD_SET_NAME_EN;

/** 指定シードIDが未設定なら true（spec の test.skip 条件に使う）。 */
export const seedMissing = (...values: string[]): boolean =>
  values.some((v) => !v || v.length === 0);
