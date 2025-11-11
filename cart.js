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

  let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

  // --- Modal Control ---
  const openCartModal = () => cartModal.style.display = 'flex';
  const closeCartModal = () => cartModal.style.display = 'none';
  const openCheckoutModal = () => checkoutModal.style.display = 'flex';
  const closeCheckoutModal = () => checkoutModal.style.display = 'none';

  // --- Main Cart Logic ---
  const addProductToCart = (e) => {
    const card = e.target.closest('.card');
    const id = card.dataset.id;
    const name = card.dataset.name;
    const price = parseInt(card.dataset.price);
    const image = card.querySelector('.card-media img').src;

    const existingItem = cart.find(item => item.id === id);

    if (existingItem) {
      // If item exists, just increase quantity
      existingItem.quantity++;
    } else {
      // Only add if it's a new item
      cart.push({ id, name, price, image, quantity: 1 });
    }
    
    updateCart();
    e.target.textContent = 'Đã thêm!';
    setTimeout(() => { e.target.textContent = 'Thêm vào giỏ'; }, 1000);
  };

  const updateCart = () => {
    localStorage.setItem('shoppingCart', JSON.stringify(cart));
    renderCartItems();
    
    // The cart count should reflect the number of unique items, not the total quantity.
    const totalItems = cart.length;
    
    // Re-select cartCount span in case it was moved and re-created
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

    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwBa9EUIrt0bAOBWT_gk0i5Mn-94j6ah7cWpU2Ovzb1B3awGlTCr3__YslxVGSMaqf1BA/exec";

    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Revert to no-cors to bypass the persistent CORS issue
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    .then(() => {
        // With no-cors, we assume success and give immediate feedback.
        alert(`Cảm ơn ${customerName}, đơn hàng của bạn đã được gửi thành công! Nhà Nấm Nem sẽ liên hệ với bạn sớm nhất.`);
        
        // Explicitly clear the cart array and remove from local storage
        cart.length = 0;
        localStorage.removeItem('shoppingCart');

        updateCart(); // Re-render the empty cart and update UI
        closeCheckoutModal();
        checkoutForm.reset();

        // Also reset the state of all 'add to cart' buttons on the page
        document.querySelectorAll('.add-to-cart').forEach(button => {
            if (button.textContent !== 'Thêm vào giỏ') {
                button.textContent = 'Thêm vào giỏ';
            }
        });
    })
    .catch(error => {
        // This will now only catch network errors, not server-side ones.
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
            addProductToCart(e);
        }
    });
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