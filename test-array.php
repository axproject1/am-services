<?php
$itemsRaw = [
    ['cantidad' => 1, 'precio_unitario' => 300, 'descripcion' => 'test']
];
$datosGen['items'] = $itemsRaw;
foreach ($datosGen['items'] as &$item) {
    $item['total'] = (float)($item['cantidad'] ?? 0) * (float)($item['precio_unitario'] ?? 0);
}
unset($item);

var_dump($datosGen['items']);
