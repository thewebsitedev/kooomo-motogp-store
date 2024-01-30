// load js code after dom is loaded
document.addEventListener("DOMContentLoaded", () => {

	/** VARIABLES **/

	let loading = false;
	let loaded = 0;
	let itemsToShow = 12;

	const PRODUCTS_API_URL = "https://9wtn88dfcl.execute-api.eu-west-1.amazonaws.com/products";
	const SEARCH_API_URL = "https://9wtn88dfcl.execute-api.eu-west-1.amazonaws.com/products?search=";

	const totalItemsEl = document.getElementById("items-total");
	const loadingEl = document.getElementById("loading");
	const mobileMenuEl = document.getElementById("mobile-menu");
	const searchDiv = document.getElementById('header-search');
	const linksDiv = document.getElementById('header-links');
	const searchList = document.getElementById("search-list");
	const mobileSearchList = document.getElementById("mobile-search-list");

	/** UTILITY FUNCTIONS **/

	// function to calculate random discount between 2 values
	function getRandomDiscount(min, max) {
		return Math.floor( Math.random() * (max - min) + min );
	}

	/** MOBILE MENU **/

	// click event for menu button
	document.getElementById("mobile-menu-button").addEventListener("click", () => {
		// Toggle the 'show' class on each click
		mobileMenuEl.classList.toggle("show");
	});

	// window resize event to hide mobile menu
	window.addEventListener("resize", () => {
		mobileMenuEl.classList.remove("show");
	});

	/** SLIDER **/

	// get the slider element
	const slideEl = document.getElementById("slide");
	// get sound path from data attribute
	const sound = slideEl.getAttribute('data-sound');

	// play sound on slide click or tap
	slideEl.addEventListener("click", () => {
		playSound(sound);
	});

	// function to play sound
	function playSound(soundFile) {
        new Audio(soundFile).play();
    }

	/** PRODUCTS **/

    // click event for grid radio button
	document.getElementsByName("grid").forEach((radio) => {
		radio.addEventListener("click", (e) => {
			const value = e.target.value;
			// get the grid element
			const grid = document.getElementById("products");
			// if show grid is checked
			if (value === "4") {
				// add show class to grid
				grid.classList.add("product-grid-alt");
			} else {
				// remove show class from grid
				grid.classList.remove("product-grid-alt");
			}
		});
	});

	// function to fetch products from api and store result in products variable and local storage
	async function fetchProducts() {
		// fetch products from api
		try {
			const response = await fetch(
				PRODUCTS_API_URL
			);
			if ( ! response.ok ) {
				throw new Error( "There is some trouble with the network request." );
			}
			const data = await response.json();
			localStorage.setItem("motogp-store-products", JSON.stringify(data));
			// for future use, store timestamp of last fetch
			localStorage.setItem("motogp-store-products-timestamp", Date.now());
			return data;
		} catch (error) {
			console.error("There was a problem in fetching the products.", error);
		}
	}

	// function to render products
	function renderProducts(products, start, end) {
		// get first 12 products
		let slicedProducts = products.slice(start, end);
		// get the products element
		const productsEl = document.getElementById("products");
		// if products element exists
		if (productsEl) {
			// create a variable to store the html
			let html = "";
			// loop through first 12 products
			slicedProducts.forEach((product) => {
				// calculate random discount
				const discount = getRandomDiscount(10, 50);
				const discountedPrice = product.price - (product.price * discount) / 100;
				// create html template for each product
				html += `
					<div class="product">
						<div class="product-image">
							<a href="#">
								<img src="images/product-thumb-placeholder.webp" data-src="${product.image}" width="326" height="240" alt="${product.name}">
							</a>
						</div>
						<div class="product-info">
							<div class="product-title">
								<a href="#">${product.name}</a>
							</div>
							<div class="product-price">
								<span class="product-price-old">${product.currency} ${discountedPrice.toFixed(2)}</span>
								<span class="product-price-new">${product.currency} ${product.price.toFixed(2)}</span>
							</div>
						</div>
						<div class="product-wishlist">
							<button class="icon-button">
								<img width="28" height="24" src="images/icon-heart.png" alt="wishlist">
							</button>
						</div>
						<div class="product-discount">
							<span class="product-discount-percent">${discount}%</span>
						</div>
					</div>
				`;
			});
			// set the html to products element
			// productsEl.innerHTML += html;
			productsEl.insertAdjacentHTML('beforeend', html);

			// lazy load product images
			lazyLoadProductImages();
		}
	}

	// load proiduct images after dom is loaded
	function lazyLoadProductImages() {
		// lazy loading product images using observer api
		let options = {
			root: null, // null for viewport as the root
			rootMargin: '0px' // threshold for intersection
		};
		// get the products element
		const productsEl = document.querySelectorAll(".product");
		// if products element exists
		if (productsEl) {
			// create an observer
			const observer = new IntersectionObserver((entries) => {
				// loop through the entries
				entries.forEach((entry) => {
					// if entry is visible
					if (entry.isIntersecting) {
						// add class to entry el
						entry.target.classList.add("animated");
						entry.target.classList.add("fadeInUp");
						// get the image element
						const imageEl = entry.target.querySelector("img");
						// if image element exists
						if (imageEl && imageEl.dataset.src !== imageEl.src) {
							// set the src attribute
							imageEl.src = imageEl.dataset.src;
							// Stop observing the image
							observer.unobserve(imageEl);
						}
					}
				});
			}, options);
			// // observe the products element
			productsEl.forEach((product) => {
				// get the image element
				const imageEl = product.querySelector("img");
				// check if src !== data-src
				if (imageEl && imageEl.src !== imageEl.dataset.src) {
					// observe
					observer.observe(product);
				}
			});
		}
	}

	// function to fetch and render products
	async function fetchAndRenderProducts() {
		// fetch products from api
		let products = JSON.parse(localStorage.getItem("motogp-store-products"));
		// fetch timestamp
		let timestamp = localStorage.getItem("motogp-store-products-timestamp");
		// if not stored, fetch products from api
		// For future use, check timestamp of last fetch and fetch again as required
		if ( ! products || products.length === 0 || products.length && timestamp && (Date.now() - timestamp > 3600000) ){
			// fetch products from api
			products = await fetchProducts();
		}

		// proceed only if products are available
		if ( products ) {
			// Show total items count
			const totalItems = products.length;
			totalItemsEl.innerHTML = totalItems;
			
			// if initial load, clear container
			if (loaded === 0) {
				// clear container
				document.getElementById("products").innerHTML = "";
			}
			// render products
			renderProducts(products, loaded, loaded + itemsToShow);

			loaded += itemsToShow;

			// lazy loading products using observer api
			let options = {
				root: null, // null for viewport as the root
				rootMargin: '0px' // threshold for intersection
			};
			// get the products element
			const productsEl = document.getElementById("products");
			// if products element exists
			if (productsEl) {
				// create an observer
				const observer = new IntersectionObserver((entries) => {
					// loop through the entries
					entries.forEach((entry) => {
						// if entry is visible
						if (entry.isIntersecting && !loading && loaded < products.length) {
							// set loading to true
							loading = true;
							// render products
							renderProducts(products, loaded, loaded + itemsToShow);
							// increment loaded count
							loaded += itemsToShow;
							// set loading to false
							loading = false;
							if (loaded >= totalItems) {
								// disconnect observer if all products are loaded
								observer.disconnect();
								// add text to loading element child
								loadingEl.children[0].innerHTML = "All products loaded.";
								loadingEl.children[0].classList.add("disabled");
							}
						}
					});
				}, options);
				// // observe the products element
				observer.observe(loadingEl);
			}
		}
	}

	// fetch and render products
	fetchAndRenderProducts();
	
	/** SEARCH FUNCTIONALITY **/

	// click event for search button
	document.getElementById('search-button').addEventListener('click', function() {
		// Check if 'hide' class is present
		var isHidden = searchDiv.classList.contains('hide');
		// Toggle classes based on visibility
		searchDiv.classList.toggle('hide', !isHidden);
		searchDiv.classList.toggle('show', isHidden);
		linksDiv.classList.toggle('hide', isHidden);
	});

	// function to search products from api and store result in products variable and local storage
	async function searchProducts(query) {
		// sanitize query
		query = query.trim();
		// remove special characters
		query = query.replace(/[^\w\s]/gi, '');
		// if query is not empty
		if (query) {
			// fetch products from api
			try {
				const response = await fetch(
					SEARCH_API_URL + query
				);
				if ( ! response.ok ) {
					throw new Error( "There is some trouble with the network request." );
				}
				const data = await response.json();
				localStorage.setItem(`motogp-store-search-${query}`, JSON.stringify(data));
				return data;
			} catch (error) {
				console.error("There was a problem in searching the products.", error);
			}
		}
	}

	// function to render search results
	function renderSearchResults(products, elID) {
		// get the products element
		const searchListEl = document.getElementById(elID);
		// if products element exists
		if (searchListEl) {
			// create a variable to store the html
			let html = "";
			if (products.length) {
				// loop through first 12 products
				products.forEach((product) => {
					// url encode the product name
					const encodedName = encodeURIComponent(product.name);
					// create html template for each product
					html += `
						<li>
							<a class="share-search-text" href="#">${product.name}</a>
							<button class="share-search-button" data-link="/?s=${ encodedName}">share</button>
						</li>
					`;
					
				});
			} else {
				html += `
					<li>
						No results found.
					</li>
				`;
			}
			// set the html to search list element
			searchListEl.innerHTML = html;
		}
	}

	// function to handle mobile search
	async function handleMobileSearch(e) {
		// prevent default form submission
		e.preventDefault();
		// get the search query
		const query = e.target.value;
		// if query is not empty
		if (query) {
			// search products from api
			let products = localStorage.getItem(`motogp-store-search-${query}`);
			// if not stored, fetch products from api
			if ( ! products || products.length === 0 ) {
				// fetch products from api
				products = await searchProducts(query);
			} else {
				// parse products from local storage
				products = JSON.parse(products);
			}
			// proceed only if products are available
			if ( products ) {
				// render search results
				renderSearchResults(products, "mobile-search-list");
				// make search list visible
				document.getElementById("mobile-search-list").parentElement.classList.add("show");
				// make search query button visible
				document.getElementById("share-mobile-query-button").classList.add("show");
				// add data-link attribute to search query button
				document.getElementById("share-mobile-query-button").dataset.link = "/?s=" + encodeURIComponent(query);
			}
		}
	}

	// function to handle search
	async function handleSearch(e) {
		// prevent default form submission
		e.preventDefault();
		// get the search query
		const query = e.target.value;
		// if query is not empty
		if (query) {
			// search products from api
			let products = JSON.parse(localStorage.getItem(`motogp-store-search-${query}`));
			// if not stored, fetch products from api
			if ( ! products || products.length === 0 ) {
				// fetch products from api
				products = await searchProducts(query);
			}
			// proceed only if products are available
			if ( products ) {
				// render search results
				renderSearchResults(products, "search-list");
				// make search list visible
				document.getElementById("search-list").parentElement.classList.add("show");
				// make search query button visible
				document.getElementById("share-query-button").classList.add("show");
				// add data-link attribute to search query button
				document.getElementById("share-query-button").dataset.link = "/?s=" + encodeURIComponent(query);
			}
		}
	}

	// type event for search input on mobile
	document.getElementById("mobile-search").addEventListener("keyup", (e) => {
		// wait for user to stop typing
		setTimeout(() => {
			// handle search
			handleMobileSearch(e);
		}, 1000);
	});

	// type event for search input
	document.getElementById("search").addEventListener("keyup", (e) => {
		// wait for user to stop typing
		setTimeout(() => {
			// handle search
			handleSearch(e);
		}, 1000);
	});

	// Function to hide element if click is outside the specified container
	function hideOnOutsideClick(element, containerSelector, event) {
		if (element.parentElement.classList.contains("show") && !event.target.closest(containerSelector)) {
			element.parentElement.classList.remove("show");
		}
	}

	// hide search list on click outside of search container
	document.addEventListener("click", (e) => {
		// Hide search list if click is outside of search container
		hideOnOutsideClick(searchList, "#header-search", e);
		// Hide mobile search list if click is outside of mobile search container
		hideOnOutsideClick(mobileSearchList, ".mobile-search-container", e);
	});

	// copy data-link attribute to clipboard on click of share button
	document.addEventListener("click", (e) => {
		// if share button is clicked
		if (e.target.classList.contains("share-search-button") || e.target.classList.contains("share-query-button") || e.target.classList.contains("share-mobile-query-button") ) {
			// get the site link
			const siteLink = window.location.origin;
			// get the link
			const link = e.target.dataset.link;
			// copy the link to clipboard
			navigator.clipboard.writeText(siteLink + link);
			// show copied text
			e.target.innerHTML = "copied";
			// revert text back to share after 1 seconds
			setTimeout(() => {
				e.target.innerHTML = "share";
			}, 1000);
		}
	});

	/** WISHLIST **/

	// function to get wishlist count from localstorage and set it to wishlist count element
	function getWishlistCount() {
		// get the wishlist count element
		const wishlistCountEl = document.getElementById("wishlist-total");
		const wishlistCountMobileEl = document.getElementById("wishlist-total-mobile");
		// get the count
		let count = parseInt(localStorage.getItem("motogp-store-wishlist-count") || 0);
		// set the count
		wishlistCountEl.innerHTML = count;
		wishlistCountMobileEl.innerHTML = count;
	}

	getWishlistCount();

	// click whishlist icon to add product to wishlist and increase count and store in localstorage
	document.addEventListener("click", (e) => {
		const wishlistIcon = e.target.closest(".product-wishlist");
		if (!wishlistIcon) {
			return; // Exit if the clicked element is not a wishlist icon
		}
	
		const isDisabled = wishlistIcon.classList.contains("disabled");
		const wishlistCountEl = document.getElementById("wishlist-total");
		const wishlistCountMobileEl = document.getElementById("wishlist-total-mobile");
		let count = parseInt(localStorage.getItem("motogp-store-wishlist-count") || 0);
	
		// Update count and icon based on current state
		if (isDisabled) {
			wishlistIcon.querySelector("img").src = "images/icon-heart.png";
			count = Math.max(0, count - 1); // Ensure count doesn't go below zero
		} else {
			wishlistIcon.querySelector("img").src = "images/icon-heart-filled.webp";
			count += 1;
		}
	
		// Update UI and localStorage
		wishlistCountEl.innerHTML = count;
		wishlistCountMobileEl.innerHTML = count;
		localStorage.setItem("motogp-store-wishlist-count", count);
	
		// Toggle disabled state
		wishlistIcon.classList.toggle("disabled");
	});
	
	/** BACK TO TOP **/

	// show back top top button when scrolled down
	window.addEventListener("scroll", () => {
		// get the back to top button
		const backToTopEl = document.getElementById("back-to-top");
		// if back to top button exists
		if (backToTopEl) {
			// if scrolled down
			if (window.scrollY > 100) {
				// show back to top button
				backToTopEl.classList.add("show");
			} else {
				// hide back to top button
				backToTopEl.classList.remove("show");
			}
		}
	});

	// smooth scroll back to top and make back to top button invisible when reaching top of page
	document.getElementById("back-to-top").addEventListener("click", () => {
		window.scrollTo({
			top: 0,
			behavior: "smooth"
		});
	});
});