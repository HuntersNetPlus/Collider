document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация Telegram WebApp
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand(); // Разворачиваем мини-приложение на весь экран
    
    // Элементы DOM
    const mainContainer = document.getElementById('main-app-container');
    const paymentPage = document.getElementById('payment-page');
    const citySelect = document.getElementById('city-select');
    const metroInput = document.getElementById('metro-input');
    const metroDatalist = document.getElementById('metro-options');
    const quickSearchBtn = document.getElementById('quick-search-btn');
    const productSlider = document.getElementById('product-slider');
    const placeholderCard = document.getElementById('placeholder-card');
    const checkoutButton = document.getElementById('checkout-button');
    const currencySelect = document.getElementById('currency-select');
    const paymentDetails = document.getElementById('payment-details');
    const finalPriceSpan = document.getElementById('final-price');
    const applyPromoBtn = document.getElementById('apply-promo-btn');
    const promoInput = document.getElementById('promo-input');
    const backToMainBtn = document.getElementById('back-to-main');

    // Наш список доступных городов для поиска
    const ACTIVE_CITIES = ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Казань', 'Самара', 'Нижний Новгород', 'Екатеринбург'];
    // Имитация списка позиций
    const ALL_PRODUCTS = [
        { id: 1, name: 'Позиция 1', price: 8000, img: 'product_img_1.png' },
        { id: 2, name: 'Позиция 2', price: 8000, img: 'product_img_2.png' },
        { id: 3, name: 'Позиция 3', price: 8000, img: 'product_img_3.png' },
        { id: 4, name: 'Позиция 4', price: 8000, img: 'product_img_4.png' },
        { id: 5, name: 'Позиция 5', price: 8000, img: 'product_img_5.png' },
        { id: 6, name: 'Позиция 6', price: 8000, img: 'product_img_6.png' }
    ];
    // Имитация данных метро (для примера)
    const METRO_OPTIONS = {
        'Москва': ['Охотный ряд', 'Тверская', 'Красные Ворота'],
        'Санкт-Петербург': ['Невский проспект', 'Адмиралтейская', 'Гостиный двор'],
        'Новосиб': ['Площадь Ленина', 'Речной вокзал'],
        // ... другие города
    };

    let selectedProduct = null;
    let currentCity = null;
    let currentMetro = null;

    // Имитация данных для оплаты
    const PAYMENT_DETAILS = {
        'RUB': {
            details: 'Банковская карта RUB:\nНомер: **** **** **** 1234\nБанк: SBER',
            rate: 1
        },
        'USD': {
            details: 'Криптовалюта USDT:\nКошелек: 0x...USDT\nСеть: TRC20',
            rate: 95
        },
        'EUR': {
            details: 'Банковский перевод EUR:\nIBAN: DE12...EUR',
            rate: 105
        }
    };

    // Генерирует рандомный ID
    const generateRandomId = () => Math.random().toString(36).substring(2, 10).toUpperCase();

    // Перемешивает массив
    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    /**
     * Загружает и отображает товары в слайдере.
     * @param {boolean} showProducts - true, если город активный.
     */
    function loadProducts(showProducts) {
        productSlider.innerHTML = '';
        if (placeholderCard) {
            placeholderCard.remove();
        }

        if (showProducts) {
            const shuffledProducts = shuffleArray([...ALL_PRODUCTS]);
            shuffledProducts.forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card';
                card.dataset.id = product.id;
                card.innerHTML = `
                    <img src="./assets/${product.img}" alt="${product.name}">
                    <p>${product.price} р</p>
                `;
                card.addEventListener('click', () => selectProduct(product, card));
                productSlider.appendChild(card);
            });
            // Делаем слайдер бесконечным: дублируем элементы
            shuffledProducts.slice(0, 3).forEach(product => {
                const card = document.createElement('div');
                card.className = 'product-card cloned';
                card.dataset.id = product.id;
                card.innerHTML = `<img src="./assets/${product.img}" alt="${product.name}"><p>${product.price} р</p>`;
                card.addEventListener('click', () => selectProduct(product, card));
                productSlider.appendChild(card);
            });
            
            // Имитация автоматического листания (как в ленте)
            let scrollInterval = setInterval(() => {
                const slider = document.getElementById('product-slider');
                const cardWidth = 165; // 150px card + 15px margin
                if (slider.scrollLeft >= slider.scrollWidth - slider.clientWidth) {
                    slider.scrollLeft = 0;
                } else {
                    slider.scrollLeft += cardWidth;
                }
            }, 3000);
            productSlider.dataset.intervalId = scrollInterval;

        } else {
            // Показываем заглушку
            productSlider.innerHTML = `
                <div class="product-card placeholder" id="placeholder-card">
                    <p class="placeholder-text">Здесь будут предложения</p>
                </div>
            `;
            // Останавливаем любое существующее автолистание
            if (productSlider.dataset.intervalId) {
                 clearInterval(productSlider.dataset.intervalId);
            }
        }
        
        // Сбрасываем выбранный товар и кнопку оплаты
        selectedProduct = null;
        checkoutButton.classList.add('hidden');
    }

    /**
     * Выбирает товар в слайдере.
     */
    function selectProduct(product, cardElement) {
        selectedProduct = product;
        document.querySelectorAll('.product-card').forEach(card => card.classList.remove('selected'));
        // Выделяем все дубликаты выбранной карточки
        document.querySelectorAll(`.product-card[data-id="${product.id}"]`).forEach(card => card.classList.add('selected'));
        
        checkoutButton.classList.remove('hidden');
    }

    /**
     * Переключает на страницу оплаты.
     */
    function showPaymentPage() {
        if (!selectedProduct) {
            tg.showAlert('Пожалуйста, выберите товар для оплаты.');
            return;
        }

        mainContainer.classList.add('hidden');
        paymentPage.classList.remove('hidden');
        
        // Заполняем информацию о заказе
        document.getElementById('order-id').textContent = generateRandomId();
        document.getElementById('profile-id').textContent = tg.initDataUnsafe.user ? tg.initDataUnsafe.user.id : generateRandomId();
        document.getElementById('current-time').textContent = new Date().toLocaleTimeString('ru-RU');
        
        // Заполняем информацию о товаре
        document.getElementById('payment-product-info').innerHTML = `
            <p><strong>Выбранный товар:</strong> ${selectedProduct.name}</p>
            <p><strong>Базовая Цена:</strong> ${selectedProduct.price} RUB</p>
        `;
        
        // Обновляем детали оплаты и цену
        updatePaymentDetails();
    }

    /**
     * Обновляет детали оплаты в зависимости от валюты и промокода.
     */
    function updatePaymentDetails() {
        const currency = currencySelect.value;
        const { details, rate } = PAYMENT_DETAILS[currency];
        const isPromoApplied = promoInput.value.toLowerCase() === 'testpromo'; // Пример промокода
        let price = selectedProduct.price;

        if (isPromoApplied) {
            price *= 0.9; // Скидка 10%
            tg.showPopup({message: 'Промокод успешно применен! Скидка 10%.'});
        }

        const finalPrice = (price / rate).toFixed(2);
        
        finalPriceSpan.textContent = `${finalPrice} ${currency}`;
        paymentDetails.textContent = details;
    }

    /**
     * Обработка выбора города.
     */
    citySelect.addEventListener('change', (e) => {
        currentCity = e.target.value;
        metroInput.value = '';
        metroInput.disabled = false;
        metroDatalist.innerHTML = '';
        
        if (METRO_OPTIONS[currentCity]) {
            METRO_OPTIONS[currentCity].forEach(metro => {
                const option = document.createElement('option');
                option.value = metro;
                metroDatalist.appendChild(option);
            });
        } else {
             // Можно оставить пустым, если нет опций
        }

        const showProducts = ACTIVE_CITIES.includes(currentCity);
        loadProducts(showProducts);
    });

    /**
     * Обработка ввода метро.
     */
    metroInput.addEventListener('input', (e) => {
        currentMetro = e.target.value;
        // Здесь можно добавить логику проверки метро, но в рамках этого примера достаточно просто сохранить значение.
    });

    /**
     * Обработка кнопки быстрого поиска (Геолокация).
     */
    quickSearchBtn.addEventListener('click', () => {
        // Проверка поддержки запроса геолокации Telegram Mini App
        if (tg.isVersionAtLeast('6.9') && tg.version) {
            // Используем Telegram WebApp API для запроса геолокации
            tg.sendData(JSON.stringify({ method: 'request_location' }));
            
            // NOTE: В реальном приложении нужно ожидать ответ от бота/бэкенда
            // с координатами и их обработкой для определения города/метро.
            
            // Имитация успешного определения города (например, Москва)
            tg.showPopup({message: 'Идет определение местоположения...'}, (id) => {
                if (id) {
                    setTimeout(() => {
                        tg.closePopup(id);
                        citySelect.value = 'Москва';
                        citySelect.dispatchEvent(new Event('change')); // Запускаем логику выбора города
                        tg.showAlert('Местоположение определено: Москва. Предложения загружены!');
                    }, 1500);
                }
            });

        } else {
             // Стандартный Web API Geolocation для старых версий/десктопа
             if ("geolocation" in navigator) {
                 navigator.geolocation.getCurrentPosition((position) => {
                     // В реальном приложении: отправляем lat/lon на бэкенд
                     // const { latitude, longitude } = position.coords;
                     
                     // Имитация
                     citySelect.value = 'Москва';
                     citySelect.dispatchEvent(new Event('change'));
                     tg.showAlert('Геолокация получена. Город определен как Москва.');
                 }, (error) => {
                     tg.showAlert('Ошибка геолокации: ' + error.message + '. Выберите город вручную.');
                 });
             } else {
                 tg.showAlert('Геолокация не поддерживается в вашем браузере/приложении.');
             }
        }
    });

    // Обработка перехода на оплату
    checkoutButton.addEventListener('click', showPaymentPage);
    
    // Обработка смены валюты и применения промокода
    currencySelect.addEventListener('change', updatePaymentDetails);
    applyPromoBtn.addEventListener('click', updatePaymentDetails);
    
    // Обработка кнопки "Назад"
    backToMainBtn.addEventListener('click', () => {
        paymentPage.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        tg.showAlert('Возврат к выбору товара.');
    });

    // Инициализация при загрузке: загружаем заглушку
    loadProducts(false);
});
