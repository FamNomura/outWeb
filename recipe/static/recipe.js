let currentScale = 1;
let wakeLock = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. 材料内の [数値] をパースして初期化
    const recipeBody = document.getElementById('recipe-body');
    if (recipeBody) {
        // [300] や [1.5] のようなパターンを抽出して特殊なspan要素に置き換え
        recipeBody.innerHTML = recipeBody.innerHTML.replace(/\[([0-9.]+)]/g, (match, num) => {
            return `<span class="scaled-number" data-base="${num}">${num}</span>`;
        });
    }

    // 2. 作り方（手順リストのli）へのチェックボックス機能・レイアウト調整
    const steps = document.querySelectorAll('.tmpl-recipe .content ol li, .tmpl-recipe .content ul:not(.scaled-number) li');
    steps.forEach(step => {
        // 材料リストではなく、かつ「作り方」以下のliにのみ適用（簡易判定のためol内のliを優先）
        if (step.parentElement.tagName === 'OL') {
            step.classList.add('recipe-step-item');
            step.addEventListener('click', (e) => {
                // インプットやボタン、スライダー、リンクをクリックしたときはトグルしない
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'A') return;
                step.classList.toggle('step-completed');
            });
            
            // 子要素に画像がある場合、レイアウト調整用クラスを付与し、かつ中のテキストがフレックス崩れしないようラップする
            const img = step.querySelector('img');
            if (img) {
                step.classList.add('has-step-img');
                
                // テキストと画像以外のインライン要素をラップするコンテナを作成
                const textWrapper = document.createElement('div');
                textWrapper.className = 'recipe-step-text';
                
                // img 以外のすべての小要素（テキストノード、span等）を移植
                const childNodes = Array.from(step.childNodes);
                childNodes.forEach(node => {
                    if (node !== img) {
                        textWrapper.appendChild(node);
                    }
                });
                
                // step の中身を img と textWrapper だけに再構成
                step.appendChild(textWrapper);
            }
        }
    });
});

// 倍量変更処理
function updateServings(scale) {
    currentScale = scale;
    
    // スライダーと手入力欄の同期
    const slider = document.getElementById('serving-slider');
    const input = document.getElementById('serving-input');
    if (slider) slider.value = scale;
    if (input) input.value = scale;

    // クイック選択ボタンの active クラス更新
    document.querySelectorAll('.serving-selector button').forEach(btn => btn.classList.remove('active'));
    
    // 0.5, 1, 2, 3 のようなジャスト値の場合のみクイックボタンをアクティブにする
    const quickBtn = document.getElementById(`btn-serving-${scale}`);
    if (quickBtn) {
        quickBtn.classList.add('active');
    }

    // 分量の計算と画面更新
    document.querySelectorAll('.scaled-number').forEach(span => {
        const base = parseFloat(span.getAttribute('data-base'));
        const newVol = (base * scale).toFixed(1).replace(/\.0$/, ''); // 小数点以下が0なら丸める
        span.innerText = newVol;
    });
}

function changeServings(scale) {
    updateServings(scale);
}

function updateServingsFromSlider(val) {
    updateServings(parseFloat(val));
}

function updateServingsFromInput(val) {
    const scale = parseFloat(val);
    if (isNaN(scale) || scale <= 0) return;
    updateServings(scale);
}

// 画面の常時点灯（スリープ防止）
async function toggleWakeLock() {
    const btn = document.getElementById('btn-wakelock');
    if ('wakeLock' in navigator) {
        if (wakeLock === null) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
                btn.innerText = "📱 画面常時点灯: ON";
                btn.classList.add('wakelock-on');
            } catch (err) {
                alert("常時点灯の起動に失敗しました。");
            }
        } else {
            await wakeLock.release();
            wakeLock = null;
            btn.innerText = "📱 画面常時点灯: OFF";
            btn.classList.remove('wakelock-on');
        }
    } else {
        alert("お使いのブラウザは画面常時点灯に対応していません。");
    }
}

// LINE用テキストコピー機能
function copyRecipeText() {
    const title = document.title;
    const activeServing = document.querySelector('.serving-selector button.active').innerText;
    
    let text = `【${title} (${activeServing})】\n\n`;
    
    const recipeBody = document.getElementById('recipe-body');
    if (!recipeBody) return;
    
    // クローンを作成して、テキスト抽出用に加工
    const clone = recipeBody.cloneNode(true);
    
    // 画像やボタン類を消去
    clone.querySelectorAll('img, button, .recipe-controls').forEach(el => el.remove());
    
    // 各ブロックごとにテキストを整形
    const headers = clone.querySelectorAll('h1, h2, h3, h4');
    headers.forEach(h => {
        h.innerText = `\n■ ${h.innerText}\n`;
    });

    const items = clone.querySelectorAll('li');
    items.forEach(li => {
        li.innerText = `・${li.innerText}\n`;
    });

    text += clone.innerText.replace(/\n{3,}/g, '\n\n').trim();

    navigator.clipboard.writeText(text).then(() => {
        alert("レシピをクリップボードにコピーしました！LINE等に貼り付けて送信できます。");
    }).catch(err => {
        alert("コピーに失敗しました。お手数ですが手動で選択してコピーしてください。");
    });
}