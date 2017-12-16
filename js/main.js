var theme = window.localStorage.getItem("theme");
if (theme != null && theme == "true")
	$("body").addClass("bg-dark");

$(document).ready(function () {
	$("#btnTheme").click(function () {
		if ($("#btnTheme").hasClass("btn-light")) {
			transitionLight();
		} else {
			transitionDark();
		}
	});

	var theme = window.localStorage.getItem("theme");
	if (theme != null && theme == "true")
		setDark();
});

function checkTheme() {
	if (theme != null && theme == "true")
		setDark();
}

function transitionDark() {
	$("body").addClass("transition bg-dark text-white");
	$(".card").addClass("transition bg-dark text-white");
	$(".jumbotron").addClass("transition jumbo-dark text-white");
	$(".form-control").addClass("transition dark");
	$("a:not(.navbar-brand):not(.nav-link)").addClass("transition a-dark");

	setInterval(function () {
		$("a:not(.navbar-brand):not(.nav-link)").removeClass("transition");
		$(".form-control").removeClass("transition");
	}, 250);

	$("#btnTheme").removeClass("btn-dark").addClass("transition btn-light");
	$("#themeText").replaceWith($("<span>").attr("id", "themeText").addClass("fas fa-sun"));

	window.localStorage.setItem("theme", "true");
}

function transitionLight() {
	$("body").addClass("transition").removeClass("bg-dark text-white");
	$(".card").addClass("transition").removeClass("bg-dark text-white");
	$(".jumbotron").addClass("transition").removeClass("jumbo-dark text-white");
	$(".form-control").addClass("transition").removeClass("dark");
	$("a:not(.navbar-brand):not(.nav-link)").addClass("transition").removeClass("a-dark");

	setInterval(function () {
		$("a:not(.navbar-brand):not(.nav-link)").removeClass("transition");
		$(".form-control").removeClass("transition");
	}, 500);

	$("#btnTheme").removeClass("btn-light").addClass("transition btn-dark");
	$("#themeText").replaceWith($("<span>").attr("id", "themeText").addClass("fas fa-moon"));

	window.localStorage.setItem("theme", "false");
}

function setDark() {
	$("body").addClass("bg-dark text-white");
	$(".card").addClass("bg-dark text-white");
	$(".jumbotron").addClass("jumbo-dark text-white");
	$(".form-control").addClass("dark");
	$("a:not(.navbar-brand):not(.nav-link)").addClass("a-dark");

	$("#btnTheme").removeClass("btn-dark").addClass("btn-light");
	$("#themeText").replaceWith($("<span>").attr("id", "themeText").addClass("fas fa-sun"));
}
