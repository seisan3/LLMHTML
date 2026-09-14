'use strict';
const search = document.querySelector('#search');
const group = document.querySelector('#group');
const layer = document.querySelector('#layer');
const rows = [...document.querySelectorAll('tr.case')];
function filter() {
  const terms = search.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  let count = 0;
  for (const row of rows) {
    const visible = (!group.value || row.dataset.group === group.value) &&
      (!layer.value || row.dataset.known.split(' ').includes(layer.value)) &&
      terms.every(term => /^i06r-\d{4}-\d{2}$/.test(term)
        ? row.dataset.id.toLowerCase() === term
        : row.dataset.search.toLocaleLowerCase().includes(term));
    row.hidden = !visible;
    if (visible) count++;
  }
  document.querySelector('#result-count').textContent = `${count} / ${rows.length}件`;
  document.querySelector('#empty').hidden = count !== 0;
}
search.addEventListener('input', filter);
group.addEventListener('change', filter);
layer.addEventListener('change', filter);
document.querySelector('#reset').addEventListener('click', () => { search.value = group.value = layer.value = ''; filter(); });
const dialog = document.querySelector('#detail-dialog');
document.querySelectorAll('.detail-button').forEach(button => button.addEventListener('click', () => {
  document.querySelector('#detail-body').replaceChildren(document.getElementById(button.dataset.detail).content.cloneNode(true));
  dialog.showModal();
  dialog.scrollTop = 0;
}));
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
