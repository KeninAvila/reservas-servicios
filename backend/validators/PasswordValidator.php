<?php

class PasswordValidator
{
    public static function validateEmail($email)
    {
        if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return [
                "success" => false,
                "message" => "El correo electrónico no es válido."
            ];
        }

        return ["success" => true];
    }

    public static function validateResetRequest($data)
    {
        $email = trim($data['email'] ?? '');

        if ($email === '') {
            return [
                "success" => false,
                "message" => "El correo electrónico es obligatorio."
            ];
        }

        return self::validateEmail($email);
    }

    public static function validateResetPassword($data)
    {
        $token = trim($data['token'] ?? '');
        $password = $data['password'] ?? '';
        $confirmPassword = $data['confirmPassword'] ?? '';

        if ($token === '') {
            return [
                "success" => false,
                "message" => "El token es obligatorio."
            ];
        }

        if ($password === '') {
            return [
                "success" => false,
                "message" => "La contraseña es obligatoria."
            ];
        }

        if ($confirmPassword === '') {
            return [
                "success" => false,
                "message" => "La confirmación de contraseña es obligatoria."
            ];
        }

        if ($password !== $confirmPassword) {
            return [
                "success" => false,
                "message" => "Las contraseñas no coinciden."
            ];
        }

        if (strlen($password) < 8) {
            return [
                "success" => false,
                "message" => "La contraseña debe tener al menos 8 caracteres."
            ];
        }

        if (!preg_match('/[A-Z]/', $password)) {
            return [
                "success" => false,
                "message" => "La contraseña debe incluir al menos una letra mayúscula."
            ];
        }

        if (!preg_match('/[a-z]/', $password)) {
            return [
                "success" => false,
                "message" => "La contraseña debe incluir al menos una letra minúscula."
            ];
        }

        if (!preg_match('/[0-9]/', $password)) {
            return [
                "success" => false,
                "message" => "La contraseña debe incluir al menos un número."
            ];
        }

        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            return [
                "success" => false,
                "message" => "La contraseña debe incluir al menos un carácter especial."
            ];
        }

        return ["success" => true];
    }
}
