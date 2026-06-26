<?php

$host = "localhost";
$user = "root";
$password = "";
$database = "reservas_servicios";

date_default_timezone_set('America/Guayaquil');

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    die(json_encode([
        "success" => false,
        "message" => "Error de conexión a la base de datos"
    ]));
}

$conn->set_charset("utf8mb4");