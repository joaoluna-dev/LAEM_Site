document.addEventListener('DOMContentLoaded', function() {

    let translations = {};
    let currentLang = 'pt';
    let cachedEventData = null;
    let cachedMemberData = null;

    // Elements
    const eventContainer = document.getElementById('event-container');
    const memberGallery = document.getElementById('member-gallery');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // Load Translations
    fetch('data/translations.json')
        .then(response => {
            if (!response.ok) throw new Error('Failed to load translations');
            return response.json();
        })
        .then(data => {
            translations = data;
            initApp();
        })
        .catch(error => console.error('Error loading translations:', error));

    function initApp() {
        // Set initial language
        updateLanguage(currentLang);
        
        // Load Dynamic Content
        loadEvents();
        loadMembers();
        loadCarousel();

        // Mobile Menu
        setupMobileMenu();

        // Smooth Scroll
        setupSmoothScroll();
    }

    // --- Mobile Menu Logic ---
    function setupMobileMenu() {
        const menuBtn = document.querySelector('.mobile-menu-btn');
        const nav = document.querySelector('.main-nav');
        const navLinks = document.querySelectorAll('.main-nav a');

        if (menuBtn && nav) {
            menuBtn.addEventListener('click', () => {
                menuBtn.classList.toggle('active');
                nav.classList.toggle('active');
            });

            // Close menu when a link is clicked
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    menuBtn.classList.remove('active');
                    nav.classList.remove('active');
                });
            });
        }
    }

    // --- Carousel Logic ---
    function loadCarousel() {
        const track = document.querySelector('.carousel-track');
        const container = document.querySelector('.carousel-track-container');
        const nextButton = document.querySelector('#carousel-next');
        const prevButton = document.querySelector('#carousel-prev');
        const dotsNav = document.querySelector('.carousel-nav');

        if (!track || !container) return;

        fetch('data/presentation_images.json')
            .then(response => response.json())
            .then(images => {
                if (!images || images.length === 0) {
                    container.innerHTML = '<p style="text-align:center; padding: 20px;">Nenhuma imagem disponível.</p>';
                    return;
                }

                // Create slides
                images.forEach((image, index) => {
                    const slide = document.createElement('li');
                    slide.classList.add('carousel-slide');
                    if (index === 0) slide.classList.add('current-slide');
                    
                    const img = document.createElement('img');
                    img.src = `images/presentation/${image}`;
                    img.alt = `Imagem de apresentação ${index + 1}`;
                    img.classList.add('carousel-image');
                    
                    slide.appendChild(img);
                    track.appendChild(slide);

                    // Create dot
                    const dot = document.createElement('button');
                    dot.classList.add('carousel-indicator');
                    if (index === 0) dot.classList.add('current-slide');
                    
                    if (dotsNav) dotsNav.appendChild(dot);
                });

                const slides = Array.from(track.children);
                const dots = dotsNav ? Array.from(dotsNav.children) : [];
                let currentIndex = 0;

                // Positioning logic
                const updateSlidePosition = () => {
                    const currentSlide = slides[currentIndex];
                    const slideRect = currentSlide.getBoundingClientRect();
                    const trackRect = track.getBoundingClientRect();
                    const containerRect = container.getBoundingClientRect();
                    
                    const slideWidth = slideRect.width;
                    const containerWidth = containerRect.width;
                    
                    // Calculate slide position relative to the track's start
                    // This creates a precise float value invariant of current transform
                    const relativeSlideLeft = slideRect.left - trackRect.left;
                    
                    // Center the active slide
                    const targetTranslateX = (containerWidth / 2) - (relativeSlideLeft + slideWidth / 2);
                    
                    track.style.transform = `translateX(${targetTranslateX}px)`;

                    // Update classes for blur/scale effect
                    slides.forEach((slide, index) => {
                        if (index === currentIndex) {
                            slide.classList.add('current-slide');
                            slide.style.opacity = '1';
                            slide.style.transform = 'scale(1)';
                            slide.style.filter = 'blur(0)';
                            slide.style.zIndex = '10';
                        } else {
                            slide.classList.remove('current-slide');
                            slide.style.opacity = '0.5';
                            slide.style.transform = 'scale(0.8)';
                            slide.style.filter = 'blur(3px)';
                            slide.style.zIndex = '1';
                        }
                    });

                    // Update dots
                    if (dots.length > 0) {
                         dots.forEach(dot => dot.classList.remove('current-slide'));
                         dots[currentIndex].classList.add('current-slide');
                    }
                };

                // Initial positioning
                // Use setTimeout to allow DOM to render and calculate widths correctly
                setTimeout(updateSlidePosition, 100);
                window.addEventListener('resize', updateSlidePosition);

                // Navigation
                const moveToNextSlide = () => {
                    currentIndex++;
                    if (currentIndex >= slides.length) {
                        currentIndex = 0;
                    }
                    updateSlidePosition();
                };

                const moveToPrevSlide = () => {
                    currentIndex--;
                    if (currentIndex < 0) {
                        currentIndex = slides.length - 1;
                    }
                    updateSlidePosition();
                };

                if (nextButton) {
                    nextButton.addEventListener('click', () => {
                        moveToNextSlide();
                        stopAutoPlay();
                        startAutoPlay();
                    });
                }

                if (prevButton) {
                    prevButton.addEventListener('click', () => {
                        moveToPrevSlide();
                        stopAutoPlay();
                        startAutoPlay();
                    });
                }

                // Dots navigation helper
                // (Already handled in loop above by setting currentIndex and calling updateSlidePosition)
                // We need to link the dot click to currentIndex
                if (dotsNav) {
                    dots.forEach((dot, index) => {
                        dot.addEventListener('click', () => {
                            currentIndex = index;
                            updateSlidePosition();
                            stopAutoPlay();
                            startAutoPlay();
                        });
                    });
                }

                // Auto Play
                let autoPlayInterval;
                const startAutoPlay = () => {
                    stopAutoPlay(); // Ensure no duplicates
                    autoPlayInterval = setInterval(moveToNextSlide, 10000); // 10s
                };

                const stopAutoPlay = () => {
                    clearInterval(autoPlayInterval);
                };

                startAutoPlay();

                // Pause on hover
                container.addEventListener('mouseenter', stopAutoPlay);
                container.addEventListener('mouseleave', startAutoPlay);

            })
            .catch(error => {
                console.error('Error loading carousel images:', error);
                container.innerHTML = '<p style="text-align:center; padding: 20px;">Erro ao carregar imagens.</p>';
            });
    }

    // Expose changeLanguage to global scope
    window.changeLanguage = function(lang) {
        if (!translations[lang]) return;
        currentLang = lang;
        updateLanguage(lang);
        
        // Re-render dynamic content to update button texts
        if (cachedEventData) renderEvents(cachedEventData);
        if (cachedMemberData) {
            const activeFilterBtn = document.querySelector('.filter-btn.active');
            const activeFilter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'presidencia';
            renderMembers(activeFilter); 
        }
    };

    function updateLanguage(lang) {
        // Update static text
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang][key]) {
                let text = translations[lang][key];
                // Replace year placeholder if present
                if (text.includes('{year}')) {
                    text = text.replace('{year}', new Date().getFullYear());
                }
                element.textContent = text;
            }
        });

        // Update flag active state
        document.querySelectorAll('.flag-icon').forEach(img => {
            if (img.getAttribute('onclick').includes(`'${lang}'`)) {
                img.classList.add('active');
                img.style.opacity = '1';
                img.style.transform = 'scale(1.1)';
            } else {
                img.classList.remove('active');
                img.style.opacity = '0.6';
                img.style.transform = 'scale(1)';
            }
        });
        
        // Update HTML lang attribute
        document.documentElement.lang = lang === 'pt' ? 'pt-BR' : (lang === 'en' ? 'en-US' : 'es-ES');
    }

    function loadEvents() {
         if (!eventContainer) return;
         fetch('data/events.json')
            .then(res => res.json())
            .then(data => {
                cachedEventData = data;
                renderEvents(data);
            })
            .catch(err => {
                console.error(err);
                if (translations[currentLang]) {
                    eventContainer.innerHTML = `<p>${translations[currentLang].msg_error_events}</p>`;
                }
            });
    }

    function renderEvents(events) {
        if (!eventContainer) return;
        eventContainer.innerHTML = ''; 

        if (!events || events.length === 0) {
            if (translations[currentLang]) {
                eventContainer.innerHTML = `<p>${translations[currentLang].msg_no_events}</p>`;
            }
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'card event-card';
            if (event.status === 'closed') {
                card.classList.add('event-closed');
            }

            let buttonHtml = '';
            const btnSubscribeText = translations[currentLang] ? translations[currentLang].btn_subscribe : 'Inscreva-se';
            const btnClosedText = translations[currentLang] ? translations[currentLang].btn_closed : 'Inscrições Encerradas';

            if (event.status === 'open' && event.link) {
                buttonHtml = `<a href="${event.link}" target="_blank" class="btn btn-carmin">${btnSubscribeText}</a>`;
            } else {
                buttonHtml = `<button class="btn btn-disabled" disabled>${btnClosedText}</button>`;
            }
            
            card.innerHTML = `
                <h4>${event.title}</h4>
                <p>${event.description}</p>
                ${buttonHtml}
            `;
            eventContainer.appendChild(card);
        });
    }

    function loadMembers() {
        if (!memberGallery) return;
        fetch('data/members.json')
            .then(res => res.json())
            .then(data => {
                cachedMemberData = data;
                if (filterButtons.length > 0) {
                    // Check if there is already an active button (from HTML or previous state)
                    let activeBtn = document.querySelector('.filter-btn.active');
                    if (!activeBtn) {
                        activeBtn = filterButtons[0];
                        activeBtn.classList.add('active');
                    }
                    renderMembers(activeBtn.getAttribute('data-filter'));
                }
            })
            .catch(err => {
                console.error(err);
                if (translations[currentLang]) {
                    memberGallery.innerHTML = `<p>${translations[currentLang].msg_error_members}</p>`;
                }
            });

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const filter = button.getAttribute('data-filter');
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                renderMembers(filter);
            });
        });
    }

    function renderMembers(filter) {
        if (!memberGallery || !cachedMemberData || !cachedMemberData[filter]) {
            if (translations[currentLang]) {
                memberGallery.innerHTML = `<p>${translations[currentLang].msg_no_members}</p>`;
            }
            return;
        }

        memberGallery.innerHTML = '';
        
        const btnLattesText = translations[currentLang] ? translations[currentLang].btn_lattes : 'Currículo Lattes';

        cachedMemberData[filter].forEach(member => {
            const card = document.createElement('div');
            card.className = 'card member-card';
            
            card.innerHTML = `
                <h4>${member.nome}</h4>
                <a href="${member.lattes}" target="_blank" class="btn btn-carmin">${btnLattesText}</a>
            `;
            
            memberGallery.appendChild(card);
        });
    }

    function setupSmoothScroll() {
        const navLinks = document.querySelectorAll('.main-nav a[href^="#"]');
        navLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                let targetId = this.getAttribute('href');
                if (targetId === '#inicio') {
                     window.scrollTo({ top: 0, behavior: 'smooth' });
                    return;
                }
                let targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }

});
