// Smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
        let whatsappNumber = '237677123456';
        
        // Fetch dynamic config from backend
        fetch('/api/config')
            .then(res => res.json())
            .then(data => {
                if (data.whatsappNumber) {
                    whatsappNumber = data.whatsappNumber;
                    // Dynamically update any floating WhatsApp links
                    const floatLinks = document.querySelectorAll('.whatsapp-float');
                    floatLinks.forEach(link => {
                        const text = "Hello ObesityCare Cameroon, I have some questions about your weight management options.";
                        link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
                    });
                }
            })
            .catch(err => console.warn('Could not load dynamic configuration:', err));

        // Intake form: show schedule fields only if 'schedule' is selected
        // Schedule fields logic: hide unless 'schedule' is selected
        const scheduleFields = document.querySelector('[data-schedule-fields]');
        const callPrefRadios = document.querySelectorAll('input[name="callPreference"]');
        function updateScheduleFields() {
            const selected = Array.from(callPrefRadios).find(r => r.checked);
            if (selected && selected.value === 'schedule') {
                scheduleFields.hidden = false;
            } else {
                scheduleFields.hidden = true;
            }
        }
        if (scheduleFields && callPrefRadios.length) {
            callPrefRadios.forEach(radio => {
                radio.addEventListener('change', updateScheduleFields);
            });
            updateScheduleFields();
        }

        // Also update schedule fields visibility on step navigation
        const nextStepBtns = document.querySelectorAll('[data-next-step]');
        const prevStepBtns = document.querySelectorAll('[data-prev-step]');
        nextStepBtns.forEach(btn => btn.addEventListener('click', updateScheduleFields));
        prevStepBtns.forEach(btn => btn.addEventListener('click', updateScheduleFields));
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar scroll effect
    let lastScroll = 0;
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        } else {
            navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.05)';
        }
        
        lastScroll = currentScroll;
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe sections for scroll animations
    document.querySelectorAll('section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });

    // Roadmap: animate track + step cards when visible
    const roadmap = document.querySelector('.roadmap');
    if (roadmap) {
        const roadmapObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        roadmap.classList.add('is-visible');
                    }
                });
            },
            { threshold: 0.25 }
        );
        roadmapObserver.observe(roadmap);
    }

    // Products page: variation selection + intake modal
    const catalog = document.querySelector('.catalog');
    if (catalog) {
        const productCards = Array.from(document.querySelectorAll('.product-card'));

        // Animate product cards in
        const cardObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) entry.target.classList.add('is-visible');
                });
            },
            { threshold: 0.15 }
        );
        productCards.forEach((c) => cardObserver.observe(c));

        function syncProductSummary(card) {
            const selected = card.querySelector('input[type="radio"]:checked');
            if (!selected) return;
            const vCard = selected.closest('.variation-option')?.querySelector('.variation-card');
            const name = vCard?.querySelector('.variation-name')?.textContent?.trim() ?? '—';
            const price = vCard?.querySelector('.variation-price')?.dataset?.price
                ?? vCard?.querySelector('.variation-price')?.textContent?.trim()
                ?? '—';

            const outVar = card.querySelector('[data-selected-variation]');
            const outPrice = card.querySelector('[data-selected-price]');
            if (outVar) outVar.textContent = name;
            if (outPrice) outPrice.textContent = price;
        }

        productCards.forEach((card) => {
            syncProductSummary(card);
            card.addEventListener('change', (e) => {
                if (e.target && e.target.matches('input[type="radio"]')) {
                    syncProductSummary(card);
                }
            });
        });

        // === INTAKE FORM VALIDATION & SUBMISSION START ===
        // Intake modal logic
        const modal = document.getElementById('intakeModal');
        const closeEls = document.querySelectorAll('[data-close-modal]');
        const openButtons = document.querySelectorAll('[data-open-intake]');
        const form = document.getElementById('intakeForm');
        const panels = modal ? Array.from(modal.querySelectorAll('.intake-panel')) : [];
        const successPanel = modal ? modal.querySelector('.intake-success') : null;
        const indicators = modal ? Array.from(modal.querySelectorAll('[data-step-indicator]')) : [];

        const stateCities = {
            'AD': ['Ngaoundéré', 'Banyo', 'Tibati', 'Meiganga'],
            'EN': ['Maroua', 'Kousséri', 'Mokolo', 'Yagoua'],
            'ES': ['Bertoua', 'Batouri', 'Abong-Mbang', 'Yokadouma'],
            'CE': ['Yaoundé', 'Mbalmayo', 'Obala', 'Bafia', 'Eseka'],
            'LT': ['Douala', 'Edéa', 'Nkongsamba', 'Mbanga'],
            'NO': ['Garoua', 'Guider', 'Rey Bouba'],
            'NW': ['Bamenda', 'Wum', 'Kumbo', 'Fundong'],
            'OU': ['Bafoussam', 'Dschang', 'Foumban', 'Mbouda', 'Bafang', 'Bangangté'],
            'SU': ['Ebolowa', 'Kribi', 'Sangmélima', 'Ambam'],
            'SW': ['Buea', 'Limbe', 'Kumba', 'Mamfe', 'Tiko']
        };

        // Handle state/city dropdown population
        const stateSelect = form ? form.querySelector('#state') : null;
        const citySelect = form ? form.querySelector('#city') : null;
        
        if (stateSelect && citySelect) {
            // Auto-detect user's location and set state/city
            fetch('https://ipapi.co/json/')
                .then(resp => resp.json())
                .then(data => {
                    if (data.region_code && stateCities[data.region_code]) {
                        stateSelect.value = data.region_code;
                        // Populate cities for this state
                        citySelect.innerHTML = '<option value="">Select a city</option>';
                        citySelect.disabled = false;
                        stateCities[data.region_code].forEach(city => {
                            const option = document.createElement('option');
                            option.value = city;
                            option.textContent = city;
                            citySelect.appendChild(option);
                        });
                        // Try to set city if available
                        if (data.city && stateCities[data.region_code].includes(data.city)) {
                            citySelect.value = data.city;
                        }
                    }
                })
                .catch(err => console.log('Location detection skipped'));
            
            // Handle manual state selection
            stateSelect.addEventListener('change', function() {
                const selectedState = this.value;
                citySelect.innerHTML = '<option value="">Select a city</option>';
                
                if (selectedState && stateCities[selectedState]) {
                    citySelect.disabled = false;
                    stateCities[selectedState].forEach(city => {
                        const option = document.createElement('option');
                        option.value = city;
                        option.textContent = city;
                        citySelect.appendChild(option);
                    });
                } else {
                    citySelect.disabled = true;
                    citySelect.value = '';
                }
            });
        }

        function setStep(step) {
            currentStep = step;
            panels.forEach((p) => {
                const s = Number(p.dataset.step);
                p.hidden = s !== step;
            });
            indicators.forEach((el) => {
                const s = Number(el.dataset.stepIndicator);
                el.classList.toggle('is-active', s === step);
            });
            // Hide schedule fields if not on step 2 or not 'schedule'
            if (scheduleFields) {
                const selected = Array.from(callPrefRadios).find(r => r.checked);
                scheduleFields.hidden = !(step === 2 && selected && selected.value === 'schedule');
            }
        }

        function openModal(ctx) {
            if (!modal) return;
            selectedContext = ctx;
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';

            if (successPanel) successPanel.hidden = true;
            if (form) {
                form.hidden = false;
                form.reset();
            }

            setStep(1);
            // Fill selected summary
            modal.querySelector('[data-intake-med]').textContent = ctx.med;
            modal.querySelector('[data-intake-var]').textContent = ctx.variation;
            modal.querySelector('[data-intake-price]').textContent = ctx.price;
            // Restore submit button state
            const submitBtn = modal?.querySelector('[data-next-step]:last-of-type');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit request';
            }
        }

        function closeModal() {
            if (!modal) return;
            modal.setAttribute('aria-hidden', 'true');
            document.body.style.overflow = '';
        }

        closeEls.forEach((el) => el.addEventListener('click', closeModal));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal?.getAttribute('aria-hidden') === 'false') closeModal();
        });
        // === INTAKE FORM VALIDATION & SUBMISSION END ===

        openButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const card = btn.closest('.product-card');
                if (!card) return;
                const med = card.querySelector('.product-title')?.textContent?.trim() ?? '—';
                const variation = card.querySelector('[data-selected-variation]')?.textContent?.trim() ?? '—';
                const price = card.querySelector('[data-selected-price]')?.textContent?.trim() ?? '—';
                openModal({ med, variation, price });
            });
        });

        // Step navigation
        modal?.querySelectorAll('[data-next-step]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (!form) return;
                if (currentStep === 1) {
                    if (!form.reportValidity()) return;
                }
                if (currentStep < 3) setStep(currentStep + 1);
                if (currentStep === 3) {
                    // Populate review
                    modal.querySelector('[data-review-name]').textContent = form.fullName.value || '—';
                    modal.querySelector('[data-review-email]').textContent = form.email.value || '—';
                    modal.querySelector('[data-review-phone]').textContent = form.phone.value || '—';
                    modal.querySelector('[data-review-address]').textContent =
                        `${form.address.value || '—'}${form.city.value ? `, ${form.city.value}` : ''}${form.state.value ? `, ${form.state.value}` : ''}`;
                    modal.querySelector('[data-review-med]').textContent = selectedContext.med;
                    modal.querySelector('[data-review-var]').textContent = selectedContext.variation;
                    modal.querySelector('[data-review-price]').textContent = selectedContext.price;

                    const pref = form.callPreference.value;
                    modal.querySelector('[data-review-pref]').textContent =
                        pref === 'schedule' ? 'Scheduled Phone / WhatsApp call' : 'Wait for physician call / WhatsApp message';
                    const scheduleLine =
                        pref === 'schedule' && (form.callDate.value || form.callTime.value)
                            ? `${form.callDate.value || ''} ${form.callTime.value || ''}`.trim()
                            : '—';
                    modal.querySelector('[data-review-schedule]').textContent = scheduleLine;
                }
            });
        });

        modal?.querySelectorAll('[data-prev-step]').forEach((btn) => {
            btn.addEventListener('click', () => {
                if (currentStep > 1) setStep(currentStep - 1);
            });
        });

        // (Removed duplicate schedule fields toggle. Main logic above controls visibility.)

        // Submit
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!form.reportValidity()) return;

            // Show loading state
            const submitBtn = modal?.querySelector('[data-next-step]:last-of-type');
            const originalBtnText = submitBtn?.textContent;
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Submitting...';
            }

            try {
                // Collect form data
                const intakeData = {
                    fullName: form.fullName.value,
                    email: form.email.value,
                    phone: form.phone.value,
                    address: form.address.value,
                    state: form.state.value,
                    city: form.city.value,
                    medication: selectedContext.med,
                    dosage: selectedContext.variation,
                    price: selectedContext.price,
                    callPreference: form.callPreference.value,
                    callDate: form.callDate.value || null,
                    callTime: form.callTime.value || null
                };

                // POST to backend API
                const response = await fetch('/api/intake', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(intakeData)
                });

                const result = await response.json();

                if (result.success) {
                    // Show success panel
                    form.hidden = true;
                    if (successPanel) {
                        successPanel.hidden = false;
                        // Add intake ID to success message
                        const intakeIdEl = successPanel.querySelector('[data-intake-id]');
                        if (intakeIdEl) {
                            intakeIdEl.textContent = result.intakeId;
                        }

                        // Set up the dynamic WhatsApp CTA button
                        const waContainer = successPanel.querySelector('#whatsapp-cta-container');
                        const waBtn = successPanel.querySelector('#whatsapp-cta-btn');
                        if (waContainer && waBtn) {
                            const patientName = intakeData.fullName || 'Patient';
                            const med = intakeData.medication || 'GLP-1';
                            const dose = intakeData.dosage || '';
                            const pref = intakeData.callPreference === 'schedule' ? 'Scheduled' : 'Callback';
                            
                            // Construct localized WhatsApp text
                            const waText = `Hello ObesityCare Cameroon! My name is ${patientName}. I just submitted my intake form (Intake ID: ${result.intakeId || ''}) for ${med} ${dose}. I preferred a ${pref} consultation. Please let me know when we can review my details. Thank you!`;
                            
                            waBtn.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(waText)}`;
                            waContainer.hidden = false; // Show the WhatsApp button container!
                        }
                    }
                    indicators.forEach((el) => el.classList.remove('is-active'));
                } else {
                    // Show error message
                    const errorMsg = result.errors?.join('\n') || result.message || 'An error occurred';
                    alert('Submission failed:\n' + errorMsg);
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                }
            } catch (error) {
                console.error('Intake submission error:', error);
                alert('Network error: ' + error.message);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalBtnText;
                }
            }
        });
    }

    // Enhanced card hover effects
    const cards = document.querySelectorAll('.visual-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 15px 50px rgba(6, 182, 212, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)';
        });
    });

    // Add cursor trail effect (optional enhancement)
    let cursorTrail = [];
    const maxTrailLength = 10;

    document.addEventListener('mousemove', (e) => {
        if (window.innerWidth > 968) { // Only on desktop
            cursorTrail.push({
                x: e.clientX,
                y: e.clientY,
                time: Date.now()
            });

            if (cursorTrail.length > maxTrailLength) {
                cursorTrail.shift();
            }

            // Remove old trail elements
            document.querySelectorAll('.cursor-trail').forEach(el => {
                if (Date.now() - parseInt(el.dataset.time) > 500) {
                    el.remove();
                }
            });

            // Create new trail element
            const trail = document.createElement('div');
            trail.className = 'cursor-trail';
            trail.style.left = e.clientX + 'px';
            trail.style.top = e.clientY + 'px';
            trail.dataset.time = Date.now();
            document.body.appendChild(trail);

            setTimeout(() => trail.remove(), 500);
        }
    });
});

// Add CSS for cursor trail dynamically
const style = document.createElement('style');
style.textContent = `
    .cursor-trail {
        position: fixed;
        width: 6px;
        height: 6px;
        background: radial-gradient(circle, rgba(6, 182, 212, 0.6), transparent);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        animation: trailFade 0.5s ease-out forwards;
    }

    @keyframes trailFade {
        0% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0);
        }
    }
`;
document.head.appendChild(style);
