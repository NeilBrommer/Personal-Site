var theme = window.localStorage.getItem("theme");
if (theme != null && theme == "true")
	$("body").addClass("dark-mode");

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
	$(".card").addClass("transition");
	$(".jumbotron").addClass("transition");
	$(".form-control").addClass("transition");
	$("a:not(.navbar-brand):not(.nav-link)").addClass("transition");
	$("body").addClass("transition dark-mode");

	setTimeout(endTransition, 250);

	$("#btnTheme").removeClass("btn-dark").addClass("transition btn-light");
	$("#themeText").replaceWith($("<span>").attr("id", "themeText").addClass("fas fa-sun"));

	window.localStorage.setItem("theme", "true");
}

function transitionLight() {
	$(".card").addClass("transition");
	$(".jumbotron").addClass("transition");
	$(".form-control").addClass("transition");
	$("a:not(.navbar-brand):not(.nav-link)").addClass("transition");
	$("body").addClass("transition").removeClass("dark-mode");

	setTimeout(endTransition, 250);

	$("#btnTheme").removeClass("btn-light").addClass("transition btn-dark");
	$("#themeText").replaceWith($("<span>").attr("id", "themeText").addClass("fas fa-moon"));

	window.localStorage.setItem("theme", "false");
}

function endTransition() {
	$("body").removeClass("transition");
	$(".card").removeClass("transition");
	$(".jumbotron").removeClass("transition");
	$("a:not(.navbar-brand):not(.nav-link)").removeClass("transition");
	$(".form-control").removeClass("transition");
}

function setDark() {
	$("body").addClass("dark-mode");

	$("#btnTheme").removeClass("btn-dark").addClass("btn-light");
	$("#themeText").replaceWith($("<span>").attr("id", "themeText").addClass("fas fa-sun"));
}
