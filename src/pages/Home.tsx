import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-blue-900/10 rounded-full blur-3xl" />
      </div>

      {/* HEADER */}
      <header className="relative z-10 border-b border-white/5 backdrop-blur-md bg-gray-950/70 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white">Campus Gate System</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25 active:scale-95"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium mb-8 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
          Digital Campus Infrastructure
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
          <span className="text-white">Smart Campus</span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-cyan-400 bg-clip-text text-transparent">
            Management
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-gray-400 text-lg leading-relaxed mb-10">
          A unified platform to streamline bus entry tracking, student outpass approvals,
          and visitor management — all secured under one intelligent gate system.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="px-8 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-base transition-all duration-200 w-full sm:w-auto text-center"
          >
            Login
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base transition-all duration-200 hover:shadow-xl hover:shadow-blue-600/30 active:scale-95 w-full sm:w-auto text-center"
          >
            Sign Up
          </button>
        </div>

        {/* Hero visual */}
        <div className="mt-20 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto opacity-40">
            {[...Array(9)].map((_, i) => (
              <div
                key={i}
                className="h-16 rounded-xl bg-gradient-to-br from-blue-900/40 to-gray-800/40 border border-white/5"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex items-center gap-8 px-10 py-5 rounded-2xl bg-gray-900/90 border border-white/10 backdrop-blur-xl shadow-2xl">
              {[
                { label: "Buses Logged", value: "2,400+" },
                { label: "Outpasses", value: "18K+" },
                { label: "Visitors", value: "5,200+" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Core Features</h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Everything your campus needs to manage access, movement, and security in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              ),
              title: "Bus Entry System",
              description:
                "Track every bus entering or exiting campus in real time. Log driver details, timestamps, and vehicle information with automated verification.",
              accent: "blue",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              ),
              title: "Student Outpass Management",
              description:
                "Digitize the entire outpass workflow — from student requests to staff approvals. Get notified instantly and maintain a full audit trail.",
              accent: "cyan",
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              ),
              title: "Visitor Management",
              description:
                "Register visitors, issue digital passes, and monitor their movement across campus. Ensure only authorized individuals gain entry.",
              accent: "indigo",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-gray-900 border border-white/5 hover:border-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-950/50"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-600/15 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-5 group-hover:bg-blue-600/25 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-900/50 border border-white/5 p-10 sm:p-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-4 block">About the System</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-6">
              Built for Modern Campus Security
            </h2>
            <p className="text-gray-400 leading-relaxed mb-4">
              Campus Gate System is a fully digital campus management platform designed to replace manual logbooks and paper-based workflows with a streamlined, automated solution.
            </p>
            <p className="text-gray-400 leading-relaxed">
              By focusing on <span className="text-white font-medium">security</span>, <span className="text-white font-medium">efficiency</span>, and <span className="text-white font-medium">automation</span>, it empowers administrators to monitor campus access in real time — reducing overhead and eliminating human error.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Security First", desc: "Role-based access and verified entries at every gate." },
              { label: "Fully Automated", desc: "Notifications, approvals, and logs without manual effort." },
              { label: "Real-time Monitoring", desc: "Live dashboards with instant activity visibility." },
              { label: "Audit Ready", desc: "Complete records for compliance and accountability." },
            ].map((item) => (
              <div key={item.label} className="p-5 rounded-2xl bg-gray-800/50 border border-white/5">
                <div className="w-2 h-2 rounded-full bg-blue-400 mb-3" />
                <div className="text-white font-semibold text-sm mb-1">{item.label}</div>
                <div className="text-gray-500 text-xs leading-relaxed">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEVELOPER SECTION */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Meet the Developer</h2>
          <p className="text-gray-500 text-base">The mind behind Campus Gate System.</p>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="relative p-8 rounded-3xl bg-gray-900 border border-white/5 text-center overflow-hidden">
            {/* Glow orb */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-blue-600/20 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800 mx-auto mb-5 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-blue-900/40">
                A
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">Arunkumar T</h3>
              <div className="flex flex-col items-center gap-1.5 mb-5">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600/15 border border-blue-500/20 text-blue-400 text-xs font-medium">
                  Founder, Echonet Innovation
                </span>
                <span className="text-gray-300 text-sm mt-2">📞 9894819524</span>
                <span className="text-gray-300 text-sm">✉️ aruninfotech2006</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto">
                Passionate about building real-world software solutions that solve everyday institutional challenges. Campus Gate System reflects a commitment to making campuses smarter, safer, and more efficient through technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-white/5 bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="text-gray-500 text-sm">Campus Gate System</span>
          </div>
          <p className="text-gray-600 text-sm">© 2026 Echonet Innovation. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
