<?php

require_once "config/db.php";

if ($conn) {
    echo "CONEXIÓN OK";
} else {
    echo "ERROR DE CONEXIÓN";
}