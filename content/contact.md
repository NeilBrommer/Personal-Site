+++
title = "Contact"
date = 2018-05-12T11:58:21-07:00
draft = false
[menu]
	[menu.main]
	weight = -70
+++

<div id="successAlert" class="alert alert-success" role="alert" style="display: none;">Message sent successfully!</div>
<div id="errorAlert" class="alert alert-danger" role="alert" style="display: none"></div>

<form id="contactForm" class="jumbotron border rounded p-1 p-sm-4">
	<div class="form-group">
		<label for="nameField">Name
			<span class="required">*</span>
		</label>
		<input id="nameField" type="text" required="required" class="form-control">
	</div>
	<div class="form-group">
		<label for="emailField">Email Address
			<span class="required">*</span>
		</label>
		<input id="emailField" type="email" required="required" class="form-control">
	</div>
	<div class="form-group">
		<label for="subjectField">Subject</label>
		<input id="subjectField" type="text" class="form-control">
	</div>
	<div class="form-group">
		<label for="messageField">Message
			<span class="required">*</span>
		</label>
		<textarea id="messageField" rows="5" required="required" class="form-control"></textarea>
	</div>
	<div class="form-group captcha">
		<div class="g-recaptcha" data-sitekey="6LfFATcUAAAAAJ_YZ3qvYWqrtOUHmCItq-azzV3x"></div>
	</div>
	<button id="contactSubmit" type="submit" class="btn btn-primary">Submit</button>
</form>


<script src='https://www.google.com/recaptcha/api.js'></script>
<script src="/js/contact.js"></script>
