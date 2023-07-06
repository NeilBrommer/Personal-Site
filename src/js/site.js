"use strict";

function dismissSidebarOnClick(event) {
	if (event.target.closest("header") == null && event.target.closest(".sidebar-toggle") == null) {
		event.stopPropagation();
		setSidebar(false);
	}
}

function setSidebar(isOpen) {
	let header = document.querySelector("header");

	// If isOpen isn't provided, then just toggle the sidebar
	if (isOpen == null) {
		let currentlyOpen = header.getAttribute("aria-hidden") == "false";
		isOpen = !currentlyOpen;
	}

	header.setAttribute("aria-hidden", (!isOpen).toString());

	if (isOpen) {
		document.querySelector("body")
			.addEventListener("click", dismissSidebarOnClick);
	} else {
		document.querySelector("body")
			.removeEventListener("click", dismissSidebarOnClick);
	}
}

// Make main page sections active on scroll

document.addEventListener("DOMContentLoaded", () => {
	const observer = new IntersectionObserver(entries => {
		entries.forEach(entry => {
			const id = entry.target.previousElementSibling.id;
			const menuListItem = document.querySelector(`nav li a[href="/#${id}"]`).parentElement;

			if (entry.intersectionRatio > 0) {
				menuListItem.classList.add("active");
			} else {
				menuListItem.classList.remove("active");
			}
		});
	});

	document.querySelectorAll("h1[id] + section, h2[id] + section, h3[id] + section, h4[id] + section, h5[id] + section, h6[id] + section")
		.forEach(section => observer.observe(section));
});
