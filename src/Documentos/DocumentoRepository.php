<?php
namespace App\Documentos;

use PDO;
use Exception;

class DocumentoRepository {
    private PDO $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function guardar(array $datos, array $items): int {
        try {
            $this->db->beginTransaction();

            $sql = "INSERT INTO documentos (
                tipo, numero, fecha, valida_hasta, cliente_id, cliente_nombre_manual,
                usuario_id, usar_empresa, incluir_itbms, itbms_porcentaje,
                incluir_mano_obra, mano_obra_monto, subtotal_equipos, subtotal_materiales,
                subtotal_neto, itbms_monto, total_general, abono_porcentaje, abono_base,
                seccion_titulo, emisor, emisor_cargo, responsable, responsable_cargo, incluir_firmas, terminos, estado
            ) VALUES (
                :tipo, :numero, :fecha, :valida_hasta, :cliente_id, :cliente_nombre_manual,
                :usuario_id, :usar_empresa, :incluir_itbms, :itbms_porcentaje,
                :incluir_mano_obra, :mano_obra_monto, :subtotal_equipos, :subtotal_materiales,
                :subtotal_neto, :itbms_monto, :total_general, :abono_porcentaje, :abono_base,
                :seccion_titulo, :emisor, :emisor_cargo, :responsable, :responsable_cargo, :incluir_firmas, :terminos, :estado
            )";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':tipo'                  => $datos['tipo'],
                ':numero'                => $datos['numero'],
                ':fecha'                 => $datos['fecha'],
                ':valida_hasta'          => $datos['valida_hasta'] ?: null,
                ':cliente_id'            => !empty($datos['cliente_id']) ? $datos['cliente_id'] : null,
                ':cliente_nombre_manual' => $datos['cliente_nombre_manual'] ?? null,
                ':usuario_id'            => $datos['usuario_id'],
                ':usar_empresa'          => $datos['usar_empresa'] ? 1 : 0,
                ':incluir_itbms'         => $datos['incluir_itbms'] ? 1 : 0,
                ':itbms_porcentaje'      => $datos['itbms_porcentaje'],
                ':incluir_mano_obra'     => $datos['incluir_mano_obra'] ? 1 : 0,
                ':mano_obra_monto'       => $datos['mano_obra_monto'],
                ':subtotal_equipos'      => $datos['subtotal_equipos'],
                ':subtotal_materiales'   => $datos['subtotal_materiales'],
                ':subtotal_neto'         => $datos['subtotal_neto'],
                ':itbms_monto'           => $datos['itbms_monto'],
                ':total_general'         => $datos['total_general'],
                ':abono_porcentaje'      => $datos['abono_porcentaje'] ?? 0,
                ':abono_base'            => $datos['abono_base'] ?? 'total',
                ':seccion_titulo'        => $datos['seccion_titulo'] ?? '',
                ':emisor'                => $datos['emisor'] ?? '',
                ':emisor_cargo'          => $datos['emisor_cargo'] ?? '',
                ':responsable'           => $datos['responsable'] ?? '',
                ':responsable_cargo'     => $datos['responsable_cargo'] ?? '',
                ':incluir_firmas'        => $datos['incluir_firmas'] ? 1 : 0,
                ':terminos'              => json_encode($datos['terminos']),
                ':estado'                => 'borrador',
            ]);

            $documentoId = (int)$this->db->lastInsertId();

            $sqlItem   = "INSERT INTO documento_items (
                documento_id, categoria, cantidad, descripcion, precio_unitario, total, orden
            ) VALUES (
                :documento_id, :categoria, :cantidad, :descripcion, :precio_unitario, :total, :orden
            )";
            $stmtItem  = $this->db->prepare($sqlItem);

            foreach ($items as $index => $item) {
                $cantidad       = (float)($item['cantidad']       ?? 0);
                $precioUnitario = (float)($item['precio_unitario'] ?? 0);
                $stmtItem->execute([
                    ':documento_id'   => $documentoId,
                    ':categoria'      => $item['categoria'] ?? 'material',
                    ':cantidad'       => $item['cantidad'],
                    ':descripcion'    => $item['descripcion'],
                    ':precio_unitario'=> $precioUnitario,
                    ':total'          => $cantidad * $precioUnitario,
                    ':orden'          => $index,
                ]);
            }

            $this->db->commit();
            return $documentoId;

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function obtenerPorId(int $id): ?array {
        $stmt = $this->db->prepare("SELECT * FROM documentos WHERE id = ?");
        $stmt->execute([$id]);
        $doc  = $stmt->fetch();
        if ($doc && !empty($doc['terminos'])) {
            $doc['terminos'] = json_decode($doc['terminos'], true) ?: [];
        }
        return $doc ?: null;
    }

    public function obtenerItems(int $documentoId): array {
        $stmt = $this->db->prepare("SELECT * FROM documento_items WHERE documento_id = ? ORDER BY orden ASC");
        $stmt->execute([$documentoId]);
        return $stmt->fetchAll();
    }

    public function actualizar(int $id, array $datos, array $items): void {
        try {
            $this->db->beginTransaction();

            $sql = "UPDATE documentos SET
                tipo = :tipo, fecha = :fecha, valida_hasta = :valida_hasta,
                cliente_id = :cliente_id, cliente_nombre_manual = :cliente_nombre_manual,
                usar_empresa = :usar_empresa, incluir_itbms = :incluir_itbms,
                itbms_porcentaje = :itbms_porcentaje, incluir_mano_obra = :incluir_mano_obra,
                mano_obra_monto = :mano_obra_monto, subtotal_equipos = :subtotal_equipos,
                subtotal_materiales = :subtotal_materiales, subtotal_neto = :subtotal_neto,
                itbms_monto = :itbms_monto, total_general = :total_general,
                abono_porcentaje = :abono_porcentaje, abono_base = :abono_base, seccion_titulo = :seccion_titulo,
                emisor = :emisor, emisor_cargo = :emisor_cargo,
                responsable = :responsable, responsable_cargo = :responsable_cargo, incluir_firmas = :incluir_firmas,
                terminos = :terminos
                WHERE id = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                ':tipo'                  => $datos['tipo'],
                ':fecha'                 => $datos['fecha'],
                ':valida_hasta'          => $datos['valida_hasta'] ?: null,
                ':cliente_id'            => !empty($datos['cliente_id']) ? $datos['cliente_id'] : null,
                ':cliente_nombre_manual' => $datos['cliente_nombre_manual'] ?? null,
                ':usar_empresa'          => $datos['usar_empresa'] ? 1 : 0,
                ':incluir_itbms'         => $datos['incluir_itbms'] ? 1 : 0,
                ':itbms_porcentaje'      => $datos['itbms_porcentaje'],
                ':incluir_mano_obra'     => $datos['incluir_mano_obra'] ? 1 : 0,
                ':mano_obra_monto'       => $datos['mano_obra_monto'],
                ':subtotal_equipos'      => $datos['subtotal_equipos'],
                ':subtotal_materiales'   => $datos['subtotal_materiales'],
                ':subtotal_neto'         => $datos['subtotal_neto'],
                ':itbms_monto'           => $datos['itbms_monto'],
                ':total_general'         => $datos['total_general'],
                ':abono_porcentaje'      => $datos['abono_porcentaje'] ?? 0,
                ':abono_base'            => $datos['abono_base'] ?? 'total',
                ':seccion_titulo'        => $datos['seccion_titulo'] ?? '',
                ':emisor'                => $datos['emisor'] ?? '',
                ':emisor_cargo'          => $datos['emisor_cargo'] ?? '',
                ':responsable'           => $datos['responsable'] ?? '',
                ':responsable_cargo'     => $datos['responsable_cargo'] ?? '',
                ':incluir_firmas'        => $datos['incluir_firmas'] ? 1 : 0,
                ':terminos'              => json_encode($datos['terminos']),
                ':id'                    => $id,
            ]);

            // Eliminar ítems antiguos y reinsertarlos
            $this->db->prepare("DELETE FROM documento_items WHERE documento_id = ?")->execute([$id]);

            $sqlItem  = "INSERT INTO documento_items (
                documento_id, categoria, cantidad, descripcion, precio_unitario, total, orden
            ) VALUES (
                :documento_id, :categoria, :cantidad, :descripcion, :precio_unitario, :total, :orden
            )";
            $stmtItem = $this->db->prepare($sqlItem);

            foreach ($items as $index => $item) {
                $cantidad       = (float)($item['cantidad']       ?? 0);
                $precioUnitario = (float)($item['precio_unitario'] ?? 0);
                $stmtItem->execute([
                    ':documento_id'    => $id,
                    ':categoria'       => $item['categoria'] ?? 'material',
                    ':cantidad'        => $item['cantidad'],
                    ':descripcion'     => $item['descripcion'],
                    ':precio_unitario' => $precioUnitario,
                    ':total'           => $cantidad * $precioUnitario,
                    ':orden'           => $index,
                ]);
            }

            $this->db->commit();

        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function eliminar(int $id): void {
        $this->db->prepare("DELETE FROM documentos WHERE id = ?")->execute([$id]);
    }

    public function cambiarEstado(int $id, string $estado): void {
        $permitidos = ['borrador', 'enviado', 'aceptado', 'rechazado'];
        if (!in_array($estado, $permitidos)) {
            throw new \InvalidArgumentException("Estado inválido: $estado");
        }
        $this->db->prepare("UPDATE documentos SET estado = ? WHERE id = ?")->execute([$estado, $id]);
    }

    public function obtenerRecientes(int $limite = 10): array {
        $stmt = $this->db->prepare("
            SELECT d.*, c.nombre AS cliente_db_nombre
            FROM documentos d
            LEFT JOIN clientes c ON d.cliente_id = c.id
            ORDER BY d.creado_en DESC
            LIMIT ?
        ");
        $stmt->execute([$limite]);
        return $stmt->fetchAll();
    }
}
