/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：配送先の新規登録_変更
課題カテゴリ：実装漏れ
課題：配送先の新規登録・変更画面の住所欄下に町名・番地の入力注意が表示されない
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. ログインした状態で商品をカートに入れ、http://localhost:8080/ja/shopping に進む
2. お届け先の追加導線から配送先の新規登録・変更画面（/ja/shopping/shipping_edit/{id}）を表示する
3. 住所欄の下に「※町名・番地の入力漏れにご注意ください。」が表示されるか確認する

# 期待される挙動【必須】
- 日本語の配送先新規登録・変更画面では、住所欄の下に「※町名・番地の入力漏れにご注意ください。」を表示する
- 英語テンプレートでは対応文言がないため表示対象外とする

# 現在の挙動【必須】
- ec-cube-enterprise の注文中配送先編集画面 `Shopping/shipping_edit.twig` は、日本国内住所の `pref` / `addr01` / `addr02` と海外住所の `addr01` / `addr02` / `addr03` を描画するが、住所欄下に `front.entry.address.note` や `front.mypage.delivery.address_help` を出力していない。これらの文言キーは存在し、会員登録画面やマイページ配送先編集では使われているが、注文中配送先編集では未使用。

ec-cube-enterprise 注文中配送先編集の住所欄は注意文なし: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:231-259`
```twig
                            {% if form.country.vars.value == constant('Eccube\\Entity\\Master\\Country::JAPAN') %}
                                <div class="p-hareruya-form-block p-hareruya-entry__address">
                                    <fieldset class="p-hareruya-form-block__fieldset">
                                        <legend class="p-hareruya-form-block__label-wrap">
                                            <span class="p-hareruya-form-block__label c-hareruya-heading--lev4">{{ 'common.address'|trans }}</span>
                                            <span class="c-hareruya-label--required">{{ 'common.required'|trans }}</span>
                                        </legend>
                                        <div class="p-hareruya-form-block__form-list">
                                            <div class="p-hareruya-form-block__fields">
                                                <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.pref.vars.id }}">{{ 'front.mypage.delivery.label_pref'|trans }}</label>
                                                <div class="c-hareruya-select c-hareruya-select--md p-hareruya-select{% if has_errors(form.address.pref) %} p-hareruya-select--error{% endif %}">
                                                    {{ form_widget(form.address.pref) }}
                                                    <i class="icon-hareruya-arrow-down c-hareruya-icon--xs" aria-hidden="true"></i>
                                                </div>
                                                {{ form_errors(form.address.pref) }}
                                                <div class="c-hareruya-form-input">
                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr01'|trans }}</label>
                                                    {{ form_widget(form.address.addr01, { attr: { class: 'c-hareruya-form-input__field p-locality p-street-address', placeholder: 'common.address_sample_01', 'data-old-font-check': 'true' } }) }}
                                                    {{ form_errors(form.address.addr01) }}
                                                </div>
                                                <div class="c-hareruya-form-input">
                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr02'|trans }}</label>
                                                    {{ form_widget(form.address.addr02, { attr: { class: 'c-hareruya-form-input__field p-extended-address', placeholder: 'common.address_sample_02', 'data-old-font-check': 'true' } }) }}
                                                    {{ form_errors(form.address.addr02) }}
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>
```

ec-cube-enterprise 海外住所欄にも入力注意なし: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:260-288`
```twig
                            {% else %}
                                <div class="p-hareruya-form-block p-hareruya-entry__address-overseas">
                                    <fieldset class="p-hareruya-form-block__fieldset">
                                        <legend class="p-hareruya-form-block__label-wrap">
                                            <span class="p-hareruya-form-block__label c-hareruya-heading--lev4">{{ 'common.address'|trans }}</span>
                                            <span class="c-hareruya-label--required">{{ 'common.required'|trans }}</span>
                                        </legend>
                                        <div class="p-hareruya-form-block__form-list">
                                            <div class="p-hareruya-form-block__fields">
                                                <div class="c-hareruya-form-input">
                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr01.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_1'|trans }}</label>
                                                    {{ form_widget(form.address.addr01, { attr: { class: 'c-hareruya-form-input__field', placeholder: 'common.address_sample_01' } }) }}
                                                    {{ form_errors(form.address.addr01) }}
                                                </div>
                                                <div class="c-hareruya-form-input">
                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr02.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_2'|trans }}</label>
                                                    {{ form_widget(form.address.addr02, { attr: { class: 'c-hareruya-form-input__field', placeholder: 'common.address_sample_02' } }) }}
                                                    {{ form_errors(form.address.addr02) }}
                                                </div>
                                                <div class="c-hareruya-form-input">
                                                    <label class="u-hareruya-dsp-visually-hidden" for="{{ form.address.addr03.vars.id }}">{{ 'front.mypage.delivery.label_addr_overseas_3'|trans }}</label>
                                                    {{ form_widget(form.address.addr03, { attr: { class: 'c-hareruya-form-input__field', placeholder: 'common.address_sample_03' } }) }}
                                                    {{ form_errors(form.address.addr03) }}
                                                </div>
                                            </div>
                                        </div>
                                    </fieldset>
                                </div>
                            {% endif %}
```

ec-cube-enterprise 文言キーは存在するが別画面で使用: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:464-748`
```yaml
front.entry.address.note: 町名・番地の入力漏れにご注意ください。
front.entry.error.address_required: 住所を入力してください
front.entry.error.postal_code_required: 郵便番号を入力してください
front.entry.error.postal_code_number: 郵便番号は数字のみ入力してください
front.entry.error.tel_required: 電話番号を入力してください
front.entry.error.tel_number: 電話番号は数字のみ入力してください
front.entry.error.pref_required: 都道府県を選択してください
front.entry.error.name01_required: 姓を入力してください
front.entry.error.name02_required: 名を入力してください
front.entry.error.kana01_required: セイを入力してください
front.entry.error.kana02_required: メイを入力してください
front.entry.error.kana_only: カタカナで入力してください
front.entry.error.birth_year_required: 生年月日(年)を選択してください
front.entry.error.birth_month_required: 生年月日(月)を選択してください
front.entry.error.birth_day_required: 生年月日(日)を選択してください
front.entry.error.email_required: メールアドレスを入力してください
front.entry.error.email_second_required: メールアドレス(確認)を入力してください
front.entry.error.email_invalid: 有効なメールアドレスを入力してください
front.entry.error.email_mismatch: メールアドレスが一致しません
front.entry.error.password_required: パスワードを入力してください
front.entry.error.password_second_required: パスワード(確認)を入力してください
front.entry.error.password_minlength: 'パスワードは%min%文字以上で入力してください'
front.entry.error.password_mismatch: パスワードが一致しません
front.entry.error.postal_code_alphanumeric: 郵便番号は英数字のみ入力してください
front.entry.error.country_required: 国を選択してください
front.mypage.delivery.error.address_name_required: 配送先名称を入力してください

#------------------------------------------------------------------------------------
# パスワード再発行
#------------------------------------------------------------------------------------

front.forgot.title: パスワードの再発行
front.forgot.message1: ご登録時のメールアドレスを入力して「次のページへ」ボタンをクリックしてください。
front.forgot.message2: ※新しくパスワードを発行いたしますので、お忘れになったパスワードはご利用できなくなります。
front.forgot.message3: 登録されているメールアドレスと新しいパスワードを入力して変更ボタンをクリックしてください。
front.forgot.next: 次のページへ
front.forgot.complete_title: パスワード再発行
front.forgot.complete_breadcrumb_title: パスワード再発行メール送信完了
front.forgot.complete_message__title: パスワード再発行メールの送信が完了しました。
front.forgot.complete_message__body: |
  メールのURLをクリックして新しいパスワードを設定してください。
front.forgot.complete_button_top: ホームへ戻る
front.forgot.reset_title: パスワード再設定
front.forgot.reset_complete: パスワードを変更しました。
front.forgot.reset_error: 有効期限が切れているか、無効なURLです。
front.forgot.reset_not_found: 入力内容を確認してください。
front.forgot.reset_label__email: 登録されているメールアドレス
front.forgot.reset_label__password: 新しいパスワード
front.forgot.reset_password_note:  |
  半角英数字記号 %min%文字以上、%max%文字以内で入力してください。
  IDと同様のパスワードは入力できません。
front.forgot.reset_label__password_confirm: 新しいパスワード（確認）
front.forgot.reset_password_confirm: （確認のためもう一度入力してください）
front.forgot.reset_submit: 変更する
front.forgot.reset_breadcrumb_title: パスワード登録
front.forgot.reset_complete_breadcrumb_title: パスワード再設定完了

#------------------------------------------------------------------------------------
# 当サイトについて/特定商取引法/...
#------------------------------------------------------------------------------------

front.about.title: 当サイトについて
front.about.business_hour: 店舗営業時間
front.about.good_traded: 取り扱い商品
front.about.message: メッセージ
front.agreement.title: 利用規約
front.tradelaw.title: 特定商取引法に基づく表記
front.privacy.title: プライバシーポリシー
front.agreement.heading: "晴れる屋　利用規約"
front.agreement.s1.title: "1. 適用範囲"
front.agreement.s1.body: "本利用規約は株式会社晴れる屋（以下「私達」といいます）の提供する晴れる屋のサービスを利用される場合に、利用される方（以下「利用者」といいます）全員に適用され、 利用者はこれを遵守する義務を負います。晴れる屋がサービスについて掲示し、または利用者に連絡する方針・告知等の一切は、本規約の一部であり、利用者は、本規約と一体のものとしてこれを遵守する義務を負います。なお、かかる告知等に本規約に相反しまたは矛盾する内容が記載される場合、かかる告知等を優先して適用します。"
front.agreement.s2.title: "2. 晴れる屋のご利用について"
front.agreement.s2.body: "晴れる屋をご利用いただく場合、利用者には本規約の条項を熟読、理解した上で利用を開始する義務を負います。また書き込み・投稿・問合せを行う場合は、あらかじめ送信方法・送信内容に問題がないことを確認する義務を負うこととします。"
front.agreement.s3.title: "3. 投稿・書き込みに関して"
front.agreement.s3.body: "利用者は、本規約記載事項を遵守した上で投稿・書き込みをすることができます。ただし、晴れる屋の各サービスにおいて利用者が書き込んだ内容に関しては 書き込んだ利用者が一切の責任を負うこととし、 私達はこれに関して一切責任を負わないものとします。利用者が晴れる屋を利用したことにより第三者との間に紛争が生じた場合、 利用者は自己の責任と費用をもってかかる紛争の一切を解決するものとし、 当サイトには何等の迷惑も損害も及ぼしてはならないものとします。 利用者が本規約に違反して私達に損害を及ぼした場合、私達は当該利用者に対し、被った損害の賠償を請求できるものとします。"
front.agreement.s4.title: "4. 知的財産権"
front.agreement.s4.body1: "利用者の投稿・書き込み等によって 晴れる屋において掲示・表示される内容に関する著作権については、 投稿・書き込みが私達のコンピュータに届いた時点で、利用者は、私達に対して、当該投稿・書き込みを日本の国内外において 無償で非独占的に使用する （複製、公衆送信可能化、公開、送信、頒布、譲渡、貸与、翻訳、翻案、編集を含む） 権利を許諾（再許諾権を含む）したものとします。 また、利用者は、投稿・書き込みについて著作者人格権を行使しないものとします。 利用者は、本規約において認められる範囲外で他の利用者の投稿・書き込み内容を 複写したり利用したりすることはできません。 利用者は、晴れる屋のサイトに掲示・表示されるいかなるコンテンツも 晴れる屋における使用のため以外の目的で複写しまたは利用してはならないものとします。 また、利用者は、第三者への提供のためにかかるコンテンツを複製し、頒布し、送信し、または他のホームページ・Webサイト等にアップロードもしくは使用することはできません。"
front.agreement.s4.body2: "晴れる屋のサイトからリンクしているWebサイトは、他の運営者により運営されているものです。各Webサイトの掲載内容については、各自の責任においてご利用下さい。当ウェブサイトでは一切の責任を負いかねます。ご了承の上ご利用下さい。"
front.agreement.s4.body3: "マジック：ザ・ギャザリングはWizards of the Coast, LLCの登録商標であり、それらのロゴ、シンボル、全てのカード、また、マジック：ザ・ギャザリングに関わる全ての権利についてはWizards of the Coast, LLCにお問い合わせください。全てのデッキリストは、掲載元であるWebサイトから転載の許可を得て、掲載しています。このサイトは、Wizards of the Coast, LLCが運営する公式なサイトではありません。上記を除く全ての権利は株式会社晴れる屋が保有しています。"
front.agreement.s5.title: "5. 個人情報について"
front.agreement.s5.body1: "晴れる屋では、利用者の確認やサービスの向上のために 個人情報をご提供頂く事があります。"
front.agreement.s5.body2: "ご提供頂いた個人情報は、「個人情報の保護に関する法律」及び私達にて別途定める 「個人情報保護方針」 に従って、利用、保護、管理されます。"
front.agreement.s6.title: "6. 禁止行為"
front.agreement.s6.intro: "本規約における他の禁止事項に加え、利用者が次の行為を行うことを禁止します。"
front.agreement.s6.li1: "虚偽の情報を故意に送信すること"
front.agreement.s6.li2: "勧誘目的の投稿・書き込み"
front.agreement.s6.li3: "自己を主張し、もしくは他を害するなどの目的で同一の情報を意図的に多数回送信すること"
front.agreement.s6.li4: "公序良俗に反する行為"
front.agreement.s6.li5: "犯罪的行為に結びつく行為"
front.agreement.s6.li6: "他の利用者または第三者の知的所有権、財産、信用、プライバシーを侵害する行為"
front.agreement.s6.li7: "他の利用者または第三者に不利益を与える行為"
front.agreement.s6.li8: "他の利用者または第三者を誹謗中傷している行為"
front.agreement.s6.li9: "選挙の事前運動、選挙運動またはこれらに類似する行為、および公職選挙法に抵触する行為"
front.agreement.s6.li10: "未成年者に対し悪影響があると判断される行為"
front.agreement.s6.li11: "晴れる屋の運営を妨げ、または、私達の信用を毀損する行為"
front.agreement.s6.li12: "コンピューターウィルス等の有害なコンピュータプログラムの送信"
front.agreement.s6.li13: "私達のメール・ホームページの内容の無断転載及び再配布"
front.agreement.s6.li14: "法律に反する行為"
front.agreement.s6.li15: "その他、私達が不適当と判断した行為"
front.agreement.s6.outro: "利用者が上記の禁止行為を行った場合 またはかかる行為を行うおそれが高いと私達が判断する場合、私達はかかる利用者について、利用者としての権利の一部またはすべてを暫定的に停止できるものとします。なお、この場合、権利の停止されたことによりかかる利用者に生じる損害に対して私達は一切責任を負いません。"
front.agreement.s7.title: "7. 投稿・書き込みの削除"
front.agreement.s7.intro: "私達は、次の場合、利用者が晴れる屋に投稿し、書き込み、または貼り付けた内容、画像、映像、音声またはその他のデジタルデータ等をかかる利用者本人に通知することなく削除できるものとします。ただし、これは、私達が利用者の行為すべてについて管理責任を義務として負うことを意味するものではありません。"
front.agreement.s7.li1: "書き込み内容、画像、音声などが本利用規約「禁止行為」に該当し、または本利用規約の他の規定に違反すると私達が判断した場合"
front.agreement.s7.li2: "書き込まれた内容が文字化けし一般の利用者による判読が不可能であると私達が判断した場合"
front.agreement.s7.li3: "同一内容の書き込みが重複して行われた場合"
front.agreement.s7.li4: "晴れる屋での書き込みの表示処理スピードが著しく遅くなりまたは遅くなる恐れがある場合、または私達のサーバーの処理に著しい負担になると私達が判断した場合"
front.agreement.s7.li5: "私達が他の利用者、または第三者より相応の理由および根拠をもって書き込みの削除を依頼された場合"
front.agreement.s8.title: "8. 免責事項"
front.agreement.s8.body1: "私達は、利用者による投稿・書き込みのうち私達が不適切と判断する部分を、私達の判断によって変更し修正することができるものとします。"
front.agreement.s8.body2: "私達は、利用者による投稿・書き込みに関して 調査する権利を持ちますが調査義務を負わないものとします。"
front.agreement.s8.body3: "晴れる屋に接続が困難、不可能、あるいは一部または全部のサービスが不完全、または完全に提供されない場合、通信インフラの事故・障害・その他の不調またはその他の理由によるシステム障害等により、 利用者の書き込んだ内容の一部、または全部が消失する可能性がありますが、私達はこれの責任を一切負わないものとします。また本サイトに接続できるユーザーは当該障害について私達に対して 一切の責任の追求ができないものとします。"
front.agreement.s8.body4: "晴れる屋の店頭にて買取査定をお申込みいただいた場合、当社が連絡後1ヶ月以内に正当な理由なく受取りに来られなかった買取希望品は、お客様が所有権を放棄したものとみなし、その所有権は無償で当社に移転するものとします。"
front.agreement.s8.body5: "私達の提供するサービスに関して紛争が生じ、私達が利用者または第三者からクレームを受け、 裁判所において損害賠償その他の責任を認定され、その支払いに応じた場合には、私達は、当該トラブルの原因を作出した利用者に対し、当該紛争にかかる一切の費用（賠償金、訴訟費用および弁護士費用を含む）を請求できるものとします。"
front.agreement.s9.title: "9. システムの変更,サービス内容の変更および運営の停止・中断,終了"
front.agreement.s9.intro: "私達は、利用者に事前に通知することなく、晴れる屋のユーザーインターフェイス、システムまたはサービス内容を変更することができるものとします。私達は、次の各号のいずれかの事態が生じた場合、一時的にサービスの全部または一部を中断することがあります。私達は、可能な限り、予め晴れる屋においてその旨を利用者に告知致しますが、緊急やむを得ない場合は、利用者に事前に通知することなくサービスの中断を致します。"
front.agreement.s9.li1: "サービス用設備、システム等の保守の必要がある場合"
front.agreement.s9.li2: "停電、火災等、社会インフラの障害によりサービスが提供できない場合"
front.agreement.s9.li3: "天災、戦争、暴動等の不可抗力でサービスの提供ができない場合"
front.agreement.s9.li4: "法令に基づく措置によりサービスが提供できない場合"
front.agreement.s9.li5: "その他、運営上、技術上の理由によりサービスの中断が必要であると私達が判断した場合"
front.agreement.s9.outro: "私達は、理由の如何を問わず、私達の判断により、晴れる屋のサービスの一部または晴れる屋の運営を終了することができるものとします。 その場合、私達は、終了予定日から少なくとも30日前までに晴れる屋において 利用者にその旨告知致します。 晴れる屋の運営終了後、私達は、 私達のサーバーに保管される投稿・書き込みその他メッセージ等を 私達の判断で抹消することができるものとします。 本章に基いてサービスの変更ないし運営の中断および終了がなされた場合、 私達は、これに起因して生じた利用者の損害につき責任を負わないものとします。"
front.agreement.s10.title: "10. 規約の改訂・修正"
front.agreement.s10.body: "私達は利用者に事前の告知・通知を行うことなく 本規約を改訂・修正することができるものとします。 この場合、本ページに新しい規約を記載・掲示することによってかかる改訂・修正の効力が生じるものとします。"
front.agreement.s11.title: "11. 準拠法、合意管轄"
front.agreement.s11.body: "本規約の準拠法は日本法とします。また、私達と利用者との間で生じた紛争については、私達の住所地を管轄する裁判所を第一審の専属管轄裁判所とします。"
front.agreement.established: "制定日　平成27年 4月 22日"
front.privacy.heading: "晴れる屋　個人情報保護方針"
front.privacy.intro1: "晴れる屋で取り扱う個人情報は「個人情報保護方針」に掲げた方針に従って、安全に管理し、かつ目的に添って正しく利用いたします。"
front.privacy.intro2: "晴れる屋では、お客様が晴れる屋ウェブサイトでの個人情報の取り扱いとセキュリティについて、同意されていることを前提として、サービスを提供しています。記載されている内容は、お客様により安全で安心なサービスを提供するために、変更・改訂されることがあり、同時に同意されたとみなされますので、あらかじめご了承ください。"
front.privacy.s1.title: "1.お客様の個人情報を取扱うにあたっては、あらかじめ、その利用目的を特定いたします。"
front.privacy.s1.body: "晴れる屋で取り扱う、お客様の氏名・生年月日・住所・電話番号・商品購買履歴・メールアドレス等の個人情報は以下の目的で利用いたします。"
front.privacy.s1.li1: "お買い上げ明細書、商品明細請求書、決済利用案内メール、メールマガジン等の送付"
front.privacy.s1.li2: "商品のお届け及び「ご注文受付メール（お客様氏名を記載）」"
front.privacy.s1.li3: "アフターサービス（お客様からの問い合わせ等含む）の提供"
front.privacy.s1.li4: "その他弊社商品の売買に必要な行為"
front.privacy.s1.li5: "情報分析（購入者層の分析など）"
front.privacy.s1.li6: "晴れる屋からの商品の発送、カタログの送付、関連するサービス、新商品・サービスに関する情報のお知らせのため"
front.privacy.s1.li7: "晴れる屋の通信販売、店舗や催事に関するご案内などの情報をお届けするため"
front.privacy.s2.title: "2.お客様の個人情報は、お客様へのサービスの提供に必要なものに限り、必要以上に情報を取得することはいたしません。"
front.privacy.s3.title: "3.お客様から個人情報をお預かりする際は、その利用目的を明らかにします。"
front.privacy.s4.title: "4.お客様の個人情報を利用する際は、お客様に同意を頂いた利用目的の範囲内で行います。"
front.privacy.s5.title: "5.お客様の個人情報への不正アクセス、紛失、破壊、改ざんおよび漏えいなどのリスクに対し、必要かつ適切な安全対策を講じます。"
front.privacy.s6.title: "6.お客様の個人情報保護を徹底し、個人情報の適切な管理に努めます。"
front.privacy.s6.body: "また、従業者の教育・啓発に努め、個人情報保護意識の高揚を図るとともに、個人情報の安全管理が図られるよう従業者を必要かつ適切に監督いたします。"
front.privacy.s7.title: "7.お客様の個人情報の取扱いを委託する際は、個人情報の安全管理が図られるよう委託先を必要かつ適切に監督いたします。"
front.privacy.s8.title: "8.お客様の個人情報については、お客様の同意をいただいた場合、または法令の規定や公衆の生命・財産などの重大な利益を保護するために必要な場合を除き、第三者に提供することはいたしません。"
front.privacy.s9.title: "9.晴れる屋ホームページにてお客様から収集させていただいた個人情報は、以下のいずれかに該当する場合を除き、第三者に提供・開示等をすることはありません。"
front.privacy.s9.li1: "お客様の事前の同意・承諾を得た場合"
front.privacy.s9.li2: "個人情報に関する機密保持契約を締結している業務委託会社に対して、お客様に明示した利用目的の達成に必要な範囲で個人情報の取扱いを委託する場合（例：業務委託会社とは、商品配送を請負う宅配業者、カタログ配送のための宛名ラベルの印刷会社、クレジットカードを支払い時に希望されたカード会社など）"
front.privacy.s9.li3: "個人情報を共同利用する関係会社に対して、お客様に明示した利用目的の達成に必要な範囲で個人情報を共同利用する場合"
front.privacy.s9.li4: "クレジットカード会社よりカード不正利用の調査のため照会があった場合"
front.privacy.s9.li5: "クレジットカード会社がおこなう不正利用検知・防止の為、3Dセキュアを通じて会員が利用するクレジットカード会社への提供を求められた場合"
front.privacy.s9.li6: "法令等に基づき、提供に応じなければならない場合"
front.privacy.s10.title: "10.お客様の個人情報を正確かつ最新の内容に保つよう努めます。"
front.privacy.s10.body: "またお客様ご自身の個人情報の開示、訂正、利用停止などに合理的な範囲で対応いたします。"
front.privacy.s11.title: "11.外部からの不正アクセスやシステム障害から生じた損害及びシステムを利用できないことによって生じる不利益に対して当社は一切責任を負うものではありません。"
front.privacy.s12.title: "12.個人情報の取り扱いに関する問い合わせ窓口　TEL：03－5332－7544"
front.privacy.s13.title: "13.当ポリシーの内容を継続的に見直し、その改善に努めます。"
front.guide.title: ご利用ガイド

#------------------------------------------------------------------------------------
# マイページ
#------------------------------------------------------------------------------------

front.mypage.welcome: "ようこそ%last_name% %first_name%さん"
front.mypage.title: マイページ
front.mypage.login.member_section_title: 会員の方
front.mypage.login.placeholder_mail: メールアドレス
front.mypage.login.member_lead: メールアドレスとパスワードを入力してログインしてください。
front.mypage.login.guest_section_title: 初めてご利用の方
front.mypage.login.guest_lead: |
  初めてご利用のお客様は、こちらから会員登録を行ってください。
  メールアドレスとパスワードを登録しておくと便利にお買い物ができる様になります。
front.mypage.login.forgot_password: パスワードお忘れの方はこちら
front.mypage.login.register: 会員情報登録
front.mypage.welcome__point: "現在の所持ポイントは %point%pt です。"
front.mypage.nav__history: ご注文履歴
front.mypage.nav__history_detail: 購入履歴詳細
front.mypage.nav__favorite: お気に入り商品
front.mypage.nav__customer: 会員情報編集
front.mypage.nav__customer_complete: 会員情報編集(完了)
front.mypage.nav__customer_address: お届け先一覧
front.mypage.nav__notifylist: 入荷待ち商品一覧
front.mypage.nav__shopping_history: 購入履歴
front.mypage.nav__withdrow: 退会
front.mypage.nav__identification: オンライン本人確認
front.mypage.nav__identification_photograph: 撮影画面
front.mypage.nav__identification_complete: 申請完了
front.mypage.nav__event_history: マイイベント・デッキ登録
front.mypage.event_history.breadcrumb_title: 大会デッキ登録
front.mypage.event_history.header__event_list: イベント一覧
front.mypage.event_history.label__format: フォーマット
front.mypage.event_history.label__date: 開催日時
front.mypage.event_history.label__status: 処理状態
front.mypage.event_history.label__deck: デッキ登録
front.mypage.event_history.status__finished: イベント終了
front.mypage.event_history.status__not_applied: 未申込
front.mypage.event_history.status__processing_payment: 決済中
front.mypage.event_history.status__nothing_order_id: '支払い番号が<br class="u-hareruya-dsp-pc">存在しない'
front.mypage.event_history.status__processing_payment_help: "決済が中断されましたらお手数ですが、<br>約30分後に再度お申込みいただけますよう<br>お願いいたします"
front.mypage.event_history.deck__registered: 登録済み
front.mypage.event_history.deck__not_registered: 未登録
front.mypage.event_history.btn__deck_edit: デッキ編集
front.mypage.event_history.btn__deck_register: デッキ登録
front.mypage.event_history.empty: 予約済みの大会はありません。
front.mypage.event_history.btn__find_event: イベントを探す
front.mypage.history_count: "件数:"
front.mypage.history_count_suffix: "%count%件"
front.mypage.history_not_found: ご注文履歴はありません。
front.mypage.message_not_found: 記載なし
front.mypage.view_detail: 詳細を見る
front.mypage.order_no: 注文番号
front.mypage.order_status: 処理状態
front.mypage.order_date: 注文日
front.mypage.shipping_date: 出荷日
front.mypage.use_point: ご利用ポイント
front.mypage.add_point: 加算ポイント
front.mypage.delivery_info: 配送情報
front.mypage.delivery: お届け先
front.mypage.delivery_provider: 配送方法
front.mypage.delivery_date: お届け日
front.mypage.delivery_time: お届け時間
front.mypage.current_price: 【現在価格】
front.mypage.reorder: 再注文する
front.mypage.payment_info: お支払い情報
front.mypage.payment: 支払方法
front.mypage.message: お問い合わせ
front.mypage.identification: オンライン本人確認について
front.mypage.reorder_message: ※金額が変更されている商品があるため、再注文時はご注意ください。
front.mypage.mail_not_found: メール履歴はありません。
front.mypage.mail_list: メール配信履歴一覧
front.mypage.customer_complete_message__title: 会員登録内容の変更が完了いたしました。
front.mypage.customer_complete_message__body: それでは、引き続きショッピングをお楽しみください。
front.mypage.favorite_count: "%count%件のお気に入りがあります"
front.mypage.favorite_not_found: お気に入りは登録されていません。
front.mypage.favorite_list.page_title: お気に入り商品一覧
front.mypage.favorite_list.lead: 下記の商品が入荷した際、ご登録されているメールアドレスにお知らせをお送りいたします。
front.mypage.favorite_list.sale_only: セール対象のみ
front.mypage.favorite_list.product_count_prefix: "商品数:"
front.mypage.favorite_list.product_count_suffix: "%count%点"
front.mypage.favorite_list.sort_label: 並べ替え
front.mypage.favorite_list.stock: "在庫 %count%"
front.mypage.favorite_list.price_placeholder: "-"
front.mypage.favorite_list.same_card_search: 同名商品検索
front.mypage.favorite_list.remove_from_favorite: お気に入りから削除
front.mypage.favorite_list.back_mypage: マイページへ戻る
front.mypage.favorite_list.sold_out: SOLD OUT
front.mypage.favorite_list.aria_product_image: 商品詳細へ
front.mypage.favorite_list.aria_zoom_image: 商品画像を拡大
front.mypage.favorite_list.image_zoom_overlay: 画像を拡大
front.mypage.favorite_list.popup_link_html: "お気に入り一覧を<br>表示"
front.mypage.favorite_list.aria_decrease_qty: 数量を減らす
front.mypage.favorite_list.aria_increase_qty: 数量を増やす
front.mypage.favorite_list.aria_quantity_input: 数量を入力
front.mypage.customer_address_count: "%count%件のお届け先があります"
front.mypage.customer_address_not_found: お届け先は登録されていません。
front.mypage.add_customer_address: "新規お届け先を追加する"
front.mypage.withdraw_confirm_page__title: 退会手続き
front.mypage.withdraw_complete_page__title: 退会完了
front.mypage.withdraw_message__title: 退会手続きの前に、ご確認ください。
front.mypage.withdraw_message__body: 会員を退会された場合、現在保存されている購入履歴や個人情報はすべて削除されますが、よろしいでしょうか？
front.mypage.withdraw_execute_message__title: 退会手続きを実行してもよろしいでしょうか？
front.mypage.withdraw_execute_message__body_label: '[注意事項]'
front.mypage.withdraw_execute_message__body: '退会手続きが完了しますと、現在保存されている購入履歴や個人情報は全て削除されます。'
front.mypage.withdraw_confirm: 退会手続きへ
front.mypage.withdraw_cancel: 戻る
front.mypage.withdraw_execute: 退会する
front.mypage.withdraw_password: パスワード
front.mypage.withdraw_password__hint: 現在のパスワードを入力し、「退会する」ボタンを押してください。
front.mypage.withdraw_error__password_mismatch: パスワードに誤りがあります。
front.mypage.withdraw_error__smaregi: 退会処理の途中でエラーが発生しました。
front.mypage.withdraw_complete_message__title: 退会が完了いたしました
front.mypage.withdraw_complete_message__body: |
  ご利用ありがとうございました。
  またのご利用をお待ちしております。
front.mypage.customer.notify_title: 会員情報編集
front.mypage.delivery.notify_title: お届け先情報編集
front.mypage.delivery.list_intro: 配送先の情報をアドレス帳に登録しておくことができます。
front.mypage.delivery.add_address_button: 新しい住所を追加
front.mypage.delivery.company_prefix: "会社名: "
front.mypage.delivery.tel_abbr: "TEL:"
front.mypage.delivery.address_untitled: お届け先 %num%
front.mypage.delivery.shipping_name_label: 配送先氏名
front.mypage.delivery.edit_notice: 既にいただいています（準備中も含む）ご注文の注文者ならびに配送先の情報は変更されませんので、変更が必要な場合は弊社へご連絡をお願い致します。
front.mypage.delivery.address_help: 町名・番地の入力漏れにご注意ください。
```
- ベース実装 pf-eccube3 の注文中配送先編集テンプレートは、住所入力（都道府県・住所1・住所2）の直下に `<p class="regist-usrdata__data__attention">※町名・番地の入力漏れにご注意ください。</p>` を表示している。

ベース実装 pf-eccube3 住所欄下の入力注意: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig:132-150`
```twig
                <li class="regist-usrdata">
                    <div class="regist-usrdata__title">
                        <img class="must-input-data" src="{{ path('assets', {path: 'img/sys/check.gif'}) }}" alt="必須">住所
                    </div>
                    <div class="regist-usrdata__data">
                        <span class="efo checktype_pref is_required">
                            <span class="efo checktype_pref is_required">
                                {{ form_widget(form.pref, { attr : { class: 'classrequired' }}) }}
                                {% if form.pref.vars.attr['hidden'] is not defined or form.pref.vars.attr['hidden'] != 'hidden' %}<br>{% endif %}
                                {{ form_widget(form.addr01, { attr : { placeholder: '(例)新宿区高田馬場', class: 'classrequired'}}) }}<br>
                                {{ form_widget(form.addr02, { attr : { placeholder: '(例)3-12-2 OCビル2F', class: 'classrequired'}}) }}
                                {{ form_errors(form.pref) }}
                                {{ form_errors(form.addr01) }}
                                {{ form_errors(form.addr02) }}
                            </span>

                        </span>
                        <p class="regist-usrdata__data__attention">※町名・番地の入力漏れにご注意ください。</p>
                    </div>
```

# 根拠
- 設計：
  - 住所欄下の入力注意: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2077-2078`
- ec-cube-enterprise：
  - 注文中配送先編集の住所欄に入力注意がない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig:231-288`
- ベース実装：
  - pf-eccube3では住所欄直下に入力注意を表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig:132-150`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json#f04-03_0304_sheet-5_sheet-conformance-eb1c8bd8f973'`
- 確認コマンド: `python3 - <<'PY' ... search excel_to_html/output/0304_基本設計仕様書(フロント_注文).html for 町名・番地 and 入力注意 ... PY`
- 確認コマンド: `rg -n "町名・番地|address_help|address\.note|入力漏れ" ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage ec-cube-enterprise/src/Eccube/Resource/template/default/Entry ec-cube-enterprise/src/Eccube/Resource/locale pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage pf-eccube3/app/Plugin/HareruyaEc/Resource/locale`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/shipping_edit.twig | sed -n '215,300p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/delivery_edit.twig | sed -n '132,154p'`
