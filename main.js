document.addEventListener('DOMContentLoaded', () => {
    const productList = document.getElementById('product-list');
    const heroSection = document.querySelector('.hero');

            // Set hero banner
            if (heroSection && typeof bannerImage !== 'undefined') {
                heroSection.style.backgroundImage = `url('${bannerImage}')`;
            }

            // --- Product Carousel Logic ---
            const setupProductCarousel = () => {
                if (!productList || typeof products === 'undefined' || products.length === 0) return;

                // 1. Chọn 8 sản phẩm ngẫu nhiên
                const randomProducts = [...products].sort(() => 0.5 - Math.random()).slice(0, 8);

                // 2. Nhân đôi danh sách để tạo hiệu ứng lặp vô tận
                const carouselItems = [...randomProducts, ...randomProducts];

                // 3. Render các sản phẩm vào track
                productList.innerHTML = ''; // Xóa nội dung cũ
                carouselItems.forEach(product => {
                    const card = document.createElement('article');
                    card.className = 'card view-details';
                    card.dataset.id = product.id;
                    card.dataset.productId = product.id;

                    const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : 'image/placeholder.jpg';

                    card.innerHTML = `
                        <div class="card-media">
                            <img src="${imageUrl}" alt="${product.name}" loading="lazy">
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

                // Thêm event listener cho từng card để dừng animation khi hover
                const cards = productList.querySelectorAll('.card');
                cards.forEach(card => {
                    card.addEventListener('mouseenter', () => {
                        productList.style.animationPlayState = 'paused';
                    });
                    card.addEventListener('mouseleave', () => {
                        // Chỉ chạy lại nếu modal không mở
                        if (!isModalOpen) {
                            productList.style.animationPlayState = 'running';
                        }
                    });
                });

                // 4. Áp dụng animation
                const totalWidth = (300 + 26) * randomProducts.length; // (card_width + gap) * number_of_items
                const animationDuration = randomProducts.length * 4; // 4 giây cho mỗi sản phẩm

                productList.style.width = `${totalWidth * 2}px`;
                productList.style.animation = `scroll-horizontal ${animationDuration}s linear infinite`;
            };

            setupProductCarousel();

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
            let isModalOpen = false; // Biến cờ để theo dõi trạng thái modal

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
                isModalOpen = true; // Đặt cờ là true khi modal mở
                // Dừng carousel khi modal mở
                if (productList.style.animationPlayState !== 'paused') {
                    productList.style.animationPlayState = 'paused';
                }
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

            // Centralized click listener for productList (carousel track)
            productList.addEventListener('click', (e) => {
                const viewDetailsTrigger = e.target.closest('.view-details');
                if (!viewDetailsTrigger) return; // Click was not on a product card

                if (e.target.classList.contains('add-to-cart')) {
                    // Clicked "Thêm vào giỏ" button
                    const card = e.target.closest('.card');
                    if (card && card.dataset.id && window.addProductById) { // Check if addProductById is available
                        window.addProductById(card.dataset.id);
                        e.target.textContent = 'Đã thêm!';
                        productList.style.animationPlayState = 'paused'; // Pause carousel
                        setTimeout(() => {
                            e.target.textContent = 'Thêm vào giỏ';
                            productList.style.animationPlayState = 'running'; // Resume carousel
                        }, 1000);
                    }
                } else {
                    // Clicked on the card but not the "Thêm vào giỏ" button, so open modal
                    const productId = viewDetailsTrigger.dataset.productId;
                    openProductModal(productId);
                }
            });
            closeModalBtn.addEventListener('click', () => {
                productModal.style.display = 'none';
                isModalOpen = false; // Đặt cờ là false khi modal đóng
                // Chạy lại carousel khi đóng modal
                productList.style.animationPlayState = 'running';
            });

            productModal.addEventListener('click', (e) => {
                if (e.target === productModal) {
                    productModal.style.display = 'none';
                    isModalOpen = false; // Đặt cờ là false khi modal đóng
                    // Chạy lại carousel khi đóng modal
                    productList.style.animationPlayState = 'running';
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