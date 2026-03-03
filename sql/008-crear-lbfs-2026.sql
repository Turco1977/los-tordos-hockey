-- Crear LBFs 2026 por equipo con entrenadores del ORGANIGRAMA
-- Ejecutar DESPUÉS de haber importado las 243 jugadoras (007)
-- Cada LBF se crea como "aprobada" y se asignan las jugadoras correspondientes

DO $$
DECLARE
  v_user_id uuid;
  v_lbf_id uuid;
BEGIN
  -- Obtener el primer director deportivo como creador
  SELECT user_id INTO v_user_id FROM hockey_roles WHERE role = 'director_deportivo' AND active = true LIMIT 1;
  IF v_user_id IS NULL THEN
    SELECT user_id INTO v_user_id FROM hockey_roles WHERE active = true LIMIT 1;
  END IF;

  -- ═══════════════════════════════════════
  -- PRIMERA A (23 jugadoras) → Franco Medici
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Primera A', 'Primera', 'A', 2026, 'Franco Medici', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Primera' AND rama = 'A' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- PRIMERA B (20 jugadoras) → Juan Carballo
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Primera B', 'Primera', 'B', 2026, 'Juan Carballo', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Primera' AND rama = 'B' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- QUINTA A (15 jugadoras) → Franco Medici
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Quinta A', 'Quinta', 'A', 2026, 'Franco Medici', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Quinta' AND rama = 'A' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- QUINTA B (23 jugadoras) → Juan Carballo
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Quinta B', 'Quinta', 'B', 2026, 'Juan Carballo', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Quinta' AND rama = 'B' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- QUINTA C (17 jugadoras) → Valentina Neira
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Quinta C', 'Quinta', 'C', 2026, 'Valentina Neira', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Quinta' AND rama = 'C' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- QUINTA D (17 jugadoras) → Tamara Tejada
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Quinta D', 'Quinta', 'D', 2026, 'Tamara Tejada', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Quinta' AND rama = 'D' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- QUINTA E (12 jugadoras) → Milagros Baztan
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Quinta E', 'Quinta', 'E', 2026, 'Milagros Baztan', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Quinta' AND rama = 'E' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- SEXTA A (18 jugadoras) → Juan Ignacio González
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Sexta A', 'Sexta', 'A', 2026, 'Juan Ignacio González', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Sexta' AND rama = 'A' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- SEXTA B (18 jugadoras) → Juan López
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Sexta B', 'Sexta', 'B', 2026, 'Juan López', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Sexta' AND rama = 'B' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- SEXTA C (12 jugadoras) → Agustín Rubiño
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Sexta C', 'Sexta', 'C', 2026, 'Agustín Rubiño', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Sexta' AND rama = 'C' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- SEXTA D (16 jugadoras) → Tamara Tejada
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Sexta D', 'Sexta', 'D', 2026, 'Tamara Tejada', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Sexta' AND rama = 'D' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- SÉPTIMA A (19 jugadoras) → Laureano Muslera
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Séptima A', 'Séptima', 'A', 2026, 'Laureano Muslera', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Séptima' AND rama = 'A' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- SÉPTIMA C (13 jugadoras) → Facundo Paredes
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Séptima C', 'Séptima', 'C', 2026, 'Facundo Paredes', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Séptima' AND rama = 'C' AND temporada = '2026';

  -- ═══════════════════════════════════════
  -- SÉPTIMA D (20 jugadoras) → Juan Andrés Famiglietti
  -- ═══════════════════════════════════════
  INSERT INTO lbf (nombre, division, rama, ano, entrenadora, estado, creado_por)
  VALUES ('LBF 2026 - Séptima D', 'Séptima', 'D', 2026, 'Juan Andrés Famiglietti', 'aprobada', v_user_id)
  RETURNING id INTO v_lbf_id;

  INSERT INTO lbf_jugadoras (lbf_id, jugadora_id, titular, orden)
  SELECT v_lbf_id, id, true, row_number() OVER (ORDER BY apellido, nombre)
  FROM jugadoras WHERE division_manual = 'Séptima' AND rama = 'D' AND temporada = '2026';

  RAISE NOTICE '14 LBFs creadas con % jugadoras asignadas', (SELECT count(*) FROM lbf_jugadoras WHERE lbf_id IN (SELECT id FROM lbf WHERE ano = 2026));
END $$;
