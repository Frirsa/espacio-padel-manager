import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Espacio Pádel Manager",
    short_name: "Espacio Pádel",
    description: "Gestión de clases, alumnos y actividad de Espacio Pádel",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F8FA",
    theme_color: "#0F2742",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}