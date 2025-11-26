// hamburger
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

if (hamburger) {
  hamburger.addEventListener('click', () => {
    if (navLinks) navLinks.classList.toggle('show');
    hamburger.classList.toggle('active');
  });
}

// --- Modais com animação (abrir/fechar) ---
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  // garante que esteja visível no fluxo para iniciar animação
  modal.style.display = 'flex';
  // small delay para forçar repaint e permitir transição
  requestAnimationFrame(() => {
    modal.classList.add('show');
    // segunda frame para a transição de opacity/transform
    requestAnimationFrame(() => modal.classList.add('active'));
  });

  modal.setAttribute('aria-hidden', 'false');
  // trava o scroll do body enquanto modal aberto
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  // remove classe que aplica a transição visual
  modal.classList.remove('active');

  // aguarda o tempo da transição antes de remover display (sincronizar com CSS)
  const CLOSE_DELAY = 320; // ms - deve ser >= maior tempo de transition
  setTimeout(() => {
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
  }, CLOSE_DELAY);
}

// fecha ao clicar fora do conteúdo do modal
window.addEventListener('click', function(event) {
  const modals = document.querySelectorAll('.modal.show.active');
  modals.forEach(modal => {
    if (event.target === modal) {
      closeModal(modal.id);
    }
  });
});

// fecha com a tecla Escape
window.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' || e.key === 'Esc') {
    const openModals = Array.from(document.querySelectorAll('.modal.show.active'));
    openModals.forEach(m => closeModal(m.id));
  }
});


// WhatsApp / contato / Formspree
const OWNER_WHATSAPP = '5511945411412';
const OWNER_DISPLAY = '+55 (11) 94541-1412';
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xgejglvq';

function makeWhatsAppHref(number, prefillText = '') {
  const encoded = encodeURIComponent(prefillText || 'Olá, encontrei seu site e gostaria de falar sobre...');
  return `https://wa.me/${number}?text=${encoded}`;
}

const displayPhoneEl = document.getElementById('displayPhone');
if (displayPhoneEl) displayPhoneEl.textContent = OWNER_DISPLAY;

const waBtn = document.getElementById('whatsappBtn');
if (waBtn) waBtn.href = makeWhatsAppHref(OWNER_WHATSAPP);

const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const msg = document.getElementById('formMessage');

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!msg || !submitBtn) return;
    msg.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    const formData = new FormData(form);

    if (formData.get('_hp')) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar';
      return;
    }

    const payload = Object.fromEntries(formData.entries());
    payload._subject = `[Site] ${payload.assunto || 'Contato'}`;
    payload.page = window.location.href;

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        msg.style.color = 'var(--primary)';
        msg.textContent = 'Mensagem enviada — obrigado! Em breve retornaremos.';
        form.reset();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error('Formspree error', data);
        msg.style.color = 'var(--muted)';
        msg.textContent = 'Erro ao enviar. Você pode nos contatar pelo WhatsApp.';
      }
    } catch (err) {
      console.error(err);
      msg.style.color = 'var(--muted)';
      msg.textContent = 'Falha na conexão. Verifique sua internet.';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Enviar';
    }
  });
}

// Ver mais / Mostrar menos — versão robusta (usa .btn-projeto)
(function () {
  const BATCH = 3;

  function createButton() {
    const wrapper = document.createElement('div');
    wrapper.className = 'projects-actions';
    wrapper.style.textAlign = 'center';
    wrapper.style.marginTop = '18px';

    const btn = document.createElement('button');
    btn.id = 'loadMoreProjects';
    btn.className = 'btn-projeto';
    btn.type = 'button';
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = 'Ver mais projetos';
    wrapper.appendChild(btn);

    return wrapper;
  }

  function init() {
    const projectsGrid = document.querySelector('.projects');
    if (!projectsGrid) {
      console.warn('Grid de projetos não encontrado (.projects). Verifique o HTML.');
      return;
    }

    let btn = document.getElementById('loadMoreProjects');

    if (!btn) {
      const createdWrapper = createButton();
      projectsGrid.parentNode.insertBefore(createdWrapper, projectsGrid.nextSibling);
      btn = document.getElementById('loadMoreProjects');
    }

    // pega os projetos ocultos que estão DENTRO do grid
    const hiddenList = Array.from(projectsGrid.querySelectorAll('.project.hidden-project'));
    let revealed = 0;

    function updateButton() {
      const remaining = Math.max(0, hiddenList.length - revealed);
      if (hiddenList.length === 0) {
        btn.style.display = 'none';
        return;
      }
      if (remaining === 0) {
        btn.textContent = 'Mostrar menos';
        btn.setAttribute('aria-expanded', 'true');
        btn.dataset.state = 'all';
      } else {
        btn.textContent = `Ver mais projetos (${remaining})`;
        btn.setAttribute('aria-expanded', 'false');
        btn.dataset.state = 'more';
      }
    }

    function revealNext() {
      const toShow = hiddenList.slice(revealed, revealed + BATCH);
      toShow.forEach(el => {
        el.classList.remove('hidden-project');
        requestAnimationFrame(() => el.classList.add('reveal'));
      });
      revealed += toShow.length;
      if (toShow.length) {
        toShow[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      updateButton();
    }

    function collapseAll() {
      hiddenList.forEach(el => {
        el.classList.add('hidden-project');
        el.classList.remove('reveal');
      });
      revealed = 0;
      updateButton();
      const projetosSection = document.getElementById('projetos');
      if (projetosSection) {
        window.scrollTo({ top: projetosSection.offsetTop - 60, behavior: 'smooth' });
      }
    }

   btn.addEventListener('click', (e) => {
  e.preventDefault();
  if (btn.dataset.state === 'all') {
    collapseAll();
    return;
  }
  revealNext();
});


    updateButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
(function ensureProjectsActionsPosition() {
  const grid = document.querySelector('.projects');
  if (!grid) return;
  const wrapperInside = grid.querySelector('.projects-actions');
  if (wrapperInside) {
    const next = grid.nextElementSibling;
    if (!next || !next.classList || !next.classList.contains('projects-actions')) {
      grid.parentNode.insertBefore(wrapperInside, grid.nextSibling);
      wrapperInside.style.textAlign = 'left'; // 🔹 força alinhamento
    } else {
      wrapperInside.remove();
    }
  }
})();
