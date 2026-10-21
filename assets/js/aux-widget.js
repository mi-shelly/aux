/**
 * Aux Accessibility Widget
 * A REDAXO AddOn for website accessibility
 * (c) Michelle Falke – MIT License
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'aux_settings';

    // Universal accessibility icon (person with arms outstretched – the
    // international symbol for accessibility / "help for all users")
    const A11Y_ICON = '<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="4" r="2" fill="currentColor" stroke="none"/><path d="M5 8h14"/><path d="M12 9v4"/><path d="M8.5 21 12 13l3.5 8"/></svg>';

    const svg = (inner, size = 24) => `<svg aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

    // Lucide-style stroke icons (decorative, always aria-hidden)
    const ICONS = {
        vision: svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
        dyslexia: svg('<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>'),
        adhd: svg('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
        motor: svg('<path d="M18 11V6a2 2 0 0 0-4 0"/><path d="M14 10V4a2 2 0 0 0-4 0v2"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'),
        cognitive: svg('<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'),
        seizure: svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
        close: svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>', 18),
        reset: svg('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>', 16),
    };

    // Filter parts per contrast mode ('high' is pure CSS colour override, see aux-adjustments.css)
    //  – composed with grayscale/brightness in applyFilters()
    const CONTRAST_FILTERS = {
        dark: 'invert(1) hue-rotate(180deg)',
        light: 'brightness(1.12) contrast(1.08) saturate(1.15)',
        inverted: 'invert(1)',
    };

    const MASK_HEIGHT = 120; // px of the bright strip

    const DEFAULT_SETTINGS = {
        contrast: 'normal',
        grayscale: false,
        brightness: 0,
        readingMask: false,
        textSize: 0,
        lineHeight: 0,
        letterSpacing: 0,
        textAlign: 'none',
        highlightLinks: false,
        highlightHeadings: false,
        readingRuler: false,
        dyslexiaFont: false,
        focusHighlight: false,
        bigCursor: false,
        stopAnimations: false,
        hideImages: false,
        activeProfile: null,
        widgetPosition: null,
    };

    const PROFILES = {
        vision: {
            contrast: 'high',
            textSize: 2,
            bigCursor: true,
            focusHighlight: true,
        },
        dyslexia: {
            dyslexiaFont: true,
            lineHeight: 2,
            letterSpacing: 2,
            textSize: 1,
        },
        adhd: {
            readingRuler: true,
            stopAnimations: true,
            focusHighlight: true,
            hideImages: true,
        },
        motor: {
            bigCursor: true,
            focusHighlight: true,
            textSize: 1,
        },
        cognitive: {
            textSize: 1,
            lineHeight: 1,
            highlightLinks: true,
            highlightHeadings: true,
            stopAnimations: true,
        },
        seizure: {
            stopAnimations: true,
            contrast: 'normal',
        },
    };

    class AuxWidget {
        constructor(config) {
            this.config = config;
            this.i18n = config.i18n || {};
            this.isOpen = false;
            this.settings = { ...DEFAULT_SETTINGS };
            this.rulerEl = null;
            this.maskEls = null;
            this.maskY = null;
            this.ttsActive = false;
            this.ttsUtterance = null;

            this.bgMarked = false;

            this.load();
            this.createWidget();
            this.applyAll();
            this.bindGlobalEvents();
            this.watchDocument();
        }

        // ── Translation ──

        t(key) {
            return this.i18n[key] || key;
        }

        // ── Persistence ──

        save() {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
            } catch (e) {
                // localStorage not available
            }
        }

        load() {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    this.settings = { ...DEFAULT_SETTINGS, ...parsed };
                }
            } catch (e) {
                // localStorage not available
            }
        }

        // ── DOM Creation ──

        createWidget() {
            this.container = document.createElement('div');
            this.container.className = 'aux-widget';
            this.container.lang = this.config.lang || 'de';

            // Apply pixel offsets from backend config as CSS variables
            const offsetX = (this.config.offsetX !== undefined) ? this.config.offsetX : 20;
            const offsetY = (this.config.offsetY !== undefined) ? this.config.offsetY : 50;
            this.container.style.setProperty('--aux-offset-x', offsetX + 'px');
            this.container.style.setProperty('--aux-offset-y', offsetY + 'px');

            const position = this.settings.widgetPosition || this.config.position || 'bottom-right';
            this.applyWidgetPosition(position);

            this.button = document.createElement('button');
            this.button.className = 'aux-toggle-btn';
            this.button.setAttribute('aria-label', this.t('title'));
            this.button.setAttribute('aria-expanded', 'false');
            this.button.setAttribute('aria-controls', 'aux-panel');
            this.button.style.setProperty('--aux-btn-color', this.config.buttonColor || '#1a73e8');
            this.button.innerHTML = A11Y_ICON;
            this.button.addEventListener('click', () => this.toggle());

            this.panel = document.createElement('div');
            this.panel.className = 'aux-panel';
            this.panel.id = 'aux-panel';
            this.panel.setAttribute('role', 'dialog');
            this.panel.setAttribute('aria-label', this.t('title'));
            this.panel.setAttribute('aria-modal', 'false');
            this.panel.innerHTML = this.buildPanelHTML();

            // Visible state + exit while the text reader is on (it intercepts clicks on the page)
            this.ttsBar = document.createElement('div');
            this.ttsBar.className = 'aux-tts-bar';
            this.ttsBar.hidden = true;
            this.ttsBar.innerHTML = `<span class="aux-tts-msg" role="status"></span>
                <button type="button" class="aux-tts-stop">${this.t('tts_stop')}</button>`;
            this.ttsBar.querySelector('.aux-tts-stop').addEventListener('click', () => {
                this.stopTTS();
                this.updateUI();
            });

            this.container.appendChild(this.button);
            this.container.appendChild(this.panel);
            this.container.appendChild(this.ttsBar);
            // Child of <html>, not <body>: filters are applied to <body>, so the
            // widget is never filtered and stays viewport-anchored.
            // Inserted before <body> so the button is an early tab stop, not the last one.
            // The frame lets us follow the *visual* viewport (see fitFrame()).
            // It is the host of a shadow root: site CSS cannot restyle the widget. Hidden
            // until its stylesheet has loaded, to avoid a flash of unstyled content.
            this.frame = document.createElement('aux-widget-root');
            this.frame.hidden = true;
            const root = this.frame.attachShadow({ mode: 'open' });
            const sheet = document.createElement('link');
            sheet.rel = 'stylesheet';
            sheet.href = this.config.cssUrl || (this.config.assetsUrl + 'css/aux-widget.css');
            const reveal = () => { this.frame.hidden = false; };
            sheet.addEventListener('load', reveal);
            sheet.addEventListener('error', reveal);
            setTimeout(reveal, 3000);
            root.appendChild(sheet);
            root.appendChild(this.container);
            document.documentElement.insertBefore(this.frame, document.body);
            this.fitFrame();
            if (window.visualViewport) {
                window.visualViewport.addEventListener('resize', () => this.fitFrame());
                window.visualViewport.addEventListener('scroll', () => this.fitFrame());
            }

            if (this.settings.widgetPosition === 'hidden') {
                this.container.style.display = 'none';
            }

            this.bindPanelEvents();
            this.updateUI();
        }

        /**
         * Keeps the widget at its normal size and in view, whatever the page's
         * viewport setup: on pages without <meta name="viewport"> a phone lays the
         * page out at ~980px and scales it down, and pinch-zoom magnifies everything.
         * When the visual viewport is scaled, the frame is sized to it in device
         * pixels and scaled back, so fixed children behave like on a normal page.
         */
        fitFrame() {
            const vv = window.visualViewport;
            const style = this.frame.style;
            if (!vv || Math.abs(vv.scale - 1) < 0.01) {
                style.cssText = '';
                return;
            }
            const s = vv.scale;
            style.cssText = `inset:auto;left:${vv.offsetLeft}px;top:${vv.offsetTop}px;`
                + `width:${vv.width * s}px;height:${vv.height * s}px;`
                + `transform:scale(${1 / s});transform-origin:0 0;`;
        }

        applyWidgetPosition(position) {
            if (position === 'hidden') {
                this.container.style.display = 'none';
                return;
            }

            this.container.style.display = '';

            let fullPosition = position;
            if (position === 'left') fullPosition = 'bottom-left';
            if (position === 'right') fullPosition = 'bottom-right';

            this.container.setAttribute('data-position', fullPosition);
        }

        buildPanelHTML() {
            return `
                <div class="aux-panel-header">
                    <h2 class="aux-panel-title">${this.t('title')}</h2>
                    <button class="aux-close-btn" aria-label="${this.t('close')}">${ICONS.close}</button>
                </div>
                <div class="aux-panel-body">
                    ${this.buildProfilesSection()}
                    ${this.buildDisplaySection()}
                    ${this.buildReadingAidsSection()}
                    ${this.buildOtherSection()}
                    ${this.buildWidgetPositionSection()}
                </div>
                <div class="aux-panel-footer">
                    ${this.buildResetButton()}
                </div>
            `;
        }

        buildProfilesSection() {
            const profiles = ['vision', 'dyslexia', 'adhd', 'motor', 'cognitive', 'seizure'].map(key => ({ key, icon: ICONS[key] }));
            const buttons = profiles.map(p => `
                <button class="aux-profile-btn" data-profile="${p.key}"
                        aria-pressed="false" title="${this.t('profile_' + p.key)}">
                    <span class="aux-profile-icon" aria-hidden="true">${p.icon}</span>
                    <span class="aux-profile-label">${this.t('profile_' + p.key)}</span>
                </button>
            `).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title" id="aux-h-profiles">${this.t('profiles')}</h3>
                    <div class="aux-profiles-grid" role="group" aria-labelledby="aux-h-profiles">${buttons}</div>
                </div>
            `;
        }

        buildDisplaySection() {
            const contrastOptions = ['normal', 'dark', 'light', 'high', 'inverted'];
            const contrastBtns = contrastOptions.map(c => `
                <button class="aux-contrast-btn" data-contrast="${c}" aria-pressed="false">
                    ${this.t('contrast_' + c)}
                </button>
            `).join('');

            const alignOptions = ['none', 'left', 'center', 'right'];
            const alignBtns = alignOptions.map(a => `
                <button class="aux-contrast-btn aux-align-btn" data-align="${a}" aria-pressed="false">
                    ${this.t('align_' + a)}
                </button>
            `).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title">${this.t('display')}</h3>
                    <div class="aux-option-group">
                        <span class="aux-option-label" id="aux-l-contrast">${this.t('contrast')}</span>
                        <div class="aux-contrast-group" role="group" aria-labelledby="aux-l-contrast">${contrastBtns}</div>
                    </div>
                    ${this.buildToggleRow('grayscale', this.t('grayscale'))}
                    ${this.buildStepperOption('brightness', this.t('brightness'), -2, 2)}
                    ${this.buildStepperOption('textSize', this.t('text_size'), 0, 3)}
                    ${this.buildStepperOption('lineHeight', this.t('line_height'), 0, 3)}
                    ${this.buildStepperOption('letterSpacing', this.t('letter_spacing'), 0, 3)}
                    <div class="aux-option-group">
                        <span class="aux-option-label" id="aux-l-align">${this.t('text_align')}</span>
                        <div class="aux-contrast-group" role="group" aria-labelledby="aux-l-align">${alignBtns}</div>
                    </div>
                </div>
            `;
        }

        buildStepperOption(key, label, min, max) {
            return `
                <div class="aux-option-group aux-option-row">
                    <span class="aux-option-label" id="aux-l-${key}">${label}</span>
                    <div class="aux-stepper" role="group" aria-labelledby="aux-l-${key}" data-key="${key}" data-min="${min}" data-max="${max}">
                        <button class="aux-stepper-btn" data-action="decrease" aria-label="${label} ${this.t('decrease')}"><span aria-hidden="true">\u2212</span></button>
                        <span class="aux-stepper-value" aria-live="polite">0</span>
                        <button class="aux-stepper-btn" data-action="increase" aria-label="${label} ${this.t('increase')}"><span aria-hidden="true">+</span></button>
                    </div>
                </div>
            `;
        }

        buildReadingAidsSection() {
            const toggles = [
                { key: 'highlightLinks', label: this.t('highlight_links') },
                { key: 'highlightHeadings', label: this.t('highlight_headings') },
                { key: 'readingRuler', label: this.t('reading_ruler') },
                { key: 'readingMask', label: this.t('reading_mask') },
                { key: 'dyslexiaFont', label: this.t('dyslexia_font') },
                { key: 'focusHighlight', label: this.t('focus_highlight') },
            ];
            return this.buildToggleSection(this.t('reading_aids'), toggles);
        }

        buildOtherSection() {
            // A larger cursor is meaningless without a mouse or trackpad (touch-only devices)
            const hasFinePointer = window.matchMedia('(any-pointer: fine)').matches;
            const toggles = [
                ...(hasFinePointer ? [{ key: 'bigCursor', label: this.t('big_cursor') }] : []),
                { key: 'stopAnimations', label: this.t('stop_animations') },
                { key: 'hideImages', label: this.t('hide_images') },
            ];

            const ttsButton = `
                <div class="aux-toggle-row">
                    <label class="aux-toggle-label">
                        <span>${this.t('text_reader')}</span>
                        <button class="aux-tts-btn aux-toggle" data-key="textReader" role="switch"
                                aria-checked="false" aria-label="${this.t('text_reader')}">
                            <span class="aux-toggle-track">
                                <span class="aux-toggle-thumb"></span>
                            </span>
                        </button>
                    </label>
                </div>
            `;

            const items = toggles.map(t => this.buildToggleRow(t.key, t.label)).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title">${this.t('other')}</h3>
                    ${items}
                    ${ttsButton}
                </div>
            `;
        }

        buildWidgetPositionSection() {
            const positions = [
                { key: 'left', label: this.t('widget_left') },
                { key: 'right', label: this.t('widget_right') },
                { key: 'hidden', label: this.t('widget_hide') },
            ];
            const btns = positions.map(p => `
                <button class="aux-contrast-btn aux-widget-pos-btn" data-widget-pos="${p.key}" aria-pressed="false">
                    ${p.label}
                </button>
            `).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title" id="aux-h-position">${this.t('widget_position')}</h3>
                    <div class="aux-option-group">
                        <div class="aux-contrast-group" role="group" aria-labelledby="aux-h-position">${btns}</div>
                    </div>
                </div>
            `;
        }

        buildToggleRow(key, label) {
            return `
                <div class="aux-toggle-row">
                    <label class="aux-toggle-label">
                        <span>${label}</span>
                        <button class="aux-toggle" data-key="${key}" role="switch"
                                aria-checked="false" aria-label="${label}">
                            <span class="aux-toggle-track">
                                <span class="aux-toggle-thumb"></span>
                            </span>
                        </button>
                    </label>
                </div>
            `;
        }

        buildToggleSection(title, toggles) {
            const items = toggles.map(t => this.buildToggleRow(t.key, t.label)).join('');

            return `
                <div class="aux-section">
                    <h3 class="aux-section-title">${title}</h3>
                    ${items}
                </div>
            `;
        }

        buildResetButton() {
            return `
                <button class="aux-reset-btn">
                    ${ICONS.reset}
                    ${this.t('reset')}
                </button>
            `;
        }

        // ── Event Binding ──

        bindPanelEvents() {
            this.panel.querySelector('.aux-close-btn')
                .addEventListener('click', () => this.toggle(true));

            this.panel.querySelectorAll('.aux-profile-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const profile = btn.dataset.profile;
                    this.applyProfile(profile);
                });
            });

            this.panel.querySelectorAll('.aux-contrast-btn:not(.aux-widget-pos-btn):not(.aux-align-btn)').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.setSetting('contrast', btn.dataset.contrast);
                });
            });

            this.panel.querySelectorAll('.aux-align-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.setSetting('textAlign', btn.dataset.align);
                });
            });

            this.panel.querySelectorAll('.aux-stepper').forEach(stepper => {
                const key = stepper.dataset.key;
                const min = parseInt(stepper.dataset.min, 10);
                const max = parseInt(stepper.dataset.max, 10);

                stepper.querySelectorAll('.aux-stepper-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        let val = this.settings[key] || 0;
                        val = btn.dataset.action === 'increase'
                            ? Math.min(val + 1, max)
                            : Math.max(val - 1, min);
                        this.setSetting(key, val);
                    });
                });
            });

            this.panel.querySelectorAll('.aux-toggle:not(.aux-tts-btn)').forEach(toggle => {
                toggle.addEventListener('click', () => {
                    const key = toggle.dataset.key;
                    this.setSetting(key, !this.settings[key]);
                });
            });

            const ttsBtn = this.panel.querySelector('.aux-tts-btn');
            if (ttsBtn) {
                ttsBtn.addEventListener('click', () => this.toggleTTS());
            }

            this.panel.querySelectorAll('.aux-widget-pos-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const pos = btn.dataset.widgetPos;
                    this.settings.widgetPosition = pos;
                    this.save();
                    this.applyWidgetPosition(pos);
                    this.updateUI();

                    if (pos === 'hidden') {
                        this.isOpen = false;
                        this.panel.classList.remove('aux-panel-open');
                        this.container.classList.remove('aux-widget-open');
                        this.showHiddenToast();
                    }
                });
            });

            this.panel.querySelector('.aux-reset-btn')
                .addEventListener('click', () => this.resetAll());
        }

        bindGlobalEvents() {
            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                if (this.isOpen) {
                    this.toggle(true);
                } else if (this.ttsActive) {
                    this.stopTTS();
                    this.updateUI();
                }
            });

            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.inWidget(e)) {
                    this.toggle();
                }
            });

            document.addEventListener('mousemove', (e) => {
                if (this.settings.readingRuler && this.rulerEl) {
                    this.rulerEl.style.top = e.clientY + 'px';
                }
                this.moveMask(e.clientY);
            });

            const onTouch = (e) => {
                if (!e.touches.length) return;
                const y = e.touches[0].clientY;
                if (this.settings.readingRuler && this.rulerEl) {
                    this.rulerEl.style.top = y + 'px';
                }
                this.moveMask(y);
            };
            document.addEventListener('touchstart', onTouch, { passive: true });
            document.addEventListener('touchmove', onTouch, { passive: true });

            // Keyboard users: mask follows the focused element
            document.addEventListener('focusin', (e) => {
                if (!this.settings.readingMask || this.inWidget(e)) return;
                const r = e.target.getBoundingClientRect();
                this.moveMask(Math.min(Math.max(r.top + r.height / 2, 0), window.innerHeight));
            });

            // TTS: click-to-read when active
            document.addEventListener('click', (e) => {
                if (!this.ttsActive) return;
                if (this.inWidget(e)) return;

                const el = e.target.closest('p, h1, h2, h3, h4, h5, h6, li, td, th, span, a, label, blockquote, figcaption');
                if (el) {
                    e.preventDefault();
                    this.speakElement(el);
                }
            }, true);

            // Keyboard shortcut to show hidden widget
            document.addEventListener('keydown', (e) => {
                const modifierOK = (e.ctrlKey || e.metaKey) && e.altKey;
                const keyOK = e.code === 'KeyA' || e.key.toLowerCase() === 'a' || e.key === 'å' || e.key === 'Å';
                if (modifierOK && keyOK) {
                    e.preventDefault();
                    if (this.container.style.display !== 'none') {
                        this.toggle(true);
                        return;
                    }
                    this.settings.widgetPosition = null;
                    this.save();
                    this.applyWidgetPosition(this.config.position || 'bottom-right');
                    this.updateUI();
                }
            });
        }

        // ── Actions ──

        // Events from inside the shadow root are retargeted to the host at document level
        inWidget(e) {
            return e.composedPath().includes(this.frame);
        }

        /**
         * Survives page changes that swap <body> (Turbo, Swup, PJAX, ...) and printing.
         */
        watchDocument() {
            let body = document.body;
            new MutationObserver(() => {
                if (!this.frame.isConnected) {
                    document.documentElement.insertBefore(this.frame, document.body);
                }
                if (document.body !== body) {
                    body = document.body;
                    this.bgMarked = false;
                    this.applyAll();
                }
            }).observe(document.documentElement, { childList: true });

            // print the page as it is, without filters or colour overrides
            window.addEventListener('beforeprint', () => {
                document.body.style.removeProperty('filter');
                document.documentElement.classList.remove('aux-filtered', 'aux-contrast-dark',
                    'aux-contrast-light', 'aux-contrast-high', 'aux-contrast-inverted');
            });
            window.addEventListener('afterprint', () => this.applyAll());
        }

        toggle(returnFocus = false) {
            this.isOpen = !this.isOpen;
            this.panel.classList.toggle('aux-panel-open', this.isOpen);
            this.container.classList.toggle('aux-widget-open', this.isOpen);
            this.button.setAttribute('aria-expanded', String(this.isOpen));

            if (this.isOpen) {
                const firstBtn = this.panel.querySelector('.aux-profile-btn, .aux-close-btn');
                if (firstBtn) firstBtn.focus();
            } else if (returnFocus) {
                this.button.focus();
            }
        }

        setSetting(key, value) {
            this.settings[key] = value;
            // Reading ruler and reading mask are mutually exclusive
            if (value && key === 'readingMask') this.settings.readingRuler = false;
            if (value && key === 'readingRuler') this.settings.readingMask = false;
            if (key !== 'activeProfile') {
                this.settings.activeProfile = null;
            }
            this.save();
            this.applyAll();
            this.updateUI();
        }

        applyProfile(profileKey) {
            if (this.settings.activeProfile === profileKey) {
                this.settings = { ...DEFAULT_SETTINGS };
                this.settings.activeProfile = null;
            } else {
                const widgetPos = this.settings.widgetPosition;
                this.settings = { ...DEFAULT_SETTINGS };
                this.settings.widgetPosition = widgetPos;
                const profile = PROFILES[profileKey];
                if (profile) {
                    Object.assign(this.settings, profile);
                    this.settings.activeProfile = profileKey;
                }
            }
            this.save();
            this.applyAll();
            this.updateUI();
        }

        resetAll() {
            this.settings = { ...DEFAULT_SETTINGS };
            this.stopTTS();
            this.resumeAllVideos();
            try {
                localStorage.removeItem(STORAGE_KEY);
            } catch (e) {
                // localStorage not available
            }
            this.applyWidgetPosition(this.config.position || 'bottom-right');
            this.applyAll();
            this.updateUI();
        }

        // ── Apply CSS Classes ──

        applyAll() {
            const html = document.documentElement;

            // Remove all aux classes from html
            const toRemove = [];
            html.classList.forEach(cls => {
                if (cls.startsWith('aux-')) toRemove.push(cls);
            });
            toRemove.forEach(cls => html.classList.remove(cls));

            this.applyFilters();

            if (this.settings.contrast !== 'normal') {
                html.classList.add('aux-contrast-' + this.settings.contrast);
            }

            if (this.settings.textSize > 0) {
                html.classList.add('aux-text-size-' + this.settings.textSize);
            }

            if (this.settings.lineHeight > 0) {
                html.classList.add('aux-line-height-' + this.settings.lineHeight);
            }

            if (this.settings.letterSpacing > 0) {
                html.classList.add('aux-letter-spacing-' + this.settings.letterSpacing);
            }

            if (this.settings.textAlign && this.settings.textAlign !== 'none') {
                html.classList.add('aux-text-align-' + this.settings.textAlign);
            }

            const booleanClasses = {
                highlightLinks: 'aux-highlight-links',
                highlightHeadings: 'aux-highlight-headings',
                dyslexiaFont: 'aux-dyslexia-font',
                focusHighlight: 'aux-focus-highlight',
                bigCursor: 'aux-big-cursor',
                stopAnimations: 'aux-stop-animations',
                hideImages: 'aux-hide-images',
            };

            for (const [key, cls] of Object.entries(booleanClasses)) {
                if (this.settings[key]) {
                    html.classList.add(cls);
                }
            }

            this.handleReadingRuler();
            this.handleReadingMask();
            this.handleVideos();
            this.markBackgroundImages();
        }

        /**
         * Composes contrast mode + brightness + grayscale into ONE filter on
         * <body> (a second filter would overwrite the first). The widget lives
         * under <html>, outside <body>, so it is never filtered.
         * A filter on <body> doesn't reach the canvas, so a filtered backdrop in the
         * page colour (--aux-page-bg / --aux-filter) is drawn behind it (aux-adjustments.css).
         */
        applyFilters() {
            const { contrast, brightness, grayscale } = this.settings;
            const filter = [
                CONTRAST_FILTERS[contrast],
                brightness ? `brightness(${1 + brightness * 0.15})` : '',
                grayscale ? 'grayscale(1)' : '',
            ].filter(Boolean).join(' ');

            const body = document.body;
            if (!filter) {
                body.style.removeProperty('filter');
                document.documentElement.style.removeProperty('--aux-filter');
                return;
            }

            // aux-* classes are already removed here, so these are the site's own colours
            const solid = (c) => c && c !== 'transparent' && !/,\s*0\)$/.test(c);
            const bodyBg = getComputedStyle(body).backgroundColor;
            const htmlBg = getComputedStyle(document.documentElement).backgroundColor;
            document.documentElement.style.setProperty('--aux-page-bg', solid(bodyBg) ? bodyBg : (solid(htmlBg) ? htmlBg : '#ffffff'));
            document.documentElement.style.setProperty('--aux-filter', filter);
            document.documentElement.classList.add('aux-filtered');
            body.style.setProperty('filter', filter, 'important');
        }

        handleReadingMask() {
            if (this.settings.readingMask) {
                if (!this.maskEls) {
                    this.maskEls = ['top', 'bottom'].map(pos => {
                        const el = document.createElement('div');
                        el.className = 'aux-mask aux-mask-' + pos;
                        el.setAttribute('aria-hidden', 'true');
                        document.documentElement.appendChild(el);
                        return el;
                    });
                }
                this.maskEls.forEach(el => { el.style.display = 'block'; });
                this.moveMask(this.maskY === null ? window.innerHeight / 2 : this.maskY);
            } else if (this.maskEls) {
                this.maskEls.forEach(el => { el.style.display = 'none'; });
            }
        }

        moveMask(y) {
            this.maskY = y;
            if (!this.settings.readingMask || !this.maskEls) return;
            const half = MASK_HEIGHT / 2;
            this.maskEls[0].style.height = Math.max(0, y - half) + 'px';
            this.maskEls[1].style.top = (y + half) + 'px';
        }

        markBackgroundImages() {
            // Needed for modes that invert the page – so elements with
            // class-based background-images can be counter-inverted.
            const needsMarking = ['dark', 'inverted'].includes(this.settings.contrast);

            if (!needsMarking) {
                if (this.bgMarked) {
                    document.querySelectorAll('.aux-has-bg-image').forEach(el => {
                        el.classList.remove('aux-has-bg-image');
                    });
                    this.bgMarked = false;
                }
                return;
            }

            // a full scan runs once per mode switch, not on every setting change
            if (this.bgMarked) return;
            this.bgMarked = true;

            const elements = document.querySelectorAll('body *');
            let count = 0;
            const MAX_SCAN = 5000;

            for (const el of elements) {
                if (count++ > MAX_SCAN) break;
                const bg = window.getComputedStyle(el).backgroundImage;
                if (bg && bg !== 'none' && bg.includes('url(')) {
                    el.classList.add('aux-has-bg-image');
                }
            }
        }

        handleReadingRuler() {
            if (this.settings.readingRuler) {
                if (!this.rulerEl) {
                    this.rulerEl = document.createElement('div');
                    this.rulerEl.className = 'aux-reading-ruler';
                    this.rulerEl.setAttribute('aria-hidden', 'true');
                    // child of <html> like the mask: <body> may carry the filter
                    document.documentElement.appendChild(this.rulerEl);
                }
                this.rulerEl.style.display = 'block';
            } else if (this.rulerEl) {
                this.rulerEl.style.display = 'none';
            }
        }

        handleVideos() {
            if (this.settings.stopAnimations) {
                document.querySelectorAll('video:not(.aux-widget video)').forEach(video => {
                    if (!video.paused) {
                        video.pause();
                        video.dataset.auxPaused = 'true';
                    }
                });
                document.querySelectorAll('iframe').forEach(iframe => {
                    try {
                        iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
                    } catch (e) { /* cross-origin */ }
                });
            } else {
                this.resumeAllVideos();
            }
        }

        resumeAllVideos() {
            document.querySelectorAll('video[data-aux-paused="true"]').forEach(video => {
                video.play().catch(() => {});
                delete video.dataset.auxPaused;
            });
        }

        // ── Text-to-Speech ──

        toggleTTS() {
            this.ttsActive = !this.ttsActive;
            if (!this.ttsActive) {
                this.stopTTS();
            }
            this.updateUI();

            if (this.ttsActive) {
                document.body.style.cursor = 'crosshair';
            } else {
                document.body.style.cursor = '';
            }
        }

        speakElement(el) {
            if (!('speechSynthesis' in window)) return;
            window.speechSynthesis.cancel();

            document.querySelectorAll('.aux-tts-highlight').forEach(e => {
                e.classList.remove('aux-tts-highlight');
            });

            const text = el.textContent.trim();
            if (!text) return;

            el.classList.add('aux-tts-highlight');

            this.ttsUtterance = new SpeechSynthesisUtterance(text);
            // the page's language, not the widget's (e.g. a French page gets an English UI)
            this.ttsUtterance.lang = document.documentElement.lang
                || (this.config.lang === 'en' ? 'en-US' : this.config.lang + '-' + this.config.lang.toUpperCase());

            this.ttsUtterance.onend = () => {
                el.classList.remove('aux-tts-highlight');
            };
            this.ttsUtterance.onerror = () => {
                el.classList.remove('aux-tts-highlight');
            };

            window.speechSynthesis.speak(this.ttsUtterance);
        }

        stopTTS() {
            this.ttsActive = false;
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            document.body.style.cursor = '';
            document.querySelectorAll('.aux-tts-highlight').forEach(e => {
                e.classList.remove('aux-tts-highlight');
            });
        }

        // ── Hidden Toast ──

        showHiddenToast() {
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#333;color:#fff;padding:12px 24px;border-radius:8px;font-size:14px;z-index:999999;font-family:-apple-system,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
            toast.setAttribute('role', 'status');
            toast.textContent = this.t('widget_hidden_hint');
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transition = 'opacity 0.5s';
                setTimeout(() => toast.remove(), 500);
            }, 4000);
        }

        // ── Update UI State ──

        updateUI() {
            this.panel.querySelectorAll('.aux-profile-btn').forEach(btn => {
                const isActive = btn.dataset.profile === this.settings.activeProfile;
                btn.classList.toggle('aux-profile-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            this.panel.querySelectorAll('.aux-contrast-btn:not(.aux-widget-pos-btn):not(.aux-align-btn)').forEach(btn => {
                const isActive = btn.dataset.contrast === this.settings.contrast;
                btn.classList.toggle('aux-contrast-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            this.panel.querySelectorAll('.aux-align-btn').forEach(btn => {
                const isActive = btn.dataset.align === this.settings.textAlign;
                btn.classList.toggle('aux-contrast-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            this.panel.querySelectorAll('.aux-widget-pos-btn').forEach(btn => {
                const pos = btn.dataset.widgetPos;
                const currentPos = this.settings.widgetPosition;
                let isActive = false;
                if (currentPos) {
                    isActive = pos === currentPos;
                } else {
                    const serverPos = this.config.position || 'bottom-right';
                    isActive = (pos === 'right' && serverPos.includes('right')) ||
                               (pos === 'left' && serverPos.includes('left'));
                }
                btn.classList.toggle('aux-contrast-active', isActive);
                btn.setAttribute('aria-pressed', String(isActive));
            });

            this.panel.querySelectorAll('.aux-stepper').forEach(stepper => {
                const key = stepper.dataset.key;
                const val = this.settings[key] || 0;
                stepper.querySelector('.aux-stepper-value').textContent = val > 0 ? '+' + val : val;

                const min = parseInt(stepper.dataset.min, 10);
                const max = parseInt(stepper.dataset.max, 10);
                stepper.querySelector('[data-action="decrease"]').disabled = val <= min;
                stepper.querySelector('[data-action="increase"]').disabled = val >= max;
            });

            this.panel.querySelectorAll('.aux-toggle:not(.aux-tts-btn)').forEach(toggle => {
                const key = toggle.dataset.key;
                const isActive = !!this.settings[key];
                toggle.classList.toggle('aux-toggle-active', isActive);
                toggle.setAttribute('aria-checked', String(isActive));
            });

            this.ttsBar.hidden = !this.ttsActive;
            this.ttsBar.querySelector('.aux-tts-msg').textContent = this.ttsActive ? this.t('tts_active') : '';

            const ttsBtn = this.panel.querySelector('.aux-tts-btn');
            if (ttsBtn) {
                ttsBtn.classList.toggle('aux-toggle-active', this.ttsActive);
                ttsBtn.setAttribute('aria-checked', String(this.ttsActive));
            }
        }
    }

    // ── Init ──

    function readConfig() {
        const block = document.getElementById('aux-config');
        if (block) {
            try {
                return JSON.parse(block.textContent);
            } catch (e) {
                return null;
            }
        }
        return window.auxConfig || null; // legacy inline config
    }

    function init() {
        const config = readConfig();
        // run once, even if the script is included twice
        if (!config || document.querySelector('aux-widget-root')) return;
        new AuxWidget(config);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
