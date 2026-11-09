(() => {
  if (!document.body.classList.contains('trust-page')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const request = document.getElementById('request');
  const heading = request?.querySelector('h2');
  let arrivalTimer;
  if (request && heading) {
    document.querySelectorAll('a[href="#request"]').forEach(link => link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      document.querySelectorAll('.site-mobile-menu[open],.site-services-menu[open]').forEach(menu => { menu.open = false; });
      if (location.hash !== '#request') history.pushState(history.state, '', '#request');
      heading.setAttribute('tabindex', '-1');
      heading.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
      heading.focus({ preventScroll: true });
      request.classList.add('request-arrived');
      clearTimeout(arrivalTimer);
      arrivalTimer = setTimeout(() => request.classList.remove('request-arrived'), 1800);
    }));
  }

  if (!navigator.clipboard?.writeText) return;
  document.querySelectorAll('button.trust-copy[data-copy]').forEach(button => {
    button.disabled = false;
    const label = button.getAttribute('aria-label');
    const status = document.createElement('span');
    status.className = 'trust-copy-status';
    status.setAttribute('role', 'status');
    button.after(status);
    let resetTimer;
    button.addEventListener('click', async () => {
      if (button.getAttribute('aria-busy') === 'true') return;
      button.setAttribute('aria-busy', 'true');
      clearTimeout(resetTimer);
      try {
        await navigator.clipboard.writeText(button.dataset.copy);
        button.dataset.copied = 'true';
        button.setAttribute('aria-label', 'Скопировано');
        status.textContent = 'Контакт скопирован';
      } catch {
        const message = 'Не удалось скопировать. Выделите контакт и скопируйте вручную.';
        button.removeAttribute('data-copied');
        button.setAttribute('aria-label', message);
        button.setAttribute('title', message);
        status.textContent = message;
        const link = button.parentElement.querySelector('a');
        if (link) {
          const range = document.createRange();
          range.selectNodeContents(link);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }
      } finally {
        button.removeAttribute('aria-busy');
        resetTimer = setTimeout(() => {
          button.removeAttribute('data-copied');
          button.removeAttribute('title');
          button.setAttribute('aria-label', label);
          status.textContent = '';
        }, 1800);
      }
    });
  });
})();
