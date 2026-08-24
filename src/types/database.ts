// Tipos generados a mano a partir de supabase/migrations/0001_schema.sql
// (Alternativa: regenerar con `supabase gen types typescript` cuando el proyecto esté linkeado)

export type Rol = "admin" | "abogado" | "cliente";
export type EstadoAbogado = "pendiente" | "aprobado" | "rechazado" | "inactivo";
export type CategoriaEspecialidad = "prioritaria_probono" | "general";
export type EstadoSolicitud =
  | "nueva"
  | "en_revision"
  | "asignada"
  | "en_curso"
  | "resuelta"
  | "derivada"
  | "cerrada"
  | "anulada";
export type Prioridad = "baja" | "media" | "alta" | "urgente";

export type Perfil = {
  id: string;
  rol: Rol;
  nombre_completo: string;
  email: string;
  telefono: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type Especialidad = {
  id: string;
  nombre: string;
  categoria: CategoriaEspecialidad;
  activa: boolean;
  created_at: string;
}

export type Abogado = {
  id: string;
  user_id: string | null;
  nombre_completo: string;
  dni: string | null;
  email: string;
  telefono: string;
  provincia: string;
  localidad: string;
  direccion: string | null;
  codigo_postal: string | null;
  matricula_federal: string | null;
  matricula_provincial: string | null;
  anios_experiencia: number | null;
  motivacion: string | null;
  estado: EstadoAbogado;
  acepto_declaracion_jurada: boolean;
  fecha_aceptacion_dj: string | null;
  declaracion_jurada_pdf_url: string | null;
  motivo_rechazo: string | null;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  fecha_alta: string;
  created_at: string;
  updated_at: string;
}

export type AbogadoEspecialidad = {
  abogado_id: string;
  especialidad_id: string;
}

export type Cliente = {
  id: string;
  user_id: string | null;
  nombre_completo: string;
  dni: string | null;
  email: string;
  telefono: string;
  provincia: string;
  localidad: string;
  direccion: string | null;
  created_at: string;
  updated_at: string;
}

export type Solicitud = {
  id: string;
  cliente_id: string;
  especialidad_id: string | null;
  motivo_consulta: string;
  descripcion: string;
  declaracion_veracidad_aceptada: boolean;
  estado: EstadoSolicitud;
  prioridad: Prioridad;
  abogado_asignado_id: string | null;
  fecha_asignacion: string | null;
  resolucion: string | null;
  created_at: string;
  updated_at: string;
}

export type SolicitudAdjunto = {
  id: string;
  solicitud_id: string;
  nombre_archivo: string;
  ruta_storage: string;
  tipo_mime: string;
  tamanio_bytes: number;
  created_at: string;
}

export type Mensaje = {
  id: string;
  solicitud_id: string;
  autor_id: string;
  autor_rol: Rol;
  contenido: string;
  leido: boolean;
  created_at: string;
}

export type SolicitudEvento = {
  id: string;
  solicitud_id: string;
  autor_id: string | null;
  autor_rol: Rol;
  etapa: string;
  nota: string | null;
  created_at: string;
}

export type LogAuditoria = {
  id: string;
  usuario_id: string | null;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  detalle: Record<string, unknown> | null;
  created_at: string;
}

export type PlantillaEmail = {
  id: string;
  codigo: string;
  asunto: string;
  cuerpo_html: string;
  activa: boolean;
  updated_at: string;
}

export type NotificacionAdmin = {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  entidad_id: string | null;
  created_at: string;
}

// Relaciones de FK expuestas para que @supabase/postgrest-js pueda tipar los
// embeds (`.select("abogado_especialidades(especialidades(nombre))")`, etc.)
type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne?: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: Perfil;
        Insert: Partial<Perfil> & Pick<Perfil, "id" | "rol" | "nombre_completo" | "email">;
        Update: Partial<Perfil>;
        Relationships: [];
      };
      especialidades: {
        Row: Especialidad;
        Insert: Partial<Especialidad> & Pick<Especialidad, "nombre">;
        Update: Partial<Especialidad>;
        Relationships: [];
      };
      abogados: {
        Row: Abogado;
        Insert: Partial<Abogado>;
        Update: Partial<Abogado>;
        Relationships: [
          {
            foreignKeyName: "abogados_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "perfiles";
            referencedColumns: ["id"];
          },
        ];
      };
      abogado_especialidades: {
        Row: AbogadoEspecialidad;
        Insert: AbogadoEspecialidad;
        Update: Partial<AbogadoEspecialidad>;
        Relationships: [
          {
            foreignKeyName: "abogado_especialidades_abogado_id_fkey";
            columns: ["abogado_id"];
            isOneToOne: false;
            referencedRelation: "abogados";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "abogado_especialidades_especialidad_id_fkey";
            columns: ["especialidad_id"];
            isOneToOne: false;
            referencedRelation: "especialidades";
            referencedColumns: ["id"];
          },
        ];
      };
      clientes: {
        Row: Cliente;
        Insert: Partial<Cliente>;
        Update: Partial<Cliente>;
        Relationships: [];
      };
      solicitudes: {
        Row: Solicitud;
        Insert: Partial<Solicitud>;
        Update: Partial<Solicitud>;
        Relationships: [
          {
            foreignKeyName: "solicitudes_cliente_id_fkey";
            columns: ["cliente_id"];
            isOneToOne: false;
            referencedRelation: "clientes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitudes_especialidad_id_fkey";
            columns: ["especialidad_id"];
            isOneToOne: false;
            referencedRelation: "especialidades";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "solicitudes_abogado_asignado_id_fkey";
            columns: ["abogado_asignado_id"];
            isOneToOne: false;
            referencedRelation: "abogados";
            referencedColumns: ["id"];
          },
        ];
      };
      solicitud_adjuntos: {
        Row: SolicitudAdjunto;
        Insert: Partial<SolicitudAdjunto>;
        Update: Partial<SolicitudAdjunto>;
        Relationships: [
          {
            foreignKeyName: "solicitud_adjuntos_solicitud_id_fkey";
            columns: ["solicitud_id"];
            isOneToOne: false;
            referencedRelation: "solicitudes";
            referencedColumns: ["id"];
          },
        ];
      };
      mensajes: {
        Row: Mensaje;
        Insert: Partial<Mensaje>;
        Update: Partial<Mensaje>;
        Relationships: [
          {
            foreignKeyName: "mensajes_solicitud_id_fkey";
            columns: ["solicitud_id"];
            isOneToOne: false;
            referencedRelation: "solicitudes";
            referencedColumns: ["id"];
          },
        ];
      };
      solicitud_eventos: {
        Row: SolicitudEvento;
        Insert: Partial<SolicitudEvento>;
        Update: Partial<SolicitudEvento>;
        Relationships: [
          {
            foreignKeyName: "solicitud_eventos_solicitud_id_fkey";
            columns: ["solicitud_id"];
            isOneToOne: false;
            referencedRelation: "solicitudes";
            referencedColumns: ["id"];
          },
        ];
      };
      logs_auditoria: {
        Row: LogAuditoria;
        Insert: Partial<LogAuditoria>;
        Update: Partial<LogAuditoria>;
        Relationships: [];
      };
      plantillas_email: {
        Row: PlantillaEmail;
        Insert: Partial<PlantillaEmail>;
        Update: Partial<PlantillaEmail>;
        Relationships: [];
      };
      notificaciones_admin: {
        Row: NotificacionAdmin;
        Insert: Partial<NotificacionAdmin>;
        Update: Partial<NotificacionAdmin>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

// (tipo auxiliar exportado por si se necesita en queries más adelante)
export type { Relationship };
