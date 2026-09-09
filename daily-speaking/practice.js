'use strict';
const day = document.body.dataset.day;
if (day) {
  let practicing = false;
  const practice = document.querySelector('#practice');
  practice.addEventListener('click', () => {
    practicing = !practicing;
    practice.setAttribute('aria-pressed', String(practicing));
    practice.textContent = practicing ? '返答をすべて表示' : '返答を隠す';
    document.querySelectorAll('.answer').forEach(el => el.hidden = practicing);
    document.querySelectorAll('.reveal').forEach(el => {
      el.hidden = !practicing;
      el.setAttribute('aria-expanded', String(!practicing));
      el.textContent = '返答を見る';
    });
  });
  document.querySelector('#translation').addEventListener('click', e => {
    const hidden = document.body.classList.toggle('hide-ja');
    e.currentTarget.textContent = hidden ? '日本語訳を表示' : '日本語訳を隠す';
    e.currentTarget.setAttribute('aria-pressed', String(!hidden));
  });
  document.querySelectorAll('.reveal').forEach(button => button.addEventListener('click', () => {
    const answer = document.getElementById(button.getAttribute('aria-controls'));
    answer.hidden = !answer.hidden;
    button.setAttribute('aria-expanded', String(!answer.hidden));
    button.textContent = answer.hidden ? '返答を見る' : '返答を隠す';
  }));
  const boxes = [...document.querySelectorAll('[data-scene]')];
  const key = `daily-speaking:day${day}:v1`;
  const note = document.querySelector('#storage-note');
  const update = () => document.querySelector('#progress').textContent = `${boxes.filter(b => b.checked).length} / ${boxes.length} 練習済み`;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(saved)) boxes.forEach(b => b.checked = saved.includes(b.dataset.scene));
  } catch { note.textContent = 'このブラウザーでは記録を読み込めません。練習はそのまま使えます。'; }
  boxes.forEach(box => box.addEventListener('change', () => {
    update();
    try { localStorage.setItem(key, JSON.stringify(boxes.filter(b => b.checked).map(b => b.dataset.scene))); }
    catch { note.textContent = '記録を保存できません。ページを閉じると練習済みの印が戻ります。'; }
  }));
  update();
}
