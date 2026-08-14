-- Legal Nea Soft — Seed: especialidades legales + 40 abogados demo
-- Ejecutar DESPUÉS de la migración 0001_schema.sql

-- ============================================================
-- ESPECIALIDADES PRIORITARIAS (Comisión Pro Bono)
-- ============================================================
insert into especialidades (nombre, categoria) values
  ('Transparencia y Acceso a la Información Pública', 'prioritaria_probono'),
  ('Derechos de Niñas, Niños y Adolescentes', 'prioritaria_probono'),
  ('Derecho a la Salud', 'prioritaria_probono'),
  ('Microfinanzas y Emprendedurismo', 'prioritaria_probono'),
  ('Acceso a la Justicia', 'prioritaria_probono'),
  ('Inclusión Social', 'prioritaria_probono')
on conflict (nombre) do nothing;

-- ============================================================
-- ESPECIALIDADES GENERALES
-- ============================================================
insert into especialidades (nombre, categoria) values
  ('Derecho Civil', 'general'),
  ('Derecho de Familia', 'general'),
  ('Derecho Penal', 'general'),
  ('Derecho Laboral', 'general'),
  ('Derecho Comercial y Societario', 'general'),
  ('Derecho Administrativo', 'general'),
  ('Derecho Tributario y Fiscal', 'general'),
  ('Derecho Previsional (Jubilaciones y Pensiones)', 'general'),
  ('Derecho Inmobiliario', 'general'),
  ('Derecho Sucesorio', 'general'),
  ('Defensa del Consumidor', 'general'),
  ('Derecho Ambiental', 'general'),
  ('Propiedad Intelectual (Marcas y Patentes)', 'general'),
  ('Derecho Migratorio y de Extranjería', 'general'),
  ('Derecho de la Discapacidad', 'general'),
  ('Género y Violencia Familiar/de Género', 'general'),
  ('Derechos Humanos', 'general'),
  ('Derecho Concursal y Quiebras', 'general'),
  ('Derecho Bancario y Financiero', 'general'),
  ('Derecho de Seguros', 'general'),
  ('Derecho Aduanero y Comercio Exterior', 'general'),
  ('Derecho Agrario y Rural', 'general'),
  ('Derecho Minero y Energético', 'general'),
  ('Arbitraje y Mediación', 'general'),
  ('Derecho Informático y Protección de Datos Personales', 'general'),
  ('Derecho Municipal y Contravencional', 'general'),
  ('Derecho Electoral', 'general'),
  ('Derecho Deportivo', 'general'),
  ('Derechos de Pueblos Originarios', 'general')
on conflict (nombre) do nothing;

-- ============================================================
-- 40 ABOGADOS DEMO (estado = aprobado)
-- Emails ficticios @ejemplo-legalnea.com, celulares ficticios formato +54 9 <cod area> <numero>
-- ============================================================
with abogados_demo (
  nombre_completo, provincia, localidad, especialidad_nombre,
  matricula_federal, matricula_provincial, fecha_alta, email, telefono
) as (
  values
  ('Mateo Facundo Gómez', 'Corrientes', 'Corrientes', 'Derecho Civil', 'CPACF T°10 F°15', 'Col. Ab. Corrientes T°1 F°10', '2022-01-10'::date, 'mateo.facundo.gomez@ejemplo-legalnea.com', '+54 9 379 4001001'),
  ('Sofía Belén Martínez', 'Corrientes', 'Goya', 'Derecho de Familia', 'CPACF T°11 F°20', 'Col. Ab. Corrientes T°2 F°15', '2022-01-25'::date, 'sofia.belen.martinez@ejemplo-legalnea.com', '+54 9 3777 402002'),
  ('Tomás Ezequiel López', 'Chaco', 'Resistencia', 'Derecho Penal', 'CPACF T°12 F°25', 'Col. Ab. Chaco T°1 F°8', '2022-02-05'::date, 'tomas.ezequiel.lopez@ejemplo-legalnea.com', '+54 9 362 4003003'),
  ('Valentina Aylén Fernández', 'Misiones', 'Posadas', 'Derecho Laboral', 'CPACF T°13 F°30', 'Col. Ab. Misiones T°1 F°9', '2022-02-18'::date, 'valentina.aylen.fernandez@ejemplo-legalnea.com', '+54 9 376 4004004'),
  ('Santiago Nicolás Díaz', 'CABA', 'CABA', 'Derecho Comercial y Societario', 'CPACF T°14 F°35', '—', '2022-03-01'::date, 'santiago.nicolas.diaz@ejemplo-legalnea.com', '+54 9 11 40050050'),
  ('Camila Ailén Rodríguez', 'Buenos Aires', 'La Plata', 'Derecho Administrativo', 'CPACF T°15 F°40', 'CASI T°10 F°55', '2022-03-15'::date, 'camila.ailen.rodriguez@ejemplo-legalnea.com', '+54 9 221 4006006'),
  ('Joaquín Alejandro Sosa', 'Corrientes', 'Mercedes', 'Acceso a la Justicia', 'CPACF T°16 F°45', 'Col. Ab. Corrientes T°3 F°22', '2022-03-28'::date, 'joaquin.alejandro.sosa@ejemplo-legalnea.com', '+54 9 3773 407007'),
  ('Martina Abril Torres', 'Corrientes', 'Curuzú Cuatiá', 'Derecho a la Salud', 'CPACF T°17 F°50', 'Col. Ab. Corrientes T°4 F°30', '2022-04-10'::date, 'martina.abril.torres@ejemplo-legalnea.com', '+54 9 3774 408008'),
  ('Lucas Agustín Benítez', 'Chaco', 'Sáenz Peña', 'Derecho Tributario y Fiscal', 'CPACF T°18 F°55', 'Col. Ab. Chaco T°2 F°17', '2022-04-22'::date, 'lucas.agustin.benitez@ejemplo-legalnea.com', '+54 9 3732 409009'),
  ('Julieta Milagros Acosta', 'Formosa', 'Formosa', 'Derechos de Niñas, Niños y Adolescentes', 'CPACF T°19 F°60', 'Col. Ab. Formosa T°1 F°6', '2022-05-05'::date, 'julieta.milagros.acosta@ejemplo-legalnea.com', '+54 9 370 4010010'),
  ('Nicolás Ignacio Herrera', 'Santa Fe', 'Rosario', 'Derecho Previsional (Jubilaciones y Pensiones)', 'CPACF T°20 F°65', 'Col. Ab. Rosario T°5 F°40', '2022-05-19'::date, 'nicolas.ignacio.herrera@ejemplo-legalnea.com', '+54 9 341 4011011'),
  ('Emilia Guadalupe Romero', 'Córdoba', 'Córdoba', 'Derecho Inmobiliario', 'CPACF T°21 F°70', 'Col. Ab. Córdoba T°6 F°48', '2022-06-02'::date, 'emilia.guadalupe.romero@ejemplo-legalnea.com', '+54 9 351 4012012'),
  ('Benjamín Tomás Flores', 'Entre Ríos', 'Paraná', 'Derecho Sucesorio', 'CPACF T°22 F°75', 'Col. Ab. Entre Ríos T°2 F°14', '2022-06-15'::date, 'benjamin.tomas.flores@ejemplo-legalnea.com', '+54 9 343 4013013'),
  ('Isabella Morena Suárez', 'Corrientes', 'Corrientes', 'Microfinanzas y Emprendedurismo', 'CPACF T°23 F°80', 'Col. Ab. Corrientes T°5 F°35', '2022-06-28'::date, 'isabella.morena.suarez@ejemplo-legalnea.com', '+54 9 379 4014014'),
  ('Franco Matías Ortiz', 'Chaco', 'Resistencia', 'Inclusión Social', 'CPACF T°24 F°85', 'Col. Ab. Chaco T°3 F°25', '2022-07-01'::date, 'franco.matias.ortiz@ejemplo-legalnea.com', '+54 9 362 4015015'),
  ('Valentina Micaela Rojas', 'Misiones', 'Oberá', 'Defensa del Consumidor', 'CPACF T°25 F°90', 'Col. Ab. Misiones T°2 F°14', '2022-07-15'::date, 'valentina.micaela.rojas@ejemplo-legalnea.com', '+54 9 3755 416016'),
  ('Agustín Ramiro Molina', 'Buenos Aires', 'Mar del Plata', 'Derecho Ambiental', 'CPACF T°26 F°95', 'CASI T°12 F°60', '2022-08-03'::date, 'agustin.ramiro.molina@ejemplo-legalnea.com', '+54 9 223 4017017'),
  ('Renata Ludmila Cabrera', 'CABA', 'CABA', 'Propiedad Intelectual (Marcas y Patentes)', 'CPACF T°27 F°100', '—', '2022-08-20'::date, 'renata.ludmila.cabrera@ejemplo-legalnea.com', '+54 9 11 40180180'),
  ('Máximo Ivo Aguirre', 'Salta', 'Salta', 'Derecho Migratorio y de Extranjería', 'CPACF T°28 F°105', 'Col. Ab. Salta T°1 F°7', '2022-09-04'::date, 'maximo.ivo.aguirre@ejemplo-legalnea.com', '+54 9 387 4019019'),
  ('Alma Josefina Medina', 'Jujuy', 'San Salvador de Jujuy', 'Derecho de la Discapacidad', 'CPACF T°29 F°110', 'Col. Ab. Jujuy T°1 F°5', '2022-09-18'::date, 'alma.josefina.medina@ejemplo-legalnea.com', '+54 9 388 4020020'),
  ('Dante Ramón Vera', 'Corrientes', 'Goya', 'Transparencia y Acceso a la Información Pública', 'CPACF T°30 F°112', 'Col. Ab. Corrientes T°6 F°42', '2022-10-02'::date, 'dante.ramon.vera@ejemplo-legalnea.com', '+54 9 3777 421021'),
  ('Olivia Reneé Silva', 'Corrientes', 'Curuzú Cuatiá', 'Género y Violencia Familiar/de Género', 'CPACF T°31 F°114', 'Col. Ab. Corrientes T°7 F°50', '2022-10-16'::date, 'olivia.renee.silva@ejemplo-legalnea.com', '+54 9 3774 422022'),
  ('Ian Maximiliano Castro', 'Chaco', 'Charata', 'Derechos Humanos', 'CPACF T°32 F°116', 'Col. Ab. Chaco T°4 F°33', '2022-10-30'::date, 'ian.maximiliano.castro@ejemplo-legalnea.com', '+54 9 3731 423023'),
  ('Mía Antonella Ríos', 'Mendoza', 'Mendoza', 'Derecho Concursal y Quiebras', 'CPACF T°33 F°118', 'Col. Ab. Mendoza T°3 F°20', '2022-11-14'::date, 'mia.antonella.rios@ejemplo-legalnea.com', '+54 9 261 4024024'),
  ('Bautista Ariel Luna', 'Corrientes', 'Corrientes', 'Derecho Bancario y Financiero', 'CPACF T°34 F°120', 'Col. Ab. Corrientes T°8 F°58', '2022-11-28'::date, 'bautista.ariel.luna@ejemplo-legalnea.com', '+54 9 379 4025025'),
  ('Zoe Amanda Peralta', 'San Juan', 'San Juan', 'Derecho de Seguros', 'CPACF T°35 F°122', 'Col. Ab. San Juan T°1 F°6', '2022-12-12'::date, 'zoe.amanda.peralta@ejemplo-legalnea.com', '+54 9 264 4026026'),
  ('Gael Rodrigo Ibáñez', 'Corrientes', 'Mercedes', 'Derecho Aduanero y Comercio Exterior', 'CPACF T°36 F°124', 'Col. Ab. Corrientes T°9 F°65', '2023-01-09'::date, 'gael.rodrigo.ibanez@ejemplo-legalnea.com', '+54 9 3773 427027'),
  ('Luna Esperanza Godoy', 'Chaco', 'Sáenz Peña', 'Derecho Agrario y Rural', 'CPACF T°37 F°126', 'Col. Ab. Chaco T°5 F°38', '2023-01-23'::date, 'luna.esperanza.godoy@ejemplo-legalnea.com', '+54 9 3732 428028'),
  ('Thiago Nahuel Paredes', 'Neuquén', 'Neuquén', 'Derecho Minero y Energético', 'CPACF T°38 F°128', 'Col. Ab. Neuquén T°1 F°9', '2023-02-06'::date, 'thiago.nahuel.paredes@ejemplo-legalnea.com', '+54 9 299 4029029'),
  ('Abril Constanza Leiva', 'Río Negro', 'Bariloche', 'Arbitraje y Mediación', 'CPACF T°39 F°130', 'Col. Ab. Río Negro T°1 F°7', '2023-02-20'::date, 'abril.constanza.leiva@ejemplo-legalnea.com', '+54 9 294 4030030'),
  ('Ignacio Bautista Domínguez', 'Chubut', 'Comodoro Rivadavia', 'Derecho Penal', 'CPACF T°31 F°115', 'Col. Ab. Chubut T°3 F°40', '2022-07-07'::date, 'ignacio.bautista.dominguez@ejemplo-legalnea.com', '+54 9 297 4031031'),
  ('Guadalupe Milagros Roldán', 'Santa Cruz', 'Río Gallegos', 'Transparencia y Acceso a la Información Pública', 'CPACF T°59 F°320', 'Col. Ab. Santa Cruz T°1 F°6', '2023-10-18'::date, 'guadalupe.milagros.roldan@ejemplo-legalnea.com', '+54 9 2966 432032'),
  ('Bautista Lionel Navarro', 'Tierra del Fuego', 'Ushuaia', 'Derecho Laboral', 'CPACF T°30 F°108', 'Col. Ab. Tierra del Fuego T°1 F°5', '2022-04-30'::date, 'bautista.lionel.navarro@ejemplo-legalnea.com', '+54 9 2901 433033'),
  ('Delfina Rosario Paz', 'La Pampa', 'Santa Rosa', 'Derecho de Familia', 'CPACF T°29 F°100', 'Col. Ab. La Pampa T°1 F°4', '2022-11-12'::date, 'delfina.rosario.paz@ejemplo-legalnea.com', '+54 9 2954 434034'),
  ('Lautaro Joaquín Ferreyra', 'Buenos Aires', 'Bahía Blanca', 'Derecho Bancario y Financiero', 'CPACF T°61 F°330', 'CASI T°22 F°95', '2024-02-05'::date, 'lautaro.joaquin.ferreyra@ejemplo-legalnea.com', '+54 9 291 4035035'),
  ('Catalina Emilia Vega', 'Buenos Aires', 'San Isidro', 'Derecho de Seguros', 'CPACF T°62 F°340', 'CASI T°23 F°101', '2024-02-21'::date, 'catalina.emilia.vega@ejemplo-legalnea.com', '+54 9 11 40360360'),
  ('Thiago Benjamín Quiroga', 'CABA', 'CABA', 'Arbitraje y Mediación', 'CPACF T°63 F°350', '—', '2024-03-01'::date, 'thiago.benjamin.quiroga@ejemplo-legalnea.com', '+54 9 11 40370370'),
  ('Emma Guadalupe Zalazar', 'Corrientes', 'Mercedes', 'Derecho Civil', 'CPACF T°27 F°90', 'Col. Ab. Corrientes T°5 F°68', '2022-09-15'::date, 'emma.guadalupe.zalazar@ejemplo-legalnea.com', '+54 9 3773 438038'),
  ('Joaquín Damián Sánchez', 'Chaco', 'Charata', 'Acceso a la Justicia', 'CPACF T°28 F°95', 'Col. Ab. Chaco T°8 F°110', '2022-06-08'::date, 'joaquin.damian.sanchez@ejemplo-legalnea.com', '+54 9 3731 439039'),
  ('Pilar Antonella Escobar', 'Misiones', 'Eldorado', 'Derecho Informático y Protección de Datos Personales', 'CPACF T°64 F°360', 'Col. Ab. Misiones T°4 F°55', '2024-03-10'::date, 'pilar.antonella.escobar@ejemplo-legalnea.com', '+54 9 3751 440040'),
  ('Benicio Rodrigo Aráoz', 'Tucumán', 'Concepción', 'Derecho Electoral', 'CPACF T°26 F°84', 'Col. Ab. Tucumán T°11 F°165', '2022-05-03'::date, 'benicio.rodrigo.araoz@ejemplo-legalnea.com', '+54 9 381 4041041')
),
insertados as (
  insert into abogados (
    nombre_completo, provincia, localidad, matricula_federal, matricula_provincial,
    fecha_alta, email, telefono, estado, acepto_declaracion_jurada, fecha_aceptacion_dj
  )
  select
    d.nombre_completo, d.provincia, d.localidad, d.matricula_federal, d.matricula_provincial,
    d.fecha_alta, d.email, d.telefono, 'aprobado', true, d.fecha_alta
  from abogados_demo d
  returning id, email
)
insert into abogado_especialidades (abogado_id, especialidad_id)
select i.id, e.id
from insertados i
join abogados_demo d on d.email = i.email
join especialidades e on e.nombre = d.especialidad_nombre;
