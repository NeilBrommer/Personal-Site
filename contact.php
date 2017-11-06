<?php
// on bluehost only
ini_set("include_path", '/home2/neilbrom/php:' . ini_get("include_path") );

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'PHPMailer/Exception.php';
require 'PHPMailer/PHPMailer.php';
require 'PHPMailer/SMTP.php';

include_once "info.php";

if ($_SERVER["REQUEST_METHOD"] == 'POST') {
	if (isset($_POST["captcha"]) && !empty($_POST["captcha"])) {

		$captcha = $_POST["captcha"];
		$url = "https://www.google.com/recaptcha/api/siteverify";
		$data = array(
			"secret" => $recaptchaSecret,
			"response" => $captcha,
			"remoteip" => $_SERVER["REMOTE_ADDR"]
		);
		$options = array(
			"http" => array(
				"header" => "Content-Type: application/x-www-form-urlencoded\r\n",
				"method" => "POST",
				"content" => http_build_query($data)
			)
		);
		$context = stream_context_create($options);
		$result = file_get_contents($url, false, $context);
		if ($result === false) {
			http_response_code(500);
			die("Error verifying reCAPTCHA");
		}
		$result = json_decode($result, true);

		if ($result["success"] == false) {
			http_response_code(400);
			die("Could not verify reCAPTCHA");
		}


		if (!isset($_POST["name"])) {
			http_response_code(400);
			die("A name is required");
		}
		$name = trim($_POST["name"]);
		if ($name == '') {
			http_response_code(400);
			die("The name cannot be empty");
		} else if (strtolower($name) == 'anon' || strToLower($name) == 'anonymous') {
			http_response_code(400);
			die("Enter a real name");
		}

		if (!isset($_POST["email"])) {
			http_response_code(400);
			die("An email address is required");
		}
		$email = trim($_POST["email"]);
		if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
			http_response_code(400);
			die("Invalid email address");
		}

		$subject = "Message from contact form";
		if (isset($_POST["subject"]) && trim($_POST["subject"]) != "") {
			$subject = $subject . ": " . $_POST["subject"];
		}

		if (!isset($_POST["message"])) {
			http_response_code(400);
			die("A message is required");
		}
		$message = trim($_POST["message"]);
		if ($message == '') {
			http_response_code(400);
			die("A message is required");
		}
		$message = $name . ' -- &lt;' . $email . '&gt;<hr>' . $message;

		$mail = new PHPMailer(true); // true enables exceptions
		try {
			$mail->isSMTP();
			//$mail->SMTPDebug = 3;
			$mail->Host = $mailHost;
			$mail->SMTPAuth = true;
			$mail->Username = $mailUser;
			$mail->Password = $mailPass;
			$mail->SMTPSecure = 'ssl';
			$mail->Port = $mailPort;

			$mail->setFrom($mailFrom, 'Website Contact Form');
			$mail->addAddress($mailDest);
			$mail->addReplyTo($email);

			$mail->isHTML(true);
			$mail->Subject = $subject;
			$mail->Body = $message;

			$mail->Send();
		} catch (Exception $e) {
			http_response_code(500);
			echo 'Message could not be sent.';
			echo 'Mailer Error: ' . $mail->ErrorInfo;
		}
	} else { // no recaptcha
		http_response_code(400);
		echo "Bad reCAPTCHA";
	}
} else {
	http_response_code(404);
}
?>
