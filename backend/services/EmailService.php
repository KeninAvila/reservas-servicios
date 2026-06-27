<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . "/../vendor/autoload.php";
require_once __DIR__ . "/../config/app.php";

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

class EmailService
{
    public function sendVerificationEmail($email, $name, $token)
    {
        $link = APP_URL . "/api/auth/verify.php?token=" . $token;

        $mail = new PHPMailer(true);

        try {
            $smtpHost = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
            $smtpPort = $_ENV['SMTP_PORT'] ?? 587;
            $smtpUser = $_ENV['SMTP_USER'] ?? '';
            $smtpPass = $_ENV['SMTP_PASS'] ?? '';
            $smtpFrom = $_ENV['SMTP_FROM'] ?? $smtpUser;
            $smtpName = $_ENV['SMTP_NAME'] ?? 'Reservas Servicios';

            // 🔧 CONFIG SMTP
            $mail->isSMTP();
            $mail->Host = $smtpHost;
            $mail->SMTPAuth = true;
            $mail->Username = $smtpUser;
            $mail->Password = $smtpPass;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $smtpPort;

            // DESTINATARIOS
            $mail->setFrom($smtpFrom, $smtpName);
            $mail->addAddress($email, $name);

            // CONTENIDO
            $mail->isHTML(true);
            $mail->Subject = 'Verifica tu cuenta';

            $mail->Body = "
                <h2>Hola $name</h2>
                <p>Gracias por registrarte.</p>
                <p>Haz clic para verificar tu cuenta:</p>
                <a href='$link'>Verificar cuenta</a>
                <p>Este enlace expira en 24 horas.</p>
            ";

            return $mail->send();
        } catch (Exception $e) {
            error_log("Email error: " . $mail->ErrorInfo);
            return false;
        }
    }

    public function sendResetPasswordEmail($email, $name, $token)
    {
        $link = APP_URL . "/api/auth/resetPassword.php?token=" . $token;

        $mail = new PHPMailer(true);

        try {
            $smtpHost = $_ENV['SMTP_HOST'] ?? 'smtp.gmail.com';
            $smtpPort = $_ENV['SMTP_PORT'] ?? 587;
            $smtpUser = $_ENV['SMTP_USER'] ?? '';
            $smtpPass = $_ENV['SMTP_PASS'] ?? '';
            $smtpFrom = $_ENV['SMTP_FROM'] ?? $smtpUser;
            $smtpName = $_ENV['SMTP_NAME'] ?? 'Reservas Servicios';

            $mail->isSMTP();
            $mail->Host = $smtpHost;
            $mail->SMTPAuth = true;
            $mail->Username = $smtpUser;
            $mail->Password = $smtpPass;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = $smtpPort;

            $mail->setFrom($smtpFrom, $smtpName);
            $mail->addAddress($email, $name);

            $mail->isHTML(true);
            $mail->Subject = "Recuperación de contraseña";

            $mail->Body = "
            <h3>Hola $name</h3>
            <p>Solicitaste recuperar tu contraseña.</p>
            <p>Haz clic aquí:</p>
            <a href='$link'>Restablecer contraseña</a>
            <p>Este enlace expira en 1 hora.</p>
        ";

            return $mail->send();
        } catch (Exception $e) {
            error_log("Email reset error: " . $e->getMessage());
            return false;
        }
    }
}
