<?php

class Response {

    public static function success($message, $data = []) {
        echo json_encode([
            "success" => true,
            "message" => $message,
            "data" => $data
        ]);
        exit;
    }

    public static function error($message, $data = []) {
        echo json_encode([
            "success" => false,
            "message" => $message,
            "errors" => $data
        ]);
        exit;
    }
}