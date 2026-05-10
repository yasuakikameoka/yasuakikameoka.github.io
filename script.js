(function () {
  const html = document.documentElement;

  function applyTheme(theme) {
    html.setAttribute('data-theme', theme);
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.textContent = '';
      btn.dataset.icon = theme === 'dark' ? 'sun' : 'moon';
      btn.setAttribute('aria-label', theme === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替');
    }
  }

  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;

    applyTheme(localStorage.getItem('theme') || 'light');

    btn.addEventListener('click', function () {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
    });
  });
})();
