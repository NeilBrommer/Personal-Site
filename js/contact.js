$(document).ready(function() {
	$("#contactForm").on("submit", sendForm);
});

function sendForm(e) {
	e.preventDefault(); // prevent the page from refreshing

	$("#contactSubmit").prop("disabled", true);

	if ($("#successAlert")[0].style.display != 'none') {
		$("#successAlert").slideUp(250);
	}
	if ($("#errorAlert")[0].style.display != 'none') {
		$("#errorAlert").slideUp(250);
	}

	var captcha = grecaptcha.getResponse();
	if (captcha.length == 0) {
		$(".captcha").addClass("invalid-captcha");
	} else {
		$(".captcha").removeClass("invalid-captcha");

		var name = $("#nameField").val();
		var email = $("#emailField").val();
		var subject = $("#subjectField").val();
		var message = $("#messageField").val();

		$.ajax({
			url: "contact.php",
			type: "POST",
			data: {
				"name": name,
				"email": email,
				"subject": subject,
				"message": message,
				"captcha": captcha
			},
			success: messageSuccess,
			error: messageError,
			complete: doneSending
		});
	}
}

function messageSuccess(result) {
	$("#successAlert").slideDown(500);
}

function messageError(result) {
	var alert = $("#errorAlert");
	alert.empty();
	$(document.createTextNode("Error: " + result.responseText)).appendTo(alert);
	alert.slideDown(500);
}

function doneSending() {
	var html = $("html");
	var top = html.scrollTop() + $("body").scrollTop() // Get position of the body

	if(top != 0) {
		$("html,body").animate({scrollTop:0}, '500');
	}

	$("#contactSubmit").prop("disabled", false);
}
