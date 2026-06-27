<?php

class SessionService
{
    public function createSessionId()
    {
        return session_id();
    }

    public function getSessionLifetimeMinutes()
    {
        return 60 * 8;
    }

    public function buildExpiresAt($minutes = null)
    {
        $minutes = $minutes ?? $this->getSessionLifetimeMinutes();
        return date('Y-m-d H:i:s', strtotime('+' . (int) $minutes . ' minutes'));
    }
}
