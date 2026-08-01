export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="w-64 bg-slate-900 p-6 text-white">
          <h1 className="text-2xl font-bold">Espacio Pádel</h1>
          <p className="mt-1 text-sm text-slate-400">Manager</p>

          <nav className="mt-10 space-y-3">
            <a className="block rounded-lg bg-teal-600 px-4 py-3">Dashboard</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Agenda</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Clases</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Alumnos</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Grupos</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Ubicaciones</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Bonos</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Cobros</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Informes</a>
            <a className="block rounded-lg px-4 py-3 hover:bg-slate-800">Estadísticas</a>
          </nav>
        </aside>

        <section className="flex-1 p-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-4xl font-bold text-slate-900">
              Dashboard
            </h2>

            <p className="mt-2 text-slate-600">
              Resumen de tu actividad
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">Clases hoy</p>
                <p className="mt-2 text-3xl font-bold">6</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">Horas</p>
                <p className="mt-2 text-3xl font-bold">8,5</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">Ingresos previstos</p>
                <p className="mt-2 text-3xl font-bold">145 €</p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow">
                <p className="text-sm text-slate-500">Pendiente de cobro</p>
                <p className="mt-2 text-3xl font-bold">35 €</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow">
              <p className="text-sm text-slate-500">Próxima clase</p>

              <div className="mt-4">
                <p className="text-2xl font-bold">17:30</p>
                <p className="mt-1 text-lg">IQL</p>
                <p className="text-slate-600">Andrea · Paula · Marta</p>
                <p className="text-slate-500">90 minutos</p>
              </div>

              <button className="mt-6 rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white">
                Abrir clase
              </button>
            </div>

            <button className="mt-8 rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white">
              + Nueva clase
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}