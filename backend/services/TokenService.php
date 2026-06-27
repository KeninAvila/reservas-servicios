<?php

class TokenService
{
    public function generateToken()
    {
        return bin2hex(random_bytes(32));
    }

    public function generateExpiration($minutes)
    {
        return date('Y-m-d H:i:s', strtotime('+' . (int) $minutes . ' minutes'));
    }

    public function isExpired($datetime)
    {
        if (empty($datetime)) {
            return true;
        }

        return strtotime($datetime) < time();
    }
}
