document.addEventListener('DOMContentLoaded', () => {
  // Cart elements
  const cartIcon = document.getElementById('cart-icon');
  const cartModal = document.getElementById('cart-modal');
  const closeCartModalButton = document.getElementById('close-modal-btn');
  const cartItemsContainer = document.getElementById('cart-items');
  let cartCount = document.getElementById('cart-count'); // Use let as it might be re-created
  const cartTotal = document.getElementById('cart-total');
  
  // ... (rest of the element selections remain the same)
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutModal = document.getElementById('checkout-modal');
  const closeCheckoutModalButton = document.getElementById('close-checkout-modal-btn');
  const checkoutForm = document.getElementById('checkout-form');
  const productList = document.getElementById('product-list');
  const productModal = document.getElementById('product-detail-modal');

  let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

  // --- Modal Control ---
  const openCartModal = () => cartModal.style.display = 'flex';
  const closeCartModal = () => cartModal.style.display = 'none';
  const openCheckoutModal = () => checkoutModal.style.display = 'flex';
  const closeCheckoutModal = () => checkoutModal.style.display = 'none';

  // --- Main Cart Logic ---
  const addProductById = (productId) => {
    const product = products.find(p => p.id === parseInt(productId));
    if (!product) {
      console.error('Product not found:', productId);
      return;
    }

    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      const imageUrl = (product.images && product.images.length > 0) ? product.images[0] : 'image/placeholder.jpg';
      cart.push({ id: product.id, name: product.name, price: product.price, image: imageUrl, quantity: 1 });
    }
    
    updateCart();
  };

  const updateCart = () => {
    // Sanitize cart data to prevent errors from malformed items in localStorage
    cart = cart.filter(item => item && typeof item.price !== 'undefined' && item.price !== null);

    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    renderCartItems();
    
    const totalItems = cart.length;
    
    cartCount = document.getElementById('cart-count'); 
    if(cartCount) {
        cartCount.textContent = totalItems;
    }

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    cartTotal.textContent = totalPrice.toLocaleString('vi-VN');
  };

  // ... (renderCartItems, handleCheckout, confirmOrder are the same)
  const renderCartItems = () => {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<p>Giỏ hàng của bạn đang trống.</p>';
      return;
    }
    cart.forEach(item => {
      const cartItemElement = document.createElement('div');
      cartItemElement.classList.add('cart-item');
      cartItemElement.innerHTML = `
        <img src="${item.image}" alt="${item.name}">
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${item.price.toLocaleString('vi-VN')}đ</p>
        </div>
        <div class="quantity-control">
          <button class="quantity-btn minus-btn" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="quantity-btn plus-btn" data-id="${item.id}">+</button>
        </div>
        <button class="remove-from-cart" data-id="${item.id}" aria-label="Xóa sản phẩm">×</button>
      `;
      cartItemsContainer.appendChild(cartItemElement);
    });
  };
  
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Giỏ hàng của bạn đang trống!');
      return;
    }
    closeCartModal();
    openCheckoutModal();
  };

  const confirmOrder = (e) => {
    e.preventDefault();
    const submitButton = checkoutForm.querySelector('button[type="submit"]');
    
    // Get form data
    const customerName = document.getElementById('customer-name').value.trim();
    const phone = document.getElementById('customer-phone').value.trim();
    const address = document.getElementById('customer-address').value.trim();
    const deliveryTime = document.getElementById('delivery-time').value.trim();
    const notes = document.getElementById('customer-notes').value.trim();

    if (!customerName || !phone || !address) {
        alert('Vui lòng điền đầy đủ các trường bắt buộc: Họ tên, Số điện thoại, và Địa chỉ.');
        return;
    }

    // Disable button and show feedback
    submitButton.disabled = true;
    submitButton.textContent = 'Đang gửi...';

    // Prepare data for Google Sheet
    const orderTimestamp = new Date().toLocaleString('vi-VN');
    const sheetData = cart.map(item => {
      return [
        orderTimestamp,
        customerName,
        phone,
        address,
        deliveryTime,
        notes,
        item.name,
        item.quantity,
        item.price,
        item.quantity * item.price
      ];
    });

    const payload = {
      rows: sheetData
    };

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzwQo72gHCloPGcvO1-M9ol00ZQCYzS1-JDVethk5BLYYuqytJnkTgwg75y-78cshXl/exec";

    fetch(SCRIPT_URL, {
      redirect: "follow", // Important for handling Google Script redirects
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' }
    })
    .then(response => {
        // Google Apps Script often redirects. A successful submission might not return a clean JSON response.
        // We can assume success if the request doesn't throw a network error.
        alert(`Cảm ơn ${customerName}, đơn hàng của bạn đã được gửi thành công! Nhà Nấm Nem sẽ liên hệ với bạn sớm nhất.`);
        
        cart.length = 0;
        localStorage.removeItem('shoppingCart');

        updateCart();
        closeCheckoutModal();
        checkoutForm.reset();

        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.textContent = 'Thêm vào giỏ';
        });
    })
    .catch(error => {
        // Catches network errors and issues with the fetch request itself
        console.error('Network error sending order:', error);
        alert('Đã có lỗi kết nối khi gửi đơn hàng. Vui lòng kiểm tra lại đường truyền và thử lại.');
    })
    .finally(() => {
        // Re-enable button
        submitButton.disabled = false;
        submitButton.textContent = 'Xác nhận đơn hàng';
    });
  };


  // --- Event Listeners ---
  if(productList) {
    productList.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-to-cart')) {
            const card = e.target.closest('.card');
            if (card && card.dataset.id) {
              addProductById(card.dataset.id);
              e.target.textContent = 'Đã thêm!';
              setTimeout(() => { e.target.textContent = 'Thêm vào giỏ'; }, 1000);
            }
        }
    });
  }

  if(productModal) {
    productModal.addEventListener('click', (e) => {
      if (e.target.classList.contains('add-to-cart')) {
        const productId = productModal.dataset.productId;
        if (productId) {
          addProductById(productId);
          e.target.textContent = 'Đã thêm!';
          setTimeout(() => { e.target.textContent = 'Thêm vào giỏ'; }, 1000);
        }
      }
    })
  }
  
  cartItemsContainer.addEventListener('click', (e) => {
    const target = e.target;
    const id = target.dataset.id;
    if (!id) return;
    const item = cart.find(cartItem => cartItem.id === id);
    if (!item) return;

    if (target.classList.contains('remove-from-cart')) {
      cart = cart.filter(cartItem => cartItem.id !== id);
    } else if (target.classList.contains('plus-btn')) {
      item.quantity++;
    } else if (target.classList.contains('minus-btn')) {
      item.quantity--;
      if (item.quantity === 0) {
        cart = cart.filter(cartItem => cartItem.id !== id);
      }
    }
    updateCart();
  });

  cartIcon.addEventListener('click', (e) => {
      e.preventDefault();
      renderCartItems();
      openCartModal();
  });

  closeCartModalButton.addEventListener('click', closeCartModal);
  cartModal.addEventListener('click', (e) => {
    if (e.target === cartModal) closeCartModal();
  });
  
  checkoutBtn.addEventListener('click', handleCheckout);
  
  closeCheckoutModalButton.addEventListener('click', closeCheckoutModal);
  checkoutModal.addEventListener('click', (e) => {
    if (e.target === checkoutModal) closeCheckoutModal();
  });

  checkoutForm.addEventListener('submit', confirmOrder);

  // --- Responsive Nav Logic ---
  const desktopNav = document.querySelector('.nav');
  const mobileNav = document.querySelector('.mobile-nav');
  
  const moveCart = () => {
    if (window.innerWidth <= 680) {
      // If cart icon is not in mobile nav, move it
      if (!mobileNav.contains(cartIcon)) {
        cartIcon.innerHTML = `Giỏ hàng (<span id="cart-count">${cartCount.textContent}</span>)`;
        mobileNav.appendChild(cartIcon);
      }
    } else {
      // If cart icon is not in desktop nav, move it back
      if (!desktopNav.contains(cartIcon)) {
        cartIcon.innerHTML = `🛒 <span id="cart-count">${cartCount.textContent}</span>`;
        desktopNav.appendChild(cartIcon);
      }
    }
  };

  // Initial Load & Resize
  moveCart();
  window.addEventListener('resize', moveCart);
  updateCart();
});