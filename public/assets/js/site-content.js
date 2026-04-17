document.addEventListener('DOMContentLoaded', async () => {
	try {
		const response = await fetch('public/assets/data/content.json');
		if (!response.ok) {
			throw new Error(`Failed to load content: ${response.status}`);
		}

		const content = await response.json();
		renderPage(content);
		initializeScrollReveal();
		initializeHeaderNavigation();
	} catch (error) {
		renderLoadError(error);
		console.error('Unable to load site content.', error);
	}
});

function renderLoadError(error) {
	const introContent = document.getElementById('intro-content');
	if (!introContent) {
		return;
	}

	const isLocalFile = window.location.protocol === 'file:';
	const message = isLocalFile
		? 'This page loads site content from public/assets/data/content.json. Open it through a local web server instead of file://, for example: python3 -m http.server 8000'
		: `Unable to load site content. ${escapeHtml(error.message || 'Unknown error.')}`;

	introContent.innerHTML = `
		<div class="alert alert-warning" role="alert">
			${escapeHtml(message)}
		</div>
	`;
	setText('navbar-brand-text', 'Content unavailable');
}

function renderPage(content) {
	setText('navbar-brand-text', content.header.brand);
	renderIntroduction(content.introduction);
	renderSectionTitle('portfolio-title', content.sections.portfolio.title);
	renderPortfolio(content.sections.portfolio);
	renderSectionTitle('tech-stacks-title', content.sections.techStacks.title);
	renderTechStacks(content.sections.techStacks);
	renderSectionTitle('skills-title', content.sections.skills.title);
	renderSkills(content.sections.skills);
	renderSectionTitle('experience-title', content.sections.experience.title);
	renderExperience(content.sections.experience);
	renderSectionTitle('blogs-title', content.sections.blogs.title);
	renderBlogs(content.sections.blogs);
	renderSectionTitle('contact-title', content.sections.contact.title);
	renderContact(content.sections.contact);
}

function setText(id, value) {
	const element = document.getElementById(id);
	if (element) {
		element.textContent = value || '';
	}
}

function renderSectionTitle(id, title) {
	setText(id, title);
}

function renderIntroduction(data) {
	const profile = document.getElementById('intro-profile');
	const content = document.getElementById('intro-content');

	if (profile) {
		profile.innerHTML = `
			<div class="image-container"></div>
			<h3>${escapeHtml(data.profileTag)}</h3>
			<h4>${escapeHtml(data.role)}</h4>
			<ul>
				${data.socialLinks.map((link) => `
					<li>
						<a href="${escapeAttribute(link.href)}"${externalLinkAttributes(link.href)}>
							<div class="icon ${escapeAttribute(link.icon)}"></div>
						</a>
					</li>
				`).join('')}
			</ul>
		`;
	}

	if (content) {
		content.innerHTML = `
			<h1>${data.headingLines.map((line) => escapeHtml(line)).join(' <br>')}</h1>
			<p>${escapeHtml(data.summary)}</p>
		`;
	}
}

function renderPortfolio(data) {
	const container = document.getElementById('portfolio-content');
	if (!container) {
		return;
	}

	const portfolioItems = normalizePortfolioItems(data.images || []);
	const visibleImages = portfolioItems.slice(0, 6);
	const hiddenImages = portfolioItems.slice(6);

	container.innerHTML = `
		<h3>${escapeHtml(data.heading)}</h3>
		<h6>${escapeHtml(data.subheading)}</h6>
		<p><em>${escapeHtml(data.note)}</em></p>
		<div class="row">
			${visibleImages.map((item, index) => renderPortfolioImageCard(item, index + 1)).join('')}
		</div>
		${hiddenImages.length ? `
			<div class="row portfolio-more expandable-panel" id="portfolio-more" hidden>
				${hiddenImages.map((item, index) => renderPortfolioImageCard(item, visibleImages.length + index + 1)).join('')}
			</div>
			<div class="portfolio-actions">
				<button class="btn btn-outline-primary" type="button" id="portfolio-toggle" aria-expanded="false">Show all</button>
			</div>
		` : ''}
	`;

	const toggleButton = document.getElementById('portfolio-toggle');
	const moreContainer = document.getElementById('portfolio-more');
	if (toggleButton && moreContainer) {
		toggleButton.addEventListener('click', () => {
			const isHidden = moreContainer.hasAttribute('hidden');
			if (isHidden) {
				toggleExpandablePanel(moreContainer, true);
				toggleButton.textContent = 'Show less';
				toggleButton.setAttribute('aria-expanded', 'true');
				return;
			}

			toggleExpandablePanel(moreContainer, false);
			toggleButton.textContent = 'Show all';
			toggleButton.setAttribute('aria-expanded', 'false');
		});
	}

	initializePortfolioLightbox(container);
}

function normalizePortfolioItems(items) {
	return items.map((item, index) => {
		if (typeof item === 'string') {
			return {
				src: item,
				title: `Project ${String(index + 1).padStart(2, '0')}`
			};
		}

		return {
			src: item.src || '',
			title: item.title || `Project ${String(index + 1).padStart(2, '0')}`
		};
	});
}

function renderPortfolioImageCard(item, index) {
	const title = item.title || `Project ${String(index).padStart(2, '0')}`;
	const alt = `${title}`;
	return `
		<div class="col-4">
			<div class="image">
				<button class="portfolio-image-button" type="button" data-image-src="${escapeAttribute(item.src)}" data-image-alt="${escapeAttribute(alt)}" aria-label="Open ${escapeAttribute(alt)} in full view">
					<img src="${escapeAttribute(item.src)}" class="img-thumbnail" alt="${escapeAttribute(alt)}">
				</button>
			</div>
		</div>
	`;
}

function initializePortfolioLightbox(container) {
	if (container.dataset.lightboxBound === 'true') {
		return;
	}

	const modalElement = ensurePortfolioModal();
	const modalImage = document.getElementById('portfolio-modal-image');
	const modalCaption = document.getElementById('portfolio-modal-caption');
	const closeButton = document.getElementById('portfolio-modal-close');
	const previousButton = document.getElementById('portfolio-modal-prev');
	const nextButton = document.getElementById('portfolio-modal-next');
	if (!modalElement || !modalImage || !modalCaption) {
		return;
	}

	container.dataset.lightboxBound = 'true';
	container.addEventListener('click', (event) => {
		const trigger = event.target.closest('.portfolio-image-button');
		if (!trigger) {
			return;
		}

		const imageButtons = Array.from(container.querySelectorAll('.portfolio-image-button'));
		const currentIndex = imageButtons.indexOf(trigger);
		showPortfolioModalImage(modalElement, imageButtons, currentIndex, modalImage, modalCaption);
		openPortfolioModal(modalElement);
	});

	if (closeButton) {
		closeButton.addEventListener('click', () => {
			closePortfolioModal(modalElement, modalImage, modalCaption);
		});
	}

	if (previousButton) {
		previousButton.addEventListener('click', () => {
			navigatePortfolioModal(modalElement, -1, modalImage, modalCaption);
		});
	}

	if (nextButton) {
		nextButton.addEventListener('click', () => {
			navigatePortfolioModal(modalElement, 1, modalImage, modalCaption);
		});
	}

	modalElement.addEventListener('click', (event) => {
		if (event.target === modalElement || event.target.hasAttribute('data-portfolio-close')) {
			closePortfolioModal(modalElement, modalImage, modalCaption);
		}
	});

	document.addEventListener('keydown', (event) => {
		if (!modalElement.classList.contains('is-visible')) {
			return;
		}

		if (event.key === 'Escape') {
			closePortfolioModal(modalElement, modalImage, modalCaption);
			return;
		}

		if (event.key === 'ArrowLeft') {
			navigatePortfolioModal(modalElement, -1, modalImage, modalCaption);
			return;
		}

		if (event.key === 'ArrowRight') {
			navigatePortfolioModal(modalElement, 1, modalImage, modalCaption);
		}
	});
}

function ensurePortfolioModal() {
	let modalElement = document.getElementById('portfolio-modal');
	if (modalElement) {
		return modalElement;
	}

	modalElement = document.createElement('div');
	modalElement.id = 'portfolio-modal';
	modalElement.className = 'portfolio-modal';
	modalElement.tabIndex = -1;
	modalElement.setAttribute('role', 'dialog');
	modalElement.setAttribute('aria-modal', 'true');
	modalElement.setAttribute('aria-labelledby', 'portfolio-modal-caption');
	modalElement.setAttribute('aria-hidden', 'true');
	modalElement.setAttribute('hidden', '');
	modalElement.innerHTML = `
		<div class="portfolio-modal-dialog">
			<div class="portfolio-modal-content">
				<div class="portfolio-modal-header">
					<h2 class="portfolio-modal-title" id="portfolio-modal-caption">Portfolio image</h2>
					<button type="button" class="portfolio-modal-close" id="portfolio-modal-close" data-portfolio-close aria-label="Close full view">&times;</button>
				</div>
				<div class="portfolio-modal-body">
					<button type="button" class="portfolio-modal-nav portfolio-modal-prev" id="portfolio-modal-prev" aria-label="Previous image">&lsaquo;</button>
					<img id="portfolio-modal-image" src="" alt="Portfolio image">
					<button type="button" class="portfolio-modal-nav portfolio-modal-next" id="portfolio-modal-next" aria-label="Next image">&rsaquo;</button>
				</div>
			</div>
		</div>
	`;

	document.body.appendChild(modalElement);
	return modalElement;
}

function openPortfolioModal(modalElement) {
	modalElement.hidden = false;
	modalElement.classList.add('is-visible');
	modalElement.setAttribute('aria-hidden', 'false');
	document.body.classList.add('portfolio-modal-open');
	modalElement.focus();
}

function closePortfolioModal(modalElement, modalImage, modalCaption) {
	modalElement.classList.remove('is-visible');
	modalElement.setAttribute('aria-hidden', 'true');
	modalElement.hidden = true;
	document.body.classList.remove('portfolio-modal-open');
	delete modalElement.dataset.currentIndex;
	delete modalElement.dataset.totalImages;
	modalImage.src = '';
	modalImage.alt = 'Portfolio image';
	modalCaption.textContent = 'Portfolio image';
}

function showPortfolioModalImage(modalElement, imageButtons, index, modalImage, modalCaption) {
	if (!imageButtons.length) {
		return;
	}

	const normalizedIndex = ((index % imageButtons.length) + imageButtons.length) % imageButtons.length;
	const trigger = imageButtons[normalizedIndex];
	modalElement.dataset.currentIndex = String(normalizedIndex);
	modalElement.dataset.totalImages = String(imageButtons.length);
	modalImage.src = trigger.dataset.imageSrc || '';
	modalImage.alt = trigger.dataset.imageAlt || 'Portfolio image';
	modalCaption.textContent = trigger.dataset.imageAlt || 'Portfolio image';
	updatePortfolioModalNavigation(modalElement, imageButtons.length);
}

function navigatePortfolioModal(modalElement, direction, modalImage, modalCaption) {
	const container = document.getElementById('portfolio-content');
	if (!container) {
		return;
	}

	const imageButtons = Array.from(container.querySelectorAll('.portfolio-image-button'));
	if (!imageButtons.length) {
		return;
	}

	const currentIndex = Number(modalElement.dataset.currentIndex || '0');
	showPortfolioModalImage(modalElement, imageButtons, currentIndex + direction, modalImage, modalCaption);
}

function updatePortfolioModalNavigation(modalElement, totalImages) {
	const previousButton = document.getElementById('portfolio-modal-prev');
	const nextButton = document.getElementById('portfolio-modal-next');
	const shouldShowNavigation = totalImages > 1;

	if (previousButton) {
		previousButton.hidden = !shouldShowNavigation;
	}

	if (nextButton) {
		nextButton.hidden = !shouldShowNavigation;
	}
}

function renderSimpleSection(id, data) {
	const container = document.getElementById(id);
	if (!container) {
		return;
	}

	container.innerHTML = `
		<h3>${escapeHtml(data.heading || '')}</h3>
		<h6>${escapeHtml(data.subheading || '')}</h6>
	`;
}

function renderTechStacks(data) {
	const container = document.getElementById('tech-stacks-content');
	if (!container) {
		return;
	}

	container.innerHTML = `
		<div class="tech-stack-shell">
			<div class="tech-stack-intro">
				<h3>${escapeHtml(data.heading)}</h3>
				<h6>${escapeHtml(data.subheading)}</h6>
				<p>${escapeHtml(data.description)}</p>
				<div class="tech-stack-focuses">
					${data.focusAreas.map((item) => `<span class="tech-stack-pill">${escapeHtml(item)}</span>`).join('')}
				</div>
			</div>
			<div class="tech-stack-grid">
				${data.stackGroups.map((group) => `
					<article class="tech-stack-card">
						<span class="tech-stack-eyebrow">${escapeHtml(group.eyebrow)}</span>
						<h4>${escapeHtml(group.title)}</h4>
						<p>${escapeHtml(group.description)}</p>
						<div class="tech-stack-tools">
							${group.tools.map((tool) => `<span class="tech-tool-chip">${escapeHtml(tool)}</span>`).join('')}
						</div>
					</article>
				`).join('')}
			</div>
			<div class="tech-stack-delivery">
				<h4>${escapeHtml(data.deliveryTitle)}</h4>
				<ul>
					${data.deliveryPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}
				</ul>
			</div>
		</div>
	`;
}

function renderSkills(data) {
	const container = document.getElementById('skills-content');
	if (!container) {
		return;
	}

	const visibleTechnicalSkills = data.technicalSkills.slice(0, 3);
	const hiddenTechnicalSkills = data.technicalSkills.slice(3);

	const softSkillRows = `
	<div class="row">
		${data.softSkills.map((skill) => `
		<div class="col-4">
			<div class="card">
			<div class="icon ${escapeAttribute(skill.icon)}"></div>
			<strong>${escapeHtml(skill.title)}</strong>
			<p>${escapeHtml(skill.description)}</p>
			</div>
		</div>
		`).join('')}
	</div>
	`;

	container.innerHTML = `
		<h3>${escapeHtml(data.heading)}</h3>
		<h6>${escapeHtml(data.subheading)}</h6>
		<div class="soft-skills">
			<h4><img src="${escapeAttribute(data.softSkillsIcon)}" width="70" alt="${escapeAttribute(data.softSkillsTitle)}"> ${escapeHtml(data.softSkillsTitle)}</h4>
			${softSkillRows}
		</div>
		<div class="technical-skills">
			<h4><img src="${escapeAttribute(data.technicalSkillsIcon)}" width="70" alt="${escapeAttribute(data.technicalSkillsTitle)}"> ${escapeHtml(data.technicalSkillsTitle)}</h4>
			${visibleTechnicalSkills.map((skill) => `
				<div class="card">
					<strong>${escapeHtml(skill.title)}</strong>
					<ul>${renderListItems(skill.items)}</ul>
				</div>
			`).join('')}
			${hiddenTechnicalSkills.length ? `
				<div class="technical-skills-more expandable-panel" id="technical-skills-more" hidden>
					${hiddenTechnicalSkills.map((skill) => `
						<div class="card">
							<strong>${escapeHtml(skill.title)}</strong>
							<ul>${renderListItems(skill.items)}</ul>
						</div>
					`).join('')}
				</div>
				<div class="technical-skills-actions">
					<button class="btn btn-outline-primary" type="button" id="technical-skills-toggle" aria-expanded="false">Show all</button>
				</div>
			` : ''}
		</div>
	`;

	const toggleButton = document.getElementById('technical-skills-toggle');
	const moreContainer = document.getElementById('technical-skills-more');
	if (toggleButton && moreContainer) {
		toggleButton.addEventListener('click', () => {
			const isHidden = moreContainer.hasAttribute('hidden');
			if (isHidden) {
				toggleExpandablePanel(moreContainer, true);
				toggleButton.textContent = 'Show less';
				toggleButton.setAttribute('aria-expanded', 'true');
				return;
			}

			toggleExpandablePanel(moreContainer, false);
			toggleButton.textContent = 'Show all';
			toggleButton.setAttribute('aria-expanded', 'false');
		});
	}
}

function toggleExpandablePanel(panel, shouldExpand) {
	if (!panel || panel.dataset.animating === 'true') {
		return;
	}

	panel.dataset.animating = 'true';
	panel.style.overflow = 'hidden';

	if (shouldExpand) {
		panel.hidden = false;
		panel.classList.add('is-expanded');
		panel.style.height = '0px';
		panel.style.opacity = '0';

		requestAnimationFrame(() => {
			const targetHeight = panel.scrollHeight;
			panel.style.height = `${targetHeight}px`;
			panel.style.opacity = '1';
		});

		const handleExpandEnd = (event) => {
			if (event.propertyName !== 'height') {
				return;
			}

			panel.style.height = 'auto';
			panel.style.overflow = '';
			panel.dataset.animating = 'false';
			panel.removeEventListener('transitionend', handleExpandEnd);
		};

		panel.addEventListener('transitionend', handleExpandEnd);
		return;
	}

	panel.style.height = `${panel.scrollHeight}px`;
	panel.style.opacity = '1';

	requestAnimationFrame(() => {
		panel.style.height = '0px';
		panel.style.opacity = '0';
	});

	const handleCollapseEnd = (event) => {
		if (event.propertyName !== 'height') {
			return;
		}

		panel.hidden = true;
		panel.classList.remove('is-expanded');
		panel.style.height = '';
		panel.style.opacity = '';
		panel.style.overflow = '';
		panel.dataset.animating = 'false';
		panel.removeEventListener('transitionend', handleCollapseEnd);
	};

	panel.addEventListener('transitionend', handleCollapseEnd);
}

function renderExperience(data) {
	const container = document.getElementById('experience-content');
	if (!container) {
		return;
	}

	container.innerHTML = `
		<h3>${escapeHtml(data.heading)}</h3>
		<h6>${escapeHtml(data.subheading)}</h6>
		<div class="accordion" id="accordionExample">
			${data.items.map((item, index) => {
				const collapseId = `experience-collapse-${index + 1}`;
				const headingId = `experience-heading-${index + 1}`;
				return `
					<div class="accordion-item">
						<h2 class="accordion-header" id="${headingId}">
							<button class="accordion-button${item.expanded ? '' : ' collapsed'}" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${item.expanded ? 'true' : 'false'}" aria-controls="${collapseId}">
								${escapeHtml(item.role)}
							</button>
						</h2>
						<div id="${collapseId}" class="accordion-collapse collapse${item.expanded ? ' show' : ''}" data-bs-parent="#accordionExample">
							<div class="accordion-body">
								<h4>${escapeHtml(item.companyPeriod)}</h4>
								<ul>
									${item.responsibilities.map((responsibility) => `<li>${escapeHtml(responsibility)}</li>`).join('')}
								</ul>
							</div>
						</div>
					</div>
				`;
			}).join('')}
		</div>
	`;
}

function renderBlogs(data) {
	const container = document.getElementById('blogs-content');
	if (!container) {
		return;
	}

	const posts = (data.posts || []).slice(0, 3);

	container.innerHTML = `
		<div class="blog-shell">
			<div class="blog-intro">
				<h3>${escapeHtml(data.heading || '')}</h3>
				<h6>${escapeHtml(data.subheading || '')}</h6>
				<p>${escapeHtml(data.description || '')}</p>
				<a class="btn btn-outline-primary" href="${escapeAttribute(data.profileUrl || '#')}"${externalLinkAttributes(data.profileUrl)}>${escapeHtml(data.ctaLabel || 'Visit profile')}</a>
			</div>
			<div class="blog-grid">
				${posts.map((post, index) => `
					<article class="blog-card${index === 0 ? ' blog-card-featured' : ''}">
						<div class="blog-meta">${escapeHtml(post.date || '')}</div>
						<h4>${escapeHtml(post.title)}</h4>
						<p>${escapeHtml(post.excerpt || '')}</p>
						<div class="blog-tags">
							${(post.tags || []).map((tag) => `<span class="blog-tag">${escapeHtml(tag)}</span>`).join('')}
						</div>
						<a class="blog-link" href="${escapeAttribute(post.url || '#')}"${externalLinkAttributes(post.url)}>Read article</a>
					</article>
				`).join('')}
			</div>
			<div class="blog-actions">
				<a class="btn btn-primary" href="${escapeAttribute(data.profileUrl || '#')}"${externalLinkAttributes(data.profileUrl)}>${escapeHtml(data.showAllLabel || 'Show all blogs')}</a>
			</div>
		</div>
	`;
}

function renderContact(data) {
	const container = document.getElementById('contact-content');
	if (!container) {
		return;
	}

	container.innerHTML = `
		<div class="contact-shell">
			<div class="contact-intro">
				<span class="contact-kicker">${escapeHtml(data.kicker)}</span>
				<h3>${escapeHtml(data.heading)}</h3>
				<p>${escapeHtml(data.description)}</p>
				<div class="contact-actions">
					${data.actions.map((action) => `
						<a class="btn btn-${action.variant === 'primary' ? 'primary' : 'outline-primary'}" href="${escapeAttribute(action.href)}"${externalLinkAttributes(action.href)}>${escapeHtml(action.label)}</a>
					`).join('')}
				</div>
			</div>
			<div class="contact-grid">
				${data.cards.map((card) => renderContactCard(card)).join('')}
			</div>
		</div>
	`;
}

function renderContactCard(card) {
	const cardClasses = ['contact-card'];
	if (card.variant === 'highlight') {
		cardClasses.push('contact-card-highlight');
	}
	if (card.variant === 'note') {
		cardClasses.push('contact-note');
	}

	if (card.variant === 'note') {
		return `
			<div class="${cardClasses.join(' ')}">
				<span class="contact-label">${escapeHtml(card.label)}</span>
				<ul>
					${card.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
				</ul>
			</div>
		`;
	}

	return `
		<div class="${cardClasses.join(' ')}">
			<span class="contact-label">${escapeHtml(card.label)}</span>
			<h4>${escapeHtml(card.title)}</h4>
			<p>${escapeHtml(card.description)}</p>
			${card.href ? `<a href="${escapeAttribute(card.href)}"${externalLinkAttributes(card.href)}>${escapeHtml(card.linkLabel)}</a>` : ''}
		</div>
	`;
}

function initializeHeaderNavigation() {
	const navLinks = Array.from(document.querySelectorAll('.site-nav-list .nav-link[href^="#"]'));
	if (!navLinks.length) {
		return;
	}

	const navigation = document.getElementById('site-navigation');
	const toggler = document.querySelector('.navbar-toggler');
	const sections = navLinks
		.map((link) => {
			const targetId = link.getAttribute('href');
			if (!targetId) {
				return null;
			}

			const section = document.querySelector(targetId);
			if (!section) {
				return null;
			}

			return { link, section };
		})
		.filter(Boolean);

	if (!sections.length) {
		return;
	}

	const setActiveLink = (activeId) => {
		sections.forEach(({ link, section }) => {
			const isActive = `#${section.id}` === activeId;
			link.classList.toggle('active', isActive);
			if (isActive) {
				link.setAttribute('aria-current', 'page');
				return;
			}

			link.removeAttribute('aria-current');
		});
	};

	const updateActiveLink = () => {
		const headerOffset = (document.querySelector('header')?.offsetHeight || 77) + 24;
		const scrollPosition = window.scrollY + headerOffset;
		let activeSectionId = `#${sections[0].section.id}`;

		sections.forEach(({ section }) => {
			if (scrollPosition >= section.offsetTop) {
				activeSectionId = `#${section.id}`;
			}
		});

		setActiveLink(activeSectionId);
	};

	const collapseNavigation = () => {
		if (!navigation || !navigation.classList.contains('show')) {
			return;
		}

		navigation.classList.remove('show');
		if (toggler) {
			toggler.setAttribute('aria-expanded', 'false');
			const expandedLabel = toggler.querySelector('.navbar-toggler-label');
			if (expandedLabel) {
				expandedLabel.textContent = 'Menu';
			}
		}
	};

	navLinks.forEach((link) => {
		link.addEventListener('click', () => {
			setActiveLink(link.getAttribute('href'));
			collapseNavigation();
		});
	});

	if (toggler) {
		toggler.addEventListener('click', () => {
			const isExpanded = toggler.getAttribute('aria-expanded') === 'true';
			const nextExpandedState = String(!isExpanded);
			toggler.setAttribute('aria-expanded', nextExpandedState);
			const expandedLabel = toggler.querySelector('.navbar-toggler-label');
			if (expandedLabel) {
				expandedLabel.textContent = isExpanded ? 'Menu' : 'Close';
			}
		});
	}

	window.addEventListener('scroll', updateActiveLink, { passive: true });
	window.addEventListener('resize', updateActiveLink);
	window.addEventListener('hashchange', updateActiveLink);
	updateActiveLink();
}

function initializeScrollReveal() {
	const revealGroups = [
		'#intro-profile',
		'#intro-content > *',
		'section .title-box',
		'#portfolio-content > h3, #portfolio-content > h6, #portfolio-content > p, #portfolio-content .col-4, #portfolio-content .portfolio-actions',
		'#tech-stacks-content > *',
		'.tech-stack-card, .tech-stack-delivery',
		'#skills-content > h3, #skills-content > h6, #skills-content h4, .soft-skills .card, .technical-skills .card, .technical-skills-actions',
		'#experience-content > h3, #experience-content > h6, .accordion-item',
		'#blogs-content > *',
		'.blog-card',
		'#contact-content > *',
		'.contact-card'
	];

	revealGroups.forEach((selector) => {
		const elements = Array.from(document.querySelectorAll(selector));
		elements.forEach((element, index) => {
			element.classList.add('scroll-reveal');
			element.style.setProperty('--reveal-delay', `${Math.min(index * 70, 420)}ms`);
		});
	});

	const revealElements = Array.from(document.querySelectorAll('.scroll-reveal'));
	if (!revealElements.length) {
		return;
	}

	if (!('IntersectionObserver' in window)) {
		revealElements.forEach((element) => {
			element.classList.add('is-visible');
		});
		return;
	}

	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) {
				return;
			}

			entry.target.classList.add('is-visible');
			observer.unobserve(entry.target);
		});
	}, {
		threshold: 0.16,
		rootMargin: '0px 0px -10% 0px'
	});

	revealElements.forEach((element) => {
		observer.observe(element);
	});
}

function renderListItems(items) {
	return items.map((item) => {
		if (typeof item === 'string') {
			return `<li>${escapeHtml(item)}</li>`;
		}

		const itemText = item.label
			? `<strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.text || '')}`
			: escapeHtml(item.text || '');
		const subitems = Array.isArray(item.subitems) && item.subitems.length
			? `<ul>${renderListItems(item.subitems)}</ul>`
			: '';

		return `<li>${itemText}${subitems}</li>`;
	}).join('');
}

function chunk(items, size) {
	const groups = [];
	for (let index = 0; index < items.length; index += size) {
		groups.push(items.slice(index, index + size));
	}
	return groups;
}

function escapeHtml(value) {
	return String(value ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
	return escapeHtml(value);
}

function externalLinkAttributes(href) {
	return href && href !== '#'
		? ' target="_blank" rel="noopener noreferrer"'
		: '';
}