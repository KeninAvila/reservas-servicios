<?php

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/../vendor/autoload.php';
require_once __DIR__ . '/../config/app.php';

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

class EmailService
{
    public function sendVerificationEmail($email, $name, $token)
    {
        $link = FRONTEND_URL . '/#/verificar?token=' . urlencode($token);

        return $this->sendActionEmail(
            $email,
            $name,
            'Verifica tu cuenta',
            'Gracias por registrarte. Confirma tu correo electrónico para activar tu cuenta.',
            'Confirmar cuenta',
            $link,
            'Este enlace expira en 24 horas.'
        );
    }

    public function sendResetPasswordEmail($email, $name, $token)
    {
        $link = FRONTEND_URL . '/#/cambiar-contrasena?token=' . urlencode($token);

        return $this->sendActionEmail(
            $email,
            $name,
            'Recuperación de contraseña',
            'Recibimos una solicitud para cambiar la contraseña de tu cuenta.',
            'Cambiar contraseña',
            $link,
            'Este enlace expira en 1 hora. Si no solicitaste el cambio, puedes ignorar este correo.'
        );
    }

    private function sendActionEmail($email, $name, $subject, $message, $buttonText, $link, $footer)
    {
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
            $mail->CharSet = 'UTF-8';

            $mail->setFrom($smtpFrom, $smtpName);
            $mail->addAddress($email, $name);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $this->buildEmailTemplate($name, $message, $buttonText, $link, $footer);
            $mail->AltBody = "Hola {$name}. {$message} {$link} {$footer}";

            return $mail->send();
        } catch (Exception $e) {
            error_log('Email error: ' . $mail->ErrorInfo);
            return false;
        }
    }

    private function buildEmailTemplate($name, $message, $buttonText, $link, $footer)
    {
        $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $safeLink = htmlspecialchars($link, ENT_QUOTES, 'UTF-8');

        return "<!doctype html>
        <html lang='es'>
        <body style='margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#1e293b;'>
          <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='background:#f1f5f9;padding:32px 16px;'>
            <tr><td align='center'>
              <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='max-width:560px;background:#fff;border-radius:16px;padding:36px;'>
                <tr><td>
                  <div style='font-size:20px;font-weight:700;color:#4f46e5;margin-bottom:28px;'>Reservas Servicios</div>
                  <h1 style='font-size:24px;margin:0 0 16px;color:#0f172a;'>Hola {$safeName}</h1>
                  <p style='font-size:16px;line-height:1.6;margin:0 0 28px;color:#475569;'>{$message}</p>
                  <a href='{$safeLink}' style='display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;font-size:16px;font-weight:700;padding:14px 24px;border-radius:10px;'>{$buttonText}</a>
                  <p style='font-size:13px;line-height:1.5;margin:28px 0 0;color:#64748b;'>{$footer}</p>
                  <p style='font-size:12px;line-height:1.5;margin:18px 0 0;color:#94a3b8;word-break:break-all;'>Si el botón no funciona, copia este enlace:<br>{$safeLink}</p>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>";
    }
}
