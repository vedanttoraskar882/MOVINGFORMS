/**
 * MOVINGFORMS - Interactive Frontend Logic
 * Strictly adheres to MovingForm Business Plan & Zero-Backend Requirements
 */

document.addEventListener('DOMContentLoaded', () => {
  // Constants
  const STORAGE_KEY = 'movingforms_pilot_submissions';

  // DOM Elements
  const navbar = document.getElementById('navbar');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  
  // Pilot Modal Elements
  const pilotModal = document.getElementById('pilotModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const openModalBtns = document.querySelectorAll('.open-pilot-modal');

  // Forms
  const inlineForm = document.getElementById('inlinePilotForm');
  const modalForm = document.getElementById('modalPilotForm');

  // Storage Inspector Elements
  const viewStoredDataBtn = document.getElementById('viewStoredDataBtn');
  const storageDrawer = document.getElementById('storageDrawer');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');
  const storageRecordsList = document.getElementById('storageRecordsList');
  const storageEmptyNotice = document.getElementById('storageEmptyNotice');
  const clearStorageBtn = document.getElementById('clearStorageBtn');
  const submissionCountBadge = document.getElementById('submissionCountBadge');

  // FAQ Accordion
  const accordionItems = document.querySelectorAll('#faqAccordion .accordion-item');

  // Year in footer
  const currentYearSpan = document.getElementById('currentYear');
  if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
  }

  /* ====================================================
     1. STORAGE MANAGEMENT (PURE BROWSER LOCALSTORAGE)
     ==================================================== */

  /**
   * Retrieves submissions array from localStorage
   * @returns {Array} Array of submission objects
   */
  function getSubmissions() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Could not read from localStorage:', e);
      return [];
    }
  }

  /**
   * Stores a new submission adhering strictly to the required schema:
   * {
   *   fullName: "",
   *   phoneNumber: "",
   *   email: "",
   *   organisation: "",
   *   submissionDateTime: ""
   * }
   */
  function saveSubmission(payload) {
    const submissions = getSubmissions();
    submissions.push(payload);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
    } catch (e) {
      console.error('Failed to write to localStorage:', e);
    }
    updateStorageUI();
  }

  /**
   * Updates count badge and drawer items
   */
  function updateStorageUI() {
    const submissions = getSubmissions();
    if (submissionCountBadge) {
      submissionCountBadge.textContent = submissions.length;
    }

    if (!storageRecordsList || !storageEmptyNotice) return;

    if (submissions.length === 0) {
      storageEmptyNotice.style.display = 'block';
      storageRecordsList.innerHTML = '';
    } else {
      storageEmptyNotice.style.display = 'none';
      storageRecordsList.innerHTML = submissions.map((item, idx) => {
        return `
          <div class="storage-card">
            <div class="storage-card-header">
              <span class="storage-card-name">#${idx + 1} ${escapeHTML(item.fullName || 'Anonymous')}</span>
              <span class="storage-card-time">${escapeHTML(item.submissionDateTime || 'N/A')}</span>
            </div>
            <div class="storage-card-row">
              <span class="storage-label">Organisation:</span>
              <span class="storage-val">${escapeHTML(item.organisation || 'N/A')}</span>
            </div>
            <div class="storage-card-row">
              <span class="storage-label">Email:</span>
              <span class="storage-val">${escapeHTML(item.email || 'N/A')}</span>
            </div>
            <div class="storage-card-row">
              <span class="storage-label">Phone:</span>
              <span class="storage-val">${escapeHTML(item.phoneNumber || 'N/A')}</span>
            </div>
          </div>
        `;
      }).reverse().join('');
    }
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  // Initial update of storage stats
  updateStorageUI();

  /* ====================================================
     2. FORM VALIDATION & HANDLING
     ==================================================== */

  function validateField(value, type) {
    const trimmed = (value || '').trim();
    if (!trimmed) {
      return 'This field is required.';
    }

    if (type === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        return 'Please enter a valid email address.';
      }
    }

    if (type === 'tel') {
      // Basic international phone check (at least 7 digits)
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 7) {
        return 'Please enter a valid phone number with dialling code.';
      }
    }

    return '';
  }

  function setupFormHandler(formElement, statusElementId) {
    if (!formElement) return;

    const statusEl = document.getElementById(statusElementId);

    formElement.addEventListener('submit', (e) => {
      e.preventDefault();

      // Clear previous status
      if (statusEl) {
        statusEl.className = 'form-status-message';
        statusEl.textContent = '';
      }

      const inputs = {
        fullName: formElement.querySelector('[name="fullName"]'),
        phoneNumber: formElement.querySelector('[name="phoneNumber"]'),
        email: formElement.querySelector('[name="email"]'),
        organisation: formElement.querySelector('[name="organisation"]')
      };

      let isValid = true;

      // Validate each field
      Object.keys(inputs).forEach(key => {
        const input = inputs[key];
        const errorSpan = formElement.querySelector(`#${input.id}Error`);
        const errorMsg = validateField(input.value, input.type);

        if (errorMsg) {
          isValid = false;
          input.classList.add('input-error');
          if (errorSpan) errorSpan.textContent = errorMsg;
        } else {
          input.classList.remove('input-error');
          if (errorSpan) errorSpan.textContent = '';
        }

        // Add real-time input clearing of error
        input.addEventListener('input', () => {
          input.classList.remove('input-error');
          if (errorSpan) errorSpan.textContent = '';
        }, { once: true });
      });

      if (!isValid) return;

      // Format ISO & UK Date/Time
      const now = new Date();
      const ukFormattedTime = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      // Construct payload according to specifications
      const submissionPayload = {
        fullName: inputs.fullName.value.trim(),
        phoneNumber: inputs.phoneNumber.value.trim(),
        email: inputs.email.value.trim(),
        organisation: inputs.organisation.value.trim(),
        submissionDateTime: `${ukFormattedTime} (${now.toISOString()})`
      };

      // Persist in localStorage array
      saveSubmission(submissionPayload);

      // Reset form
      formElement.reset();

      // Show exact required message
      if (statusEl) {
        statusEl.textContent = 'Thank you for your interest. Our team will contact you shortly.';
        statusEl.classList.add('success');
      }

      // If submitted in modal, automatically close modal after a brief confirmation
      if (formElement === modalForm) {
        setTimeout(() => {
          closePilotModal();
          if (statusEl) {
            statusEl.textContent = '';
            statusEl.className = 'form-status-message';
          }
        }, 3200);
      }
    });
  }

  setupFormHandler(inlineForm, 'formStatusMessage');
  setupFormHandler(modalForm, 'modalFormStatusMessage');

  /* ====================================================
     3. PILOT MODAL INTERACTIONS
     ==================================================== */

  function openPilotModal(preselectedPackage) {
    if (!pilotModal) return;
    pilotModal.classList.add('open');
    pilotModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus first input
    const firstInput = pilotModal.querySelector('#modalFullName');
    if (firstInput) {
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  function closePilotModal() {
    if (!pilotModal) return;
    pilotModal.classList.remove('open');
    pilotModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const packageName = btn.getAttribute('data-package') || '';
      openPilotModal(packageName);
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closePilotModal);
  }

  // Click outside modal dialog to dismiss
  if (pilotModal) {
    pilotModal.addEventListener('click', (e) => {
      if (e.target === pilotModal) {
        closePilotModal();
      }
    });
  }

  // ESC key listener for modal and drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (pilotModal && pilotModal.classList.contains('open')) {
        closePilotModal();
      }
      if (storageDrawer && storageDrawer.classList.contains('open')) {
        storageDrawer.classList.remove('open');
        storageDrawer.setAttribute('aria-hidden', 'true');
      }
    }
  });

  /* ====================================================
     4. STORAGE INSPECTOR DRAWER
     ==================================================== */
  if (viewStoredDataBtn && storageDrawer) {
    viewStoredDataBtn.addEventListener('click', () => {
      updateStorageUI();
      storageDrawer.classList.toggle('open');
      storageDrawer.setAttribute('aria-hidden', storageDrawer.classList.contains('open') ? 'false' : 'true');
    });
  }

  if (drawerCloseBtn && storageDrawer) {
    drawerCloseBtn.addEventListener('click', () => {
      storageDrawer.classList.remove('open');
      storageDrawer.setAttribute('aria-hidden', 'true');
    });
  }

  if (clearStorageBtn) {
    clearStorageBtn.addEventListener('click', () => {
      if (confirm('Clear all stored pilot submissions from browser localStorage?')) {
        localStorage.removeItem(STORAGE_KEY);
        updateStorageUI();
      }
    });
  }

  /* ====================================================
     5. FAQ ACCORDION LOGIC
     ==================================================== */
  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      // Close all accordion items for clean accordion UX
      accordionItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherTrigger = otherItem.querySelector('.accordion-trigger');
        if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
      });

      // Toggle clicked item
      if (!isActive) {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ====================================================
     6. NAVBAR SCROLL EFFECT & ACTIVE SECTION TRACKING
     ==================================================== */
  const sections = document.querySelectorAll('section[id]');

  function handleScroll() {
    const scrollY = window.pageYOffset;

    // Header glass darkening on scroll
    if (scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active link highlighting
    let currentId = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 120;
      const sectionHeight = section.offsetHeight;
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        currentId = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentId}`) {
        link.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ====================================================
     7. MOBILE NAVIGATION TOGGLE
     ==================================================== */
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('open');
      mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when a link is clicked
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ====================================================
     8. AMBIENT DYNAMIC CANVAS (SUBTLE KINETIC PARTICLES)
     ==================================================== */
  const canvas = document.getElementById('ambient-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resizeCanvas() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    class Particle {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.radius = Math.random() * 1.5 + 0.8;
        this.alpha = Math.random() * 0.4 + 0.15;
        // Warm gold and crimson hue variation
        this.color = Math.random() > 0.4 ? '229, 193, 88' : '201, 42, 66';
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
        ctx.fill();
      }
    }

    function initParticles() {
      particles = [];
      const count = Math.min(Math.floor((width * height) / 28000), 55);
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    }

    function animateParticles() {
      ctx.clearRect(0, 0, width, height);

      // Connect nearby particles with subtle filament lines
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(229, 193, 88, ${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(animateParticles);
    }

    window.addEventListener('resize', () => {
      resizeCanvas();
      initParticles();
    }, { passive: true });

    resizeCanvas();
    initParticles();
    animateParticles();
  }
});
