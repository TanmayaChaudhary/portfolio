/**
 * content-loader.js — JSON Content Renderer
 * 
 * Single source of truth: ALL site content is driven by data/content.json.
 * HTML serves as a structural template only — text and URLs come from JSON.
 * 
 * Requires: HTTP server (fetch won't work on file:// protocol)
 * Local dev: python3 -m http.server 8000
 * Production: GitHub Pages serves via HTTPS (works automatically)
 * 
 * MUST be loaded AFTER main.js (Slick, AOS, text-type are already initialized).
 */
(function () {
  'use strict';

  // --- Configure marked.js for markdown rendering ---
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: true,
      gfm: true,
      highlight: function(code, lang) {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          try { return hljs.highlight(code, { language: lang }).value; } catch (e) {}
        }
        if (typeof hljs !== 'undefined') {
          try { return hljs.highlightAuto(code).value; } catch (e) {}
        }
        return code;
      }
    });
  }

  // --- Utility Helpers ---

  function setText(selector, text) {
    var el = document.querySelector('[data-content="' + selector + '"]');
    if (el && text != null) el.textContent = text;
  }

  function setHTML(selector, html) {
    var el = document.querySelector('[data-content="' + selector + '"]');
    if (el && html != null) el.innerHTML = html;
  }

  // --- Section Renderers ---

  function renderHero(data) {
    if (!data) return;
    setText('hero-tagline', data.tagline);
    setText('hero-name', data.name);
    setText('hero-description', data.description);

    // Skill icons — render from JSON array
    if (data.skillIcons && data.skillIcons.length) {
      var iconList = document.querySelector('[data-content="hero-skill-icons"]');
      if (iconList) {
        var html = '';
        for (var i = 0; i < data.skillIcons.length; i++) {
          html += '<li><img src="' + data.skillIcons[i].src + '" alt="' + escapeHTML(data.skillIcons[i].alt) + '"></li>';
        }
        iconList.innerHTML = html;
      }
    }

    // Rotating roles — update <b> tags inside cd-words-wrapper
    if (data.roles && data.roles.length) {
      var wrapper = document.querySelector('[data-content="hero-roles"]');
      if (wrapper) {
        var html = '';
        for (var i = 0; i < data.roles.length; i++) {
          var cls = i === 0 ? 'is-visible' : 'is-hidden';
          html += '<b class="' + cls + '">' + escapeHTML(data.roles[i]) + '</b>';
        }
        wrapper.innerHTML = html;
        // Adjust wrapper width to first visible item
        var visible = wrapper.querySelector('.is-visible');
        if (visible) {
          wrapper.style.width = (visible.offsetWidth + 10) + 'px';
        }
      }
    }
  }

  function renderSocialLinks(social) {
    if (!social) return;

    var linkMap = {
      linkedin: social.linkedin || '#',
      github: social.github || '#',
      twitter: social.twitter || '#'
    };

    // Update all social groups (marked with data-social attribute)
    var groups = document.querySelectorAll('[data-social]');
    groups.forEach(function (group) {
      Object.keys(linkMap).forEach(function (platform) {
        // For <ul> groups: find <li class="platform"> > a
        var li = group.querySelector('li.' + platform + ' > a');
        if (li) {
          li.setAttribute('href', linkMap[platform]);
          return;
        }
        // For <div class="social-icone">: find a with feather-platform SVG inside
        var links = group.querySelectorAll('a');
        links.forEach(function (a) {
          var svg = a.querySelector('.feather-' + platform);
          if (svg) {
            a.setAttribute('href', linkMap[platform]);
          }
        });
      });
    });
  }

  function renderServices(data) {
    if (!data) return;
    setText('features-subtitle', data.subtitle);
    setText('features-title', data.title);

    var items = data.items;
    if (!items || !items.length) return;
    for (var i = 0; i < items.length; i++) {
      setText('service-' + i + '-title', items[i].title);
      setText('service-' + i + '-desc', items[i].description);
      // Update icon from JSON (feather-cpu → cpu)
      var iconEl = document.querySelector('[data-content="service-' + i + '-icon"]');
      if (iconEl && items[i].icon) {
        var iconName = items[i].icon.replace('feather-', '');
        iconEl.setAttribute('data-feather', iconName);
      }
    }
  }

  function renderPortfolio(data) {
    if (!data) return;
    setText('portfolio-subtitle', data.subtitle);
    setText('portfolio-title', data.title);

    if (data.items && data.items.length) {
      for (var i = 0; i < data.items.length; i++) {
        setText('portfolio-' + i + '-category', data.items[i].category);
        // Company badge with logo
        var companyEl = document.querySelector('[data-content="portfolio-' + i + '-company"]');
        if (companyEl && data.items[i].companyShort) {
          var logoHtml = '';
          if (data.items[i].companyLogo) {
            logoHtml = '<img src="' + data.items[i].companyLogo + '" alt="' + escapeHTML(data.items[i].companyShort) + '"> ';
          }
          companyEl.innerHTML = logoHtml + escapeHTML(data.items[i].companyShort);
        }
        // Title includes arrow icon
        var titleEl = document.querySelector('[data-content="portfolio-' + i + '-title"]');
        if (titleEl && data.items[i].title) {
          titleEl.innerHTML = escapeHTML(data.items[i].title) + ' <i class="feather-arrow-up-right"></i>';
        }
        // Impact line with icon
        var impactEl = document.querySelector('[data-content="portfolio-' + i + '-impact"]');
        if (impactEl && data.items[i].impact) {
          var iconHtml = '';
          if (data.items[i].impactIcon) {
            iconHtml = '<i data-feather="' + data.items[i].impactIcon + '"></i> ';
          }
          impactEl.innerHTML = iconHtml + escapeHTML(data.items[i].impact);
        }
      }

      // Attach click handlers to portfolio cards for dynamic modal
      var cards = document.querySelectorAll('[data-portfolio-index]');
      cards.forEach(function (card) {
        card.addEventListener('click', function () {
          var index = parseInt(card.getAttribute('data-portfolio-index'));
          populatePortfolioModal(data.items[index]);
        });
      });
    }
  }

  function populatePortfolioModal(project) {
    if (!project) return;

    // Company badge with logo
    var companyLogoEl = document.querySelector('[data-content="modal-portfolio-company-logo"]');
    if (companyLogoEl && project.companyLogo) {
      companyLogoEl.setAttribute('src', project.companyLogo);
      companyLogoEl.setAttribute('alt', project.companyShort || '');
      companyLogoEl.style.display = '';
    } else if (companyLogoEl) {
      companyLogoEl.style.display = 'none';
    }

    // Company name (short version)
    setText('modal-portfolio-company', project.companyShort || project.company);

    // Category badge
    setText('modal-portfolio-category', project.category);

    // Title
    setText('modal-portfolio-title', project.title);

    // Team
    setText('modal-portfolio-team', project.team || '');

    // Impact badge with icon
    var impactEl = document.querySelector('[data-content="modal-portfolio-impact"]');
    if (impactEl && project.impact) {
      var iconHtml = '';
      if (project.impactIcon) {
        iconHtml = '<i data-feather="' + project.impactIcon + '"></i> ';
      }
      impactEl.innerHTML = iconHtml + escapeHTML(project.impact);
      impactEl.style.display = '';
    } else if (impactEl) {
      impactEl.style.display = 'none';
    }

    // Problem statement
    setText('modal-portfolio-problem', project.problem || '');

    // Description (array of bullet points)
    var descEl = document.querySelector('[data-content="modal-portfolio-description"]');
    if (descEl && project.description) {
      if (Array.isArray(project.description)) {
        var html = '';
        for (var i = 0; i < project.description.length; i++) {
          html += '<div class="bullet-item"><span class="arrow">→</span><span>' + escapeHTML(project.description[i]) + '</span></div>';
        }
        descEl.innerHTML = html;
      } else {
        descEl.innerHTML = '<div class="bullet-item"><span class="arrow">→</span><span>' + escapeHTML(project.description) + '</span></div>';
      }
    }

    // Tech tags
    var techEl = document.querySelector('[data-content="modal-portfolio-tech"]');
    if (techEl && project.tech && project.tech.length) {
      var html = '';
      for (var i = 0; i < project.tech.length; i++) {
        html += '<span class="tech-tag">' + escapeHTML(project.tech[i]) + '</span>';
      }
      techEl.innerHTML = html;
    }

    // Architecture diagram
    var archEl = document.querySelector('[data-content="modal-portfolio-architecture"]');
    var archSection = document.querySelector('.portfolio-modal-architecture');
    if (archEl && project.architecture) {
      archEl.setAttribute('src', project.architecture);
      archEl.setAttribute('alt', (project.title || '') + ' Architecture');
      if (archSection) archSection.style.display = '';
    } else if (archSection) {
      archSection.style.display = 'none';
    }

    // Re-render feather icons inside the modal
    try { feather.replace(); } catch (e) {}
  }

  function renderResume(data) {
    if (!data) return;
    setText('resume-subtitle', data.subtitle);
    setText('resume-title', data.title);

    if (data.experience) {
      var exp = data.experience;
      setText('resume-recent-label', exp.recentLabel);
      setText('resume-recent-title', exp.recentTitle);
      setText('resume-previous-label', exp.previousLabel);
      setText('resume-previous-title', exp.previousTitle);

      if (exp.recent) {
        for (var i = 0; i < exp.recent.length; i++) {
          setText('exp-recent-' + i + '-role', exp.recent[i].role);
          setText('exp-recent-' + i + '-company', exp.recent[i].company);
          setText('exp-recent-' + i + '-badge', exp.recent[i].badge);
          setText('exp-recent-' + i + '-desc', exp.recent[i].description);
        }
      }
      if (exp.previous) {
        for (var i = 0; i < exp.previous.length; i++) {
          setText('exp-prev-' + i + '-role', exp.previous[i].role);
          setText('exp-prev-' + i + '-company', exp.previous[i].company);
          setText('exp-prev-' + i + '-badge', exp.previous[i].badge);
          setText('exp-prev-' + i + '-desc', exp.previous[i].description);
        }
      }
    }

    if (data.skills) {
      setText('skills-left-title', data.skills.leftTitle);
      setText('skills-left-label', data.skills.leftLabel);
      setText('skills-right-title', data.skills.rightTitle);
      setText('skills-right-label', data.skills.rightLabel);

      if (data.skills.left) {
        for (var i = 0; i < data.skills.left.length; i++) {
          setText('skill-left-' + i + '-name', data.skills.left[i].name);
          updateProgressBar('skill-left-' + i + '-name', data.skills.left[i].percentage);
        }
      }
      if (data.skills.right) {
        for (var i = 0; i < data.skills.right.length; i++) {
          setText('skill-right-' + i + '-name', data.skills.right[i].name);
          updateProgressBar('skill-right-' + i + '-name', data.skills.right[i].percentage);
        }
      }
    }

    // Education tab
    if (data.education) {
      var edu = data.education;
      setText('edu-left-label', edu.leftLabel);
      setText('edu-left-title', edu.leftTitle);
      setText('edu-right-label', edu.rightLabel);
      setText('edu-right-title', edu.rightTitle);

      if (edu.left) {
        for (var i = 0; i < edu.left.length; i++) {
          setText('edu-left-' + i + '-title', edu.left[i].title);
          setText('edu-left-' + i + '-institution', edu.left[i].institution);
          setText('edu-left-' + i + '-badge', edu.left[i].badge);
          setText('edu-left-' + i + '-desc', edu.left[i].description);
        }
      }
      if (edu.right) {
        for (var i = 0; i < edu.right.length; i++) {
          setText('edu-right-' + i + '-title', edu.right[i].title);
          setText('edu-right-' + i + '-institution', edu.right[i].institution);
          setText('edu-right-' + i + '-badge', edu.right[i].badge);
          setText('edu-right-' + i + '-desc', edu.right[i].description);
        }
      }
    }

    // Certifications tab
    if (data.certifications) {
      var cert = data.certifications;
      setText('cert-left-label', cert.leftLabel);
      setText('cert-left-title', cert.leftTitle);
      setText('cert-right-label', cert.rightLabel);
      setText('cert-right-title', cert.rightTitle);

      if (cert.left) {
        for (var i = 0; i < cert.left.length; i++) {
          setText('cert-left-' + i + '-title', cert.left[i].title);
          setText('cert-left-' + i + '-institution', cert.left[i].institution);
          setText('cert-left-' + i + '-badge', cert.left[i].badge);
          setText('cert-left-' + i + '-desc', cert.left[i].description);
        }
      }
      if (cert.right) {
        for (var i = 0; i < cert.right.length; i++) {
          setText('cert-right-' + i + '-title', cert.right[i].title);
          setText('cert-right-' + i + '-institution', cert.right[i].institution);
          setText('cert-right-' + i + '-badge', cert.right[i].badge);
          setText('cert-right-' + i + '-desc', cert.right[i].description);
        }
      }
    }
  }

  function renderTestimonials(data) {
    if (!data) return;
    setText('testimonial-subtitle', data.subtitle);
    setText('testimonial-title', data.title);

    if (data.items && data.items.length) {
      for (var i = 0; i < data.items.length; i++) {
        var t = data.items[i];
        setText('testimonial-' + i + '-company', t.company);
        setText('testimonial-' + i + '-team', t.team);
        setText('testimonial-' + i + '-designation', t.designation);
        setText('testimonial-' + i + '-project', t.projectTitle);
        setText('testimonial-' + i + '-date', t.date);
        setText('testimonial-' + i + '-quote', t.quote);
      }

      // Refresh Slick carousel dimensions after content update
      try {
        var $slider = jQuery('.testimonial-activation');
        if ($slider.length && $slider.hasClass('slick-initialized')) {
          $slider.slick('setPosition');
        }
      } catch (e) {}
    }
  }

  function renderTechStack(data) {
    if (!data) return;
    setText('techstack-subtitle', data.subtitle);
    setText('techstack-title', data.title);
  }

  function renderPricing(data) {
    if (!data) return;

    var pricingEl = document.getElementById('pricing-mode-pricing');
    var processEl = document.getElementById('pricing-mode-process');

    if (data.mode === 'process') {
      // Show Process, hide Pricing
      if (pricingEl) pricingEl.style.display = 'none';
      if (processEl) processEl.style.display = '';
      renderProcess(data.processData);
    } else {
      // Show Pricing, hide Process (default)
      if (pricingEl) pricingEl.style.display = '';
      if (processEl) processEl.style.display = 'none';
      renderPricingCards(data);
    }
  }

  function renderPricingCards(data) {
    setText('pricing-subtitle', data.subtitle);
    setText('pricing-title', data.title);

    var pd = data.pricingData;
    if (!pd) return;

    // Update tab labels
    if (pd.tabs) {
      for (var i = 0; i < pd.tabs.length; i++) {
        setText('pricing-tab-' + i, pd.tabs[i]);
      }
    }

    // Build pricing card HTML for each tier
    var tabContent = document.getElementById('pricingTabContent');
    if (!tabContent || !pd.items) return;

    var html = '';
    for (var i = 0; i < pd.items.length; i++) {
      var item = pd.items[i];
      var active = (i === 1) ? ' show active' : '';
      var paneId = 'pricing-pane-' + i;

      // Build deliverables list
      var deliverablesHtml = '';
      if (item.deliverables) {
        deliverablesHtml = '<div class="deliverable-list">';
        for (var j = 0; j < item.deliverables.length; j++) {
          deliverablesHtml += '<div class="deliverable-item"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>' + escapeHTML(item.deliverables[j]) + '</span></div>';
        }
        deliverablesHtml += '</div>';
      }

      html += '<div class="tab-pane fade' + active + '" id="' + paneId + '" aria-labelledby="pricing-tab-' + i + '-btn">' +
        '<div class="rn-pricing">' +
          '<div class="pricing-header">' +
            '<div class="header-left">' +
              '<h2 class="title">' + escapeHTML(item.planTitle) + '</h2>' +
              '<span>' + escapeHTML(item.planSubtitle) + '</span>' +
            '</div>' +
            '<div class="header-right">' +
              '<span>' + escapeHTML(item.price) + '</span>' +
            '</div>' +
          '</div>' +
          '<div class="pricing-body">' +
            '<p class="description">' + escapeHTML(item.description) + '</p>' +
            deliverablesHtml +
          '</div>' +
          '<div class="pricing-footer">' +
            '<a href="#contacts" class="rn-btn d-block">' +
              '<span>GET STARTED</span>' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>' +
            '</a>' +
            '<div class="time-line d-flex">' +
              '<div class="single-cmt d-flex">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>' +
                '<span>' + escapeHTML(item.delivery) + '</span>' +
              '</div>' +
              '<div class="single-cmt d-flex">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>' +
                '<span>' + escapeHTML(item.revisions) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    tabContent.innerHTML = html;
  }

  function renderProcess(data) {
    if (!data) return;

    var container = document.getElementById('process-steps-container');
    if (!container) return;

    var html = '';
    for (var i = 0; i < data.steps.length; i++) {
      var step = data.steps[i];
      html += '<div class="col-lg-3 col-md-6 col-sm-6 col-12 process-step-wrapper">' +
        '<div class="process-step">' +
          '<div class="step-number">' + escapeHTML(step.number) + '</div>' +
          '<div class="step-icon"><i data-feather="' + step.icon + '"></i></div>' +
          '<h4 class="step-title">' + escapeHTML(step.title) + '</h4>' +
          '<p class="step-desc">' + escapeHTML(step.description) + '</p>' +
        '</div>' +
      '</div>';
    }

    container.innerHTML = html;

    // Update CTA if present
    if (data.cta) {
      var ctaEl = container.parentElement.querySelector('.rn-btn span');
      if (ctaEl) ctaEl.textContent = data.cta.text;
    }
  }

  function renderBlog(data) {
    if (!data) return;
    setText('blog-subtitle', data.subtitle);
    setText('blog-title', data.title);

    // Attach click handlers to blog cards for modal (using event delegation
    // so Slick carousel cloned slides also work)
    if (data.items && data.items.length) {
      var blogContainer = document.querySelector('.blog-slick-activation');
      if (blogContainer) {
        blogContainer.addEventListener('click', function (e) {
          var card = e.target.closest('[data-blog-index]');
          if (!card) return;
          var index = parseInt(card.getAttribute('data-blog-index'));
          if (isNaN(index) || !data.items[index]) return;
          populateBlogModal(data.items[index]);
          var modal = new bootstrap.Modal(document.getElementById('blogModal'));
          modal.show();
        });
      }

      // Re-init blog carousel with dots enabled
      try {
        var $blog = jQuery('.blog-slick-activation');
        if ($blog.length && $blog.hasClass('slick-initialized')) {
          $blog.slick('slickSetOption', 'dots', true, true);
        }
      } catch (e) {}
    }
  }

  function populateBlogModal(blog) {
    if (!blog || !blog.content) return;
    var c = blog.content;

    // Header
    var catEl = document.getElementById('blog-modal-category');
    if (catEl) catEl.textContent = blog.category;
    var timeEl = document.getElementById('blog-modal-readtime');
    if (timeEl) timeEl.textContent = blog.readTime;

    // Title
    var titleEl = document.getElementById('blog-modal-title');
    if (titleEl) titleEl.textContent = blog.title;

    // Introduction — render markdown for formatting
    var introEl = document.getElementById('blog-modal-intro');
    if (introEl) {
      if (typeof marked !== 'undefined') {
        introEl.innerHTML = marked.parse(c.introduction || '');
      } else {
        introEl.textContent = c.introduction;
      }
    }

    // Diagram
    var diagramEl = document.getElementById('blog-modal-diagram');
    if (diagramEl && c.diagram) {
      diagramEl.textContent = c.diagram;
      diagramEl.parentElement.style.display = '';
    } else if (diagramEl) {
      diagramEl.parentElement.style.display = 'none';
    }

    // Sections — render markdown with code highlighting
    var sectionsEl = document.getElementById('blog-modal-sections');
    if (sectionsEl && c.sections) {
      var html = '';
      for (var i = 0; i < c.sections.length; i++) {
        var s = c.sections[i];
        html += '<div class="blog-section">';
        html += '<h5>' + escapeHTML(s.heading) + '</h5>';
        if (typeof marked !== 'undefined') {
          html += '<div class="blog-section-body">' + marked.parse(s.text || '') + '</div>';
        } else {
          var paragraphs = s.text.split('\n\n');
          for (var j = 0; j < paragraphs.length; j++) {
            html += '<p>' + escapeHTML(paragraphs[j]) + '</p>';
          }
        }
        html += '</div>';
      }
      sectionsEl.innerHTML = html;

      // Apply syntax highlighting to all code blocks
      if (typeof hljs !== 'undefined') {
        var codeBlocks = sectionsEl.querySelectorAll('pre code');
        for (var k = 0; k < codeBlocks.length; k++) {
          hljs.highlightElement(codeBlocks[k]);
        }
      }
    }

    // Code Examples (Input → Code → Output)
    var examplesWrapper = document.getElementById('blog-modal-examples');
    var examplesList = document.getElementById('blog-modal-examples-list');
    if (examplesWrapper && examplesList && c.codeExamples && c.codeExamples.length) {
      examplesWrapper.style.display = '';
      var html = '';
      for (var i = 0; i < c.codeExamples.length; i++) {
        var ex = c.codeExamples[i];
        var num = i + 1;
        html += '<div class="blog-code-example">';
        html += '<div class="blog-code-example-title"><span class="example-number">' + num + '</span>' + escapeHTML(ex.title) + '</div>';

        // Input panel
        if (ex.input) {
          html += '<div class="blog-code-panel panel-input">';
          html += '<div class="blog-code-panel-label label-input"><span class="panel-icon">📥</span> INPUT</div>';
          html += '<pre><code>' + escapeHTML(ex.input) + '</code></pre>';
          html += '</div>';
        }

        // Code panel
        if (ex.code) {
          var lang = ex.language || 'python';
          var highlighted = ex.code;
          if (typeof hljs !== 'undefined') {
            try {
              highlighted = hljs.getLanguage(lang)
                ? hljs.highlight(ex.code, { language: lang }).value
                : hljs.highlightAuto(ex.code).value;
            } catch (e) { highlighted = escapeHTML(ex.code); }
          } else {
            highlighted = escapeHTML(ex.code);
          }
          html += '<div class="blog-code-panel panel-code">';
          html += '<div class="blog-code-panel-label label-code"><span class="panel-icon">💻</span> CODE <span style="opacity:0.5;margin-left:4px;font-weight:400;text-transform:none;">(' + escapeHTML(lang) + ')</span></div>';
          html += '<pre><code class="language-' + lang + '">' + highlighted + '</code></pre>';
          html += '</div>';
        }

        // Output panel
        if (ex.output) {
          html += '<div class="blog-code-panel panel-output">';
          html += '<div class="blog-code-panel-label label-output"><span class="panel-icon">📤</span> OUTPUT</div>';
          html += '<pre><code>' + escapeHTML(ex.output) + '</code></pre>';
          html += '</div>';
        }

        html += '</div>';
      }
      examplesList.innerHTML = html;
    } else if (examplesWrapper) {
      examplesWrapper.style.display = 'none';
      if (examplesList) examplesList.innerHTML = '';
    }

    // Key Takeaways
    var takeawaysEl = document.getElementById('blog-modal-takeaways');
    if (takeawaysEl && c.keyTakeaways) {
      var html = '';
      for (var i = 0; i < c.keyTakeaways.length; i++) {
        html += '<li>' + escapeHTML(c.keyTakeaways[i]) + '</li>';
      }
      takeawaysEl.innerHTML = html;
    }

    // References
    var refsEl = document.getElementById('blog-modal-references');
    if (refsEl && c.references) {
      var html = '';
      for (var i = 0; i < c.references.length; i++) {
        var r = c.references[i];
        html += '<a href="' + r.url + '" target="_blank" rel="noopener">' + escapeHTML(r.text) + ' ↗</a>';
      }
      refsEl.innerHTML = html;
    }

    // Re-render feather icons
    try { feather.replace(); } catch (e) {}
  }

  function renderContact(data) {
    if (!data) return;
    setText('contact-subtitle', data.subtitle);
    setText('contact-title', data.title);
    setText('contact-name', data.name);
    setText('contact-role', data.role);
    setText('contact-description', data.description);

    // Email link
    var emailLink = document.querySelector('[data-content="contact-email-link"]');
    if (emailLink && data.email) {
      emailLink.textContent = data.email;
      emailLink.setAttribute('href', 'mailto:' + data.email);
    }
  }

  function renderFooter(data) {
    if (!data) return;
    setText('footer-copyright', data.copyright);
  }

  // --- Helper: Update progress bar width and label ---

  function updateProgressBar(nameSelector, percentage) {
    var nameEl = document.querySelector('[data-content="' + nameSelector + '"]');
    if (!nameEl || percentage == null) return;

    var chartDiv = nameEl.closest('.progress-charts');
    if (!chartDiv) return;

    var bar = chartDiv.querySelector('.progress-bar');
    if (bar) {
      bar.style.width = percentage + '%';
      var label = bar.querySelector('.percent-label');
      if (label) label.textContent = percentage + '%';
    }
  }

  // --- Helper: Escape HTML entities ---

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  // --- Main: Fetch and Render ---

  function init() {
    fetch('data/content.json')
      .then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      })
      .then(function (data) {
        renderHero(data.personal);
        renderSocialLinks(data.personal && data.personal.social);
        renderServices(data.services);
        renderPortfolio(data.portfolio);
        renderResume(data.resume);
        renderTestimonials(data.testimonials);
        renderTechStack(data.techStack);
        renderPricing(data.pricing);
        renderBlog(data.blog);
        renderContact(data.contact);
        renderFooter(data.footer);

        // Re-run feather icons for any injected icon markup
        try { feather.replace(); } catch (e) {}

        console.log('[content-loader] All content rendered from content.json');
      })
      .catch(function (err) {
        console.error('[content-loader] FAILED to load content.json:', err.message);
        console.error('[content-loader] Site requires HTTP server. Run: python3 -m http.server 8000');
      });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
