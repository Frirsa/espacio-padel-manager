export type AlumnoClase = {
  nombre: string;
  apellidos: string | null;
};

export type ParticipanteClase = {
  alumno_id: string;
  importe: number;
  usa_bono: boolean;
  bono_id: string | null;
  alumnos: AlumnoClase | null;
};

export type Clase = {
  id: string;
  fecha: string;
  hora_inicio: string;
  duracion_minutos: number;
  tipo: string;
  estado: string;
  importe_club: number;
  coste_pista: number;
  modo_cobro?: "por_alumno" | "total" | string | null;
  importe_total?: number | null;
  ubicaciones: {
    nombre: string;
    tipo: string;
  } | null;
  clase_alumnos: ParticipanteClase[];
};

export type Pago = {
  id: string;
  alumno_id: string | null;
  importe: number;
  estado: string;
  metodo: string;
  fecha_pago: string;
  alumnos: {
    nombre: string;
    apellidos: string | null;
  } | null;
  clases?: {
    id: string;
    fecha: string;
    hora_inicio: string;
    modo_cobro?: "por_alumno" | "total" | string | null;
    importe_total?: number | null;
    clase_alumnos: {
      alumnos: {
        nombre: string;
        apellidos: string | null;
      } | null;
    }[];
  } | null;
};

export type TipoInforme =
  | "iql"
  | "economico"
  | "pendientes";
