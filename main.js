document.addEventListener('DOMContentLoaded', () => {
            const productList = document.getElementById('product-list');
            const heroSection = document.querySelector('.hero');

            // Set hero banner
            if (heroSection && typeof bannerImage !== 'undefined') {
                heroSection.style.backgroundImage = `url('${bannerImage}')`;
            }

            // --- Delegated Image Zoom Logic ---
            function moveLens(e) {
                const lens = e.currentTarget.querySelector('.img-zoom-lens');
                const result = e.currentTarget.parentElement.querySelector('.img-zoom-result');
                const img = e.currentTarget.querySelector('img');
                if (!lens || !result || !img) return;

                e.preventDefault();
                
                const pos = getCursorPos(e, img);
                let x = pos.x - (lens.offsetWidth / 2);
                let y = pos.y - (lens.offsetHeight / 2);

                if (x > img.width - lens.offsetWidth) { x = img.width - lens.offsetWidth; }
                if (x < 0) { x = 0; }
                if (y > img.height - lens.offsetHeight) { y = img.height - lens.offsetHeight; }
                if (y < 0) { y = 0; }

                lens.style.left = x + "px";
                lens.style.top = y + "px";

                const cx = result.offsetWidth / lens.offsetWidth;
                const cy = result.offsetHeight / lens.offsetHeight;
                result.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
            }

            function getCursorPos(e, img) {
                const a = img.getBoundingClientRect();
                const x = e.pageX - a.left - window.pageXOffset;
                const y = e.pageY - a.top - window.pageYOffset;
                return { x, y };
            }

            productList.addEventListener('mouseover', (e) => {
                if (window.innerWidth < 1024) return; // Only on desktop
                const cardMedia = e.target.closest('.card-media');
                if (!cardMedia) return;

                // Avoid re-creating elements if they exist
                let result = cardMedia.parentElement.querySelector('.img-zoom-result');
                if (!result) {
                    result = document.createElement("DIV");
                    result.setAttribute("class", "img-zoom-result");
                    cardMedia.parentElement.appendChild(result);
                }

                let lens = cardMedia.querySelector('.img-zoom-lens');
                if (!lens) {
                    lens = document.createElement("DIV");
                    lens.setAttribute("class", "img-zoom-lens");
                    cardMedia.insertBefore(lens, cardMedia.firstChild);
                }
                
                const img = cardMedia.querySelector('img');
                result.style.display = 'block';
                lens.style.display = 'block';
                
                result.style.backgroundImage = `url('${img.src}')`;
                const cx = result.offsetWidth / lens.offsetWidth;
                const cy = result.offsetHeight / lens.offsetHeight;
                result.style.backgroundSize = `${img.width * cx}px ${img.height * cy}px`;

                cardMedia.addEventListener('mousemove', moveLens);
            });

            productList.addEventListener('mouseout', (e) => {
                if (window.innerWidth < 1024) return;
                const cardMedia = e.target.closest('.card-media');
                if (!cardMedia) return;

                const result = cardMedia.parentElement.querySelector('.img-zoom-result');
                const lens = cardMedia.querySelector('.img-zoom-lens');

                if (result) result.style.display = 'none';
                if (lens) lens.style.display = 'none';
                
                cardMedia.removeEventListener('mousemove', moveLens);
            });


            // Render product cards
            if (productList && typeof products !== 'undefined') {
                products.forEach(product => {
                    const card = document.createElement('article');
                    // Add 'view-details' to the main card element
                    card.className = 'card view-details'; 
                    card.dataset.id = product.id;
                    card.dataset.name = product.name;
                    card.dataset.price = product.price;
                    card.dataset.productId = product.id;

                    // Use the first image for the card
                    const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : 'image/placeholder.jpg';

                    card.innerHTML = `
                        <div class="card-media">
                            <img src="${imageUrl}" alt="${product.name}">
                        </div>
                        <div class="card-body">
                            <h3>${product.name}</h3>
                            <p>${product.description}</p>
                            <p><strong>Giá: ${product.price.toLocaleString('vi-VN')}đ</strong></p>
                            <button class="btn primary add-to-cart">Thêm vào giỏ</button>
                        </div>
                    `;
                    productList.appendChild(card);
                });
            }

            // --- Product Detail Modal Logic ---
            const productModal = document.getElementById('product-detail-modal');
            const closeModalBtn = document.getElementById('close-product-modal-btn');
            const modalImage = document.getElementById('product-modal-image');
            const modalName = document.getElementById('product-modal-name');
            const modalDesc = document.getElementById('product-modal-description');
            const modalPrice = document.getElementById('product-modal-price');
            const modalThumbnails = document.getElementById('product-modal-thumbnails');
            const prevBtn = document.getElementById('gallery-prev-btn');
            const nextBtn = document.getElementById('gallery-next-btn');

            let currentProductImages = [];
            let currentImageIndex = 0;

            const openProductModal = (productId) => {
                const product = products.find(p => p.id === parseInt(productId));
                if (!product || !product.images || product.images.length === 0) return;

                // Store the current product's ID on the modal for the cart to use
                productModal.dataset.productId = product.id;

                currentProductImages = product.images;
                currentImageIndex = 0;

                modalName.textContent = product.name;
                modalDesc.textContent = product.description;
                modalPrice.textContent = product.price.toLocaleString('vi-VN');
                
                updateModalImage();
                
                modalThumbnails.innerHTML = '';
                if (product.images.length > 1) {
                    product.images.forEach((imgSrc, index) => {
                        const thumb = document.createElement('img');
                        thumb.src = imgSrc;
                        thumb.alt = `Thumbnail ${index + 1}`;
                        thumb.dataset.index = index;
                        modalThumbnails.appendChild(thumb);
                    });
                    modalThumbnails.style.display = 'flex';
                } else {
                    modalThumbnails.style.display = 'none';
                }


                productModal.style.display = 'flex';
            };

            const updateModalImage = () => {
                if (currentProductImages.length === 0) return;
                modalImage.src = currentProductImages[currentImageIndex];
                
                const thumbs = modalThumbnails.querySelectorAll('img');
                thumbs.forEach((thumb, index) => {
                    thumb.classList.toggle('active', index === currentImageIndex);
                });

                prevBtn.style.display = currentProductImages.length > 1 && currentImageIndex > 0 ? 'block' : 'none';
                nextBtn.style.display = currentProductImages.length > 1 && currentImageIndex < currentProductImages.length - 1 ? 'block' : 'none';
            };

            productList.addEventListener('click', (e) => {
                const viewDetailsTrigger = e.target.closest('.view-details');
                // Do not open modal if the click was on a zoom-related element or add-to-cart button
                if (viewDetailsTrigger && !e.target.closest('.img-zoom-lens') && !e.target.closest('.add-to-cart')) {
                    const productId = viewDetailsTrigger.dataset.productId;
                    openProductModal(productId);
                }
            });

            closeModalBtn.addEventListener('click', () => productModal.style.display = 'none');
            productModal.addEventListener('click', (e) => {
                if (e.target === productModal) {
                    productModal.style.display = 'none';
                }
            });

            nextBtn.addEventListener('click', () => {
                if (currentImageIndex < currentProductImages.length - 1) {
                    currentImageIndex++;
                    updateModalImage();
                }
            });

            prevBtn.addEventListener('click', () => {
                if (currentImageIndex > 0) {
                    currentImageIndex--;
                    updateModalImage();
                }
            });

            modalThumbnails.addEventListener('click', (e) => {
                if (e.target.tagName === 'IMG') {
                    currentImageIndex = parseInt(e.target.dataset.index);
                    updateModalImage();
                }
            });


            // --- Mobile Menu Logic ---
            const header = document.getElementById('site-header');
            const menuBtn = document.querySelector('.menu-btn');
            const mobileNav = document.querySelector('.mobile-nav');

            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('solid');
                } else {
                    header.classList.remove('solid');
                }
            });

            menuBtn.addEventListener('click', () => {
                mobileNav.classList.toggle('open');
            });
        });