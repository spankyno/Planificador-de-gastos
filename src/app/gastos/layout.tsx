import Nav from "@/components/Nav";

export const runtime = "edge";

// La barra de navegación solo se carga en las páginas con sesión; así el layout raíz no depende
// de la sesión y la página de error /_not-found puede generarse como estática en Cloudflare Pages.
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
