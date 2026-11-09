(() => {
  const body = document.body;
  if (!body?.classList.contains('service-page')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.querySelector('.service-lightbox');
  const preview = dialog?.querySelector('.service-lightbox-image');
  const closeButton = dialog?.querySelector('.service-lightbox-close');

  if (dialog && preview && closeButton && typeof dialog.showModal === 'function') {
    let opener;
    let previousOverflow;
    document.querySelectorAll('button.service-photo-open').forEach(button => {
      const image = button.querySelector('img');
      if (!image) return;
      button.disabled = false;
      button.setAttribute('aria-haspopup', 'dialog');
      if (dialog.id) button.setAttribute('aria-controls', dialog.id);
      button.addEventListener('click', () => {
        if (dialog.open) return;
        preview.src = image.currentSrc || image.src;
        preview.alt = image.alt;
        opener = button;
        if (previousOverflow === undefined) previousOverflow = body.style.overflow;
        dialog.showModal();
        body.style.overflow = 'hidden';
        closeButton.focus();
      });
    });
    closeButton.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const content = dialog.querySelector('.service-lightbox-content') || dialog;
      const box = content.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      if (dialog.open) return;
      if (previousOverflow !== undefined) body.style.overflow = previousOverflow;
      previousOverflow = undefined;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
      opener = undefined;
    });
  }

  const request = document.getElementById('request');
  const heading = request?.querySelector('h2');
  if (!request || !heading) return;
  let arrivalTimer;
  document.querySelectorAll('a[href="#request"]').forEach(link => link.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    document.querySelectorAll('.site-mobile-menu[open], .site-services-menu[open]').forEach(menu => { menu.open = false; });
    if (location.hash !== '#request') history.pushState(history.state, '', '#request');
    if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
    heading.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
    heading.focus({ preventScroll: true });
    request.classList.add('request-arrived');
    clearTimeout(arrivalTimer);
    arrivalTimer = setTimeout(() => request.classList.remove('request-arrived'), 1800);
  }));
})();
