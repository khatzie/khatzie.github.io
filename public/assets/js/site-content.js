document.addEventListener('DOMContentLoaded', async () => {
	try {
		const response = await fetch('public/assets/data/content.json');
		if (!response.ok) {
			throw new Error(`Failed to load content: ${response.status}`);
		}

		const content = await response.json();
		renderPage(content);
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

	container.innerHTML = `
		<h3>${escapeHtml(data.heading)}</h3>
		<h6>${escapeHtml(data.subheading)}</h6>
		<p><em>${escapeHtml(data.note)}</em></p>
		<div class="row">
			${data.images.map((image, index) => `
				<div class="col-4">
					<div class="image">
						<img src="${escapeAttribute(image)}" class="img-thumbnail" alt="Portfolio project ${index + 1}">
					</div>
				</div>
			`).join('')}
		</div>
	`;
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

	const softSkillRows = chunk(data.softSkills, 3).map((group) => `
		<div class="row">
			${group.map((skill) => `
				<div class="col-4">
					<div class="card">
						<div class="icon ${escapeAttribute(skill.icon)}"></div>
						<strong>${escapeHtml(skill.title)}</strong>
						<p>${escapeHtml(skill.description)}</p>
					</div>
				</div>
			`).join('')}
		</div>
	`).join('');

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
				<div class="technical-skills-more" id="technical-skills-more" hidden>
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
				moreContainer.removeAttribute('hidden');
				toggleButton.textContent = 'Show less';
				toggleButton.setAttribute('aria-expanded', 'true');
				return;
			}

			moreContainer.setAttribute('hidden', '');
			toggleButton.textContent = 'Show all';
			toggleButton.setAttribute('aria-expanded', 'false');
		});
	}
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