(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canReveal = 'IntersectionObserver' in window;

  // Enable animation styles (CSS uses .js)
  document.documentElement.classList.add('js');

  const lockScroll = (locked) => {
    document.documentElement.classList.toggle('no-scroll', locked);
    document.body.classList.toggle('no-scroll', locked);
  };

  const revealEls = Array.from(document.querySelectorAll('.reveal'));

  const startReveals = (fromIntro = false) => {
    if (!revealEls.length) return;

    // If IntersectionObserver isn't available, just show everything.
    if (!canReveal) {
      revealEls.forEach((el) => el.classList.add('is-in', 'show'));
      return;
    }

    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in', 'show');
          io.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

    revealEls.forEach((el) => io.observe(el));

    // After intro closes, ensure the first blocks animate even without scrolling.
    if (fromIntro) {
      const first = revealEls.slice(0, 4); // welcome, hero, photos, calendar
      // reset (in case observer already fired behind overlay)
      first.forEach((el) => el.classList.remove('is-in', 'show'));

      if (prefersReduced) {
        first.forEach((el) => el.classList.add('is-in', 'show'));
      } else {
        first.forEach((el, i) => {
          window.setTimeout(() => el.classList.add('is-in', 'show'), 80 + i * 120);
        });
      }
    }
  };

  // ===== Intro (открытка) =====
  const intro = document.getElementById('intro');
  const openBtn = document.getElementById('openInvite');
  const guestNameInput = document.getElementById('guestName');
  const nameError = document.getElementById('nameError');
  const nameNote = document.getElementById('nameNote');
  const nameField = guestNameInput?.closest?.('.intro__field') ?? null;

  const guestNameEls = Array.from(document.querySelectorAll('.js-guest-name'));

  const normSpaces = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const capFirst = (s) => {
    const str = normSpaces(s);
    if (!str) return '';
    const first = str.slice(0, 1).toUpperCase();
    return first + str.slice(1);
  };

  // Dictionary of common Russian names with typical misspellings
  const NAME_CORRECTIONS = {
    // А
    'алексанр': 'Александр', 'алексндр': 'Александр', 'аликсандр': 'Александр', 'аликсандр': 'Александр',
    'александр': 'Александр', 'алексей': 'Алексей', 'алекесй': 'Алексей', 'аликсей': 'Алексей',
    'анастасия': 'Анастасия', 'анастосия': 'Анастасия', 'настасия': 'Анастасия',
    'анатолий': 'Анатолий', 'анотолий': 'Анатолий',
    'андрей': 'Андрей', 'андрий': 'Андрей', 'ондрей': 'Андрей',
    'анна': 'Анна', 'ана': 'Анна',
    'антон': 'Антон', 'антоон': 'Антон',
    'арина': 'Арина', 'оринa': 'Арина',
    'артем': 'Артём', 'артём': 'Артём', 'артьом': 'Артём', 'артеом': 'Артём',
    // Б
    'борис': 'Борис', 'барис': 'Борис',
    'богдан': 'Богдан', 'багдан': 'Богдан',
    // В
    'вадим': 'Вадим', 'водим': 'Вадим',
    'валентин': 'Валентин', 'валинтин': 'Валентин',
    'валентина': 'Валентина', 'валинтина': 'Валентина',
    'валерий': 'Валерий', 'валирий': 'Валерий',
    'валерия': 'Валерия', 'валирия': 'Валерия', 'валерея': 'Валерия',
    'василий': 'Василий', 'васелий': 'Василий',
    'виктор': 'Виктор', 'виктар': 'Виктор',
    'виктория': 'Виктория', 'викторея': 'Виктория',
    'виталий': 'Виталий', 'виталей': 'Виталий',
    'владимир': 'Владимир', 'владемир': 'Владимир', 'влодимир': 'Владимир',
    'владислав': 'Владислав', 'владеслав': 'Владислав', 'влад': 'Владислав',
    // Г
    'галина': 'Галина', 'голина': 'Галина',
    'геннадий': 'Геннадий', 'генадий': 'Геннадий', 'гинадий': 'Геннадий',
    'георгий': 'Георгий', 'гиоргий': 'Георгий',
    'григорий': 'Григорий', 'грегорий': 'Григорий',
    // Д
    'дарья': 'Дарья', 'дарья': 'Дарья', 'дарйа': 'Дарья',
    'дмитрий': 'Дмитрий', 'дмитрей': 'Дмитрий', 'димитрий': 'Дмитрий',
    'денис': 'Денис', 'динис': 'Денис',
    'диана': 'Диана', 'деана': 'Диана',
    // Е
    'евгений': 'Евгений', 'ивгений': 'Евгений', 'евгиний': 'Евгений',
    'евгения': 'Евгения', 'ивгения': 'Евгения',
    'екатерина': 'Екатерина', 'екотерина': 'Екатерина', 'икатерина': 'Екатерина', 'катерина': 'Екатерина',
    'елена': 'Елена', 'илена': 'Елена', 'елина': 'Елена',
    'елизавета': 'Елизавета', 'елезавета': 'Елизавета',
    // И
    'иван': 'Иван', 'еван': 'Иван',
    'игорь': 'Игорь', 'егорь': 'Игорь',
    'илья': 'Илья', 'елья': 'Илья', 'илья': 'Илья',
    'илюша': 'Илья', 'илюха': 'Илья',
    'ирина': 'Ирина', 'ерина': 'Ирина', 'иринна': 'Ирина',
    // К
    'кирилл': 'Кирилл', 'кирил': 'Кирилл', 'кирел': 'Кирилл',
    'константин': 'Константин', 'констонтин': 'Константин', 'канстантин': 'Константин',
    'костян': 'Константин', 'констинтин': 'Константин', 'констентин': 'Константин',
    'ксения': 'Ксения', 'ксенья': 'Ксения', 'аксения': 'Ксения',
    // Л
    'лариса': 'Лариса', 'лориса': 'Лариса',
    'людмила': 'Людмила', 'людмела': 'Людмила',
    // М
    'максим': 'Максим', 'маским': 'Максим', 'максем': 'Максим',
    'маргарита': 'Маргарита', 'моргарита': 'Маргарита',
    'марина': 'Марина', 'морина': 'Марина',
    'мария': 'Мария', 'марея': 'Мария',
    'михаил': 'Михаил', 'михоил': 'Михаил', 'мехаил': 'Михаил',
    // Н
    'надежда': 'Надежда', 'надежа': 'Надежда',
    'наталья': 'Наталья', 'наталия': 'Наталья', 'нотолья': 'Наталья',
    'никита': 'Никита', 'некита': 'Никита', 'некета': 'Никита',
    'николай': 'Николай', 'николой': 'Николай', 'неколай': 'Николай',
    // О
    'олег': 'Олег', 'алег': 'Олег',
    'ольга': 'Ольга', 'альга': 'Ольга',
    'оксана': 'Оксана', 'аксана': 'Оксана',
    // П
    'павел': 'Павел', 'повел': 'Павел',
    'петр': 'Пётр', 'пётр': 'Пётр', 'питр': 'Пётр',
    'полина': 'Полина', 'палина': 'Полина',
    // Р
    'роман': 'Роман', 'раман': 'Роман',
    'руслан': 'Руслан', 'руслон': 'Руслан',
    // С
    'светлана': 'Светлана', 'свитлана': 'Светлана',
    'сергей': 'Сергей', 'сиргей': 'Сергей', 'сергий': 'Сергей',
    'софья': 'Софья', 'софия': 'София', 'сафья': 'Софья',
    'станислав': 'Станислав', 'станеслав': 'Станислав',
    'степан': 'Степан', 'стипан': 'Степан',
    // Т
    'татьяна': 'Татьяна', 'тотьяна': 'Татьяна', 'татяна': 'Татьяна',
    'тимур': 'Тимур', 'темур': 'Тимур',
    // Ф
    'фёдор': 'Фёдор', 'федор': 'Фёдор', 'фидор': 'Фёдор',
    // Э
    'эдуард': 'Эдуард', 'эдуарт': 'Эдуард',
    // Ю
    'юлия': 'Юлия', 'юлея': 'Юлия', 'юлья': 'Юлия',
    'юрий': 'Юрий', 'юрей': 'Юрий',
    // Я
    'яна': 'Яна', 'янна': 'Яна',
    'ярослав': 'Ярослав', 'ярослов': 'Ярослав',
  };

  const normalizeGuestName = (raw) => {
    const trimmed = normSpaces(raw);
    if (!trimmed) return { value: '', easterEgg: false };

    // Take first token as "имя" (supports "Имя Фамилия" too)
    const token = trimmed.split(' ')[0];
    const low = token.toLowerCase();

    // Easter egg for Ilya variants
    const isIlya = ['илья', 'илюша', 'илюха'].includes(low);

    // Check dictionary for correction
    if (NAME_CORRECTIONS[low]) {
      return { value: NAME_CORRECTIONS[low], easterEgg: isIlya };
    }

    // Default: capitalize first letter
    return { value: capFirst(token), easterEgg: isIlya };
  };

  let guestName = '';

  const setNameUI = (raw) => {
    const { value, easterEgg } = normalizeGuestName(raw);
    guestName = value;

    // Persist for reloads
    try {
      if (guestName) localStorage.setItem('wedding_guest_name', guestName);
      else localStorage.removeItem('wedding_guest_name');
    } catch (_) {}

    guestNameEls.forEach((el) => { el.textContent = guestName || '...'; });

    if (nameNote) {
      nameNote.textContent = '';
    }

    if (openBtn) {
      openBtn.disabled = !guestName;
    }

    if (nameError) nameError.textContent = '';
    if (nameField) nameField.classList.remove('is-error');
  };

  const ensureNameBeforeOpen = () => {
    const current = guestNameInput?.value ?? '';
    const { value } = normalizeGuestName(current);
    if (value) {
      // Put normalized value back to input for consistency
      if (guestNameInput) guestNameInput.value = value;
      setNameUI(value);
      return true;
    }
    if (nameError) nameError.textContent = 'Пожалуйста, укажите имя.';
    if (nameField) nameField.classList.add('is-error');
    if (guestNameInput) guestNameInput.focus();
    return false;
  };

  const closeIntro = () => {
    if (!intro) return;

    // Require name before opening
    if (guestNameInput && !ensureNameBeforeOpen()) return;

    // prevent double close
    if (intro.classList.contains('is-closing') || intro.classList.contains('is-closed')) return;

    intro.classList.add('is-closing');

    const done = () => {
      intro.classList.add('is-closed');
      intro.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('intro-open');
      lockScroll(false);
      intro.removeEventListener('transitionend', done);

      // Fade in the illustration background
      document.body.classList.add('bg-visible');

      // Start reveal animations after the overlay is gone
      startReveals(true);
    };

    // If reduced motion or transitionend doesn't fire, fallback timer
    if (prefersReduced) {
      done();
    } else {
      intro.addEventListener('transitionend', done);
      window.setTimeout(done, 650);
    }
  };

  if (intro && openBtn) {
    // Keep content hidden (via CSS) until the intro is closed
    document.body.classList.add('intro-open');
    lockScroll(true);

    // Load stored name (if any)
    try {
      const saved = localStorage.getItem('wedding_guest_name');
      if (saved && guestNameInput) {
        guestNameInput.value = saved;
        setNameUI(saved);
      }
    } catch (_) {}

    if (guestNameInput) {
      guestNameInput.addEventListener('input', (e) => setNameUI(e.target.value));
      guestNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (ensureNameBeforeOpen()) closeIntro();
        }
      });
      // Initialize placeholders
      setNameUI(guestNameInput.value);
    }

    openBtn.addEventListener('click', closeIntro);

    // Close by scroll/swipe (optional)
    if (!prefersReduced) {
      let wheelSum = 0;
      window.addEventListener('wheel', (e) => {
        if (guestNameInput && !guestName) return; // don't allow scroll-to-open without name
        wheelSum += Math.abs(e.deltaY);
        if (wheelSum > 220) closeIntro();
      }, { passive: true });

      let touchY = null;
      window.addEventListener('touchstart', (e) => {
        touchY = e.touches?.[0]?.clientY ?? null;
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (guestNameInput && !guestName) return;
        if (touchY == null) return;
        const y = e.touches?.[0]?.clientY ?? touchY;
        if (touchY - y > 60) closeIntro();
      }, { passive: true });
    }

    // IMPORTANT: don't start observers until after intro closes
  } else {
    // No intro — start immediately
    startReveals(false);
  }

  // ===== Шприц: нажатие по клику/тапу =====
  const syringe = document.querySelector('.js-syringe');
  if (syringe) {
    const press = () => {
      syringe.classList.add('is-press', 'is-drop');
      window.setTimeout(() => syringe.classList.remove('is-press'), 220);
      window.setTimeout(() => syringe.classList.remove('is-drop'), 750);
    };
    syringe.addEventListener('click', press);
    syringe.addEventListener('touchstart', press, { passive: true });
  }

  // ===== RSVP =====
  const rsvpForm = document.getElementById('rsvpForm');
  const rsvpNote = document.getElementById('rsvpNote');
  const rsvpComment = document.getElementById('rsvpComment');

  if (rsvpForm) {
    rsvpForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const attendance = rsvpForm.querySelector('input[name="attendance"]:checked')?.value === 'no'
        ? 'Не смогу'
        : 'Приду';
      const comment = (rsvpComment?.value ?? '').trim();
      const name = guestName || (guestNameInput ? normalizeGuestName(guestNameInput.value).value : '');

      const payload = {
        name: name || '',
        attendance,
        comment,
        ts: new Date().toISOString(),
      };

      try {
        localStorage.setItem('wedding_rsvp_last', JSON.stringify(payload));
      } catch (_) {}

      // ====== TELEGRAM RSVP ======
      const TG_BOT_TOKEN = '8378485557:AAEFVmqaDQeUmVmVeJpJg6ztxEA6d7gHZUM';
      const TG_CHAT_ID = '-1003841933837';

      const ts = new Date();
      const timeStr = ts.toLocaleString('ru-RU', { timeZone: 'Asia/Yekaterinburg' });

      const tgLines = [
        '🎟️ RSVP',
        `Статус: ${attendance}`,
        name ? `Имя: ${name}` : null,
        comment ? `Комментарий: ${comment}` : null,
        `Время: ${timeStr}`,
      ].filter(Boolean);
      const tgText = tgLines.join('\n');

      let sent = false;
      try {
        const res = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            text: tgText,
            disable_web_page_preview: true,
          }),
        });
        sent = res.ok;
      } catch (_) {
        sent = false;
      }

      // Friendly UX: copy message to clipboard (optional)
      const msgLines = [
        `RSVP: ${attendance}`,
        name ? `Имя: ${name}` : null,
        comment ? `Комментарий: ${comment}` : null,
      ].filter(Boolean);
      const msg = msgLines.join('\n');

      let copied = false;
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(msg);
          copied = true;
        }
      } catch (_) {}

      if (rsvpNote) {
        rsvpNote.textContent = (sent ? '✅ Отправлено в Telegram. ' : '⚠️ Не удалось отправить в Telegram. ') + (copied
          ? 'Сообщение также скопировано в буфер обмена.'
          : 'Ответ сохранён.');
      }

      // Visual feedback
      rsvpForm.classList.add('is-sent');
      window.setTimeout(() => rsvpForm.classList.remove('is-sent'), 600);
    });
  }
})();

// === Fun stamp conditional display ===
(function(){
  const stamp = document.getElementById('funStampSection');
  const nameInput = document.getElementById('guestName');
  if(!stamp || !nameInput) return;

  const allowed = ['илья','илюша','илюха'];

  function checkStamp(){
    const v = (nameInput.value || '').trim().toLowerCase();
    if(allowed.includes(v)){
      stamp.style.display = 'flex';
    } else {
      stamp.style.display = 'none';
    }
  }

  nameInput.addEventListener('input', checkStamp);
  checkStamp();
})();

// === Wedding countdown ===
(function(){
  const WEDDING_DATE = new Date('2026-08-01T12:30:00+05:00'); // Ekaterinburg time (UTC+5)

  const cdDays = document.getElementById('cdDays');
  const cdHours = document.getElementById('cdHours');
  const cdMinutes = document.getElementById('cdMinutes');
  const cdSeconds = document.getElementById('cdSeconds');

  if (!cdDays) return;

  function pluralize(n, one, few, many) {
    const abs = Math.abs(n) % 100;
    const lastDigit = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (lastDigit > 1 && lastDigit < 5) return few;
    if (lastDigit === 1) return one;
    return many;
  }

  function update() {
    const now = new Date();
    let diff = WEDDING_DATE - now;

    if (diff <= 0) {
      cdDays.textContent = '0';
      cdHours.textContent = '00';
      cdMinutes.textContent = '00';
      cdSeconds.textContent = '00';
      cdDays.nextElementSibling.textContent = 'дней';
      cdHours.nextElementSibling.textContent = 'часов';
      cdMinutes.nextElementSibling.textContent = 'минут';
      cdSeconds.nextElementSibling.textContent = 'секунд';
      return;
    }

    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const minutes = Math.floor(diff / 60000);
    diff -= minutes * 60000;
    const seconds = Math.floor(diff / 1000);

    cdDays.textContent = days;
    cdHours.textContent = String(hours).padStart(2, '0');
    cdMinutes.textContent = String(minutes).padStart(2, '0');
    cdSeconds.textContent = String(seconds).padStart(2, '0');

    cdDays.nextElementSibling.textContent = pluralize(days, 'день', 'дня', 'дней');
    cdHours.nextElementSibling.textContent = pluralize(hours, 'час', 'часа', 'часов');
    cdMinutes.nextElementSibling.textContent = pluralize(minutes, 'минута', 'минуты', 'минут');
    cdSeconds.nextElementSibling.textContent = pluralize(seconds, 'секунда', 'секунды', 'секунд');
  }

  update();
  setInterval(update, 1000);
})();
