import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { ChevronDown, ArrowRight } from "lucide-react"

const faqs = [
  {
    q: "Why do placements become a nightmare every single year?",
    a: "Because colleges rely on people instead of systems. When knowledge lives in heads, WhatsApp chats, and Excel files, chaos is guaranteed. STON CV turns placements into a controlled operation, not an annual fire drill."
  },
  {
    q: "We’ve managed placements for years. Why change now?",
    a: "You didn’t “manage” — you survived. Manual systems don’t scale, don’t audit, and don’t protect you when things go wrong. Past survival is not future safety."
  },
  {
    q: "Will this increase workload for my placement team?",
    a: "No. It removes unnecessary work. The system handles structure, tracking, and visibility so your team focuses on coordination and outcomes — not chasing data."
  },
  {
    q: "Will this expose mistakes or weak areas in our placement process?",
    a: "Yes — and that’s the point. Weakness exists whether you see it or not. STON CV exposes gaps early so they can be fixed before placement season, not during audits or complaints."
  },
  {
    q: "Does this take control away from placement officers?",
    a: "Absolutely not. It removes confusion, not authority. Officers still make decisions — the system just ensures those decisions are traceable, explainable, and defensible."
  },
  {
    q: "What if a student questions why they were not shortlisted?",
    a: "For the first time, you have an answer backed by data, rules, and records — not memory or assumptions. Every decision is explainable."
  },
  {
    q: "Will this create problems with auditors, NAAC, or management reviews?",
    a: "It does the opposite. It gives you clean records, structured reports, and a clear trail of how placements were executed."
  },
  {
    q: "What if staff resists using the system?",
    a: "Resistance comes from fear of accountability. STON CV reduces stress for serious teams and exposes inefficiency — which is exactly why leadership needs it."
  },
  {
    q: "Is our data safe, or will this become a liability?",
    a: "Access is strictly controlled by role. No one sees more than they should. Everything is logged. This reduces institutional risk, not increases it."
  },
  {
    q: "What happens if we stop using the platform later?",
    a: "Your data remains yours. Processes don’t vanish. But once placements are systemized, most colleges never want to go back."
  },
  {
    q: "Is this just another software subscription?",
    a: "No. This is infrastructure. Like ERP for finance — but for placements. Once installed, it becomes the backbone of how placements run."
  },
  {
    q: "Why should management care about this?",
    a: "Because placements are reputation, trust, and future admissions — and those cannot depend on informal processes anymore."
  },
  {
    q: "Does this work only during final year?",
    a: "No. It brings visibility from second year onward so placements become predictable, not last-minute panic."
  },
  {
    q: "What is the real risk of NOT using STON CV?",
    a: "Dependence on individuals, lack of accountability, audit exposure, staff burnout, and reputational damage when things go wrong."
  },
  {
    q: "Why do colleges continue using this long-term?",
    a: "Because once control, visibility, and predictability exist, chaos is no longer acceptable."
  }
]

import { contactAPI } from "@/lib/api"

export default function LandingPage() {
  const [open, setOpen] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [contactForm, setContactForm] = useState({ name: "", email: "", college: "", message: "" })
  const [contactStatus, setContactStatus] = useState<"idle" | "submitting" | "success" | "error">("idle")

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactStatus("submitting")
    try {
      await contactAPI.submitQuery(contactForm)
      setContactStatus("success")
      setContactForm({ name: "", email: "", college: "", message: "" })
    } catch {
      setContactStatus("error")
    }
  }

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto"
    return () => void (document.body.style.overflow = "auto")
  }, [menuOpen])

  return (
    <div className="min-h-screen text-white bg-gradient-to-br from-[#0b0424] via-[#1a0f4a] to-[#2b1d77]">
      <nav className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/image/STON.png" alt="STON" width={36} height={36} loading="lazy" />
            <span className="font-semibold text-lg">STON TECHNOLOGY</span>
          </div>

          <div className="hidden md:flex gap-8 text-sm items-center">
            <a href="#about" className="text-white/80 hover:text-white">About Us</a>
            <a href="#benefits" className="text-white/80 hover:text-white">Why STON CV</a>
            <a href="#faq" className="text-white/80 hover:text-white">FAQ</a>
            <a href="#contact" className="text-white/80 hover:text-white">Get In Touch</a>
            <Link to="/login" className="bg-[#8b7cff] text-black px-5 py-2 rounded-full font-semibold">Login →</Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden px-6 pb-6 flex flex-col gap-4 border-t border-white/10"
            role="navigation"
            aria-label="Primary"
          >
            <a href="#about" onClick={() => setMenuOpen(false)}>About Us</a>
            <a href="#benefits" onClick={() => setMenuOpen(false)}>Why STON CV</a>
            <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#contact" onClick={() => setMenuOpen(false)}>Get In Touch</a>
            <Link to="/login" className="bg-[#8b7cff] text-black px-5 py-2 rounded-full font-semibold text-center" onClick={() => setMenuOpen(false)}>Login →</Link>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-24">
        <section className="grid md:grid-cols-2 gap-8 items-center relative hero-spot">
          {/* decorative animated blobs */}
          <div className="absolute -left-20 -top-12 w-56 h-56 rounded-full bg-gradient-to-tr from-pink-400 to-teal-300 opacity-20 blur-3xl animate-blob" />
          <div className="absolute -right-16 top-16 w-48 h-48 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 opacity-18 blur-3xl animate-blob-slow" />

          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 fade-in-fast">Placement Execution Engine</h1>
            <p className="text-white/80 mb-6 slide-up-smooth">Run placements with structure, discipline, and clear visibility — in one system.</p>
            <Link to="/login" className="inline-flex items-center gap-3 bg-white text-black px-6 py-3 rounded-full font-semibold hero-cta lift-on-hover glow">Request a Placement Overview <ArrowRight className="w-4 h-4" /></Link>
          </div>

          <div className="relative w-full max-w-md mx-auto">
            <div className="absolute inset-0 bg-[#6c5ce7]/30 blur-3xl rounded-full" />
            <img src="/image/hero.png" alt="hero" className="relative z-10 w-full h-auto object-contain float-blob" loading="lazy" />
          </div>
        </section>

        <section id="about" className="mt-20">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">About Us</h2>
            <div className="mt-10 grid gap-10 md:grid-cols-2">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Built for Execution, Not Just Tracking</h3>
                <p className="text-white/80">STON CV is designed to run placements — not just store resumes.</p>
                <p className="text-white/80">It brings structure, discipline, and accountability to placement execution.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Reduces Dependency on Individuals</h3>
                <p className="text-white/80">Placements should not depend on one or two people.</p>
                <p className="text-white/80">STON CV standardizes processes so outcomes remain consistent even when staff changes.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Data-Driven, Yet Human-Controlled</h3>
                <p className="text-white/80">Insights assist planning, but all final decisions remain with the college.</p>
                <p className="text-white/80">Transparency and explainability are built into every step.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Designed for Scale and Governance</h3>
                <p className="text-white/80">From second year to final year, across departments, leadership gets real-time visibility, auditability, and control.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Improves Reputation, Not Just Numbers</h3>
                <p className="text-white/80">Better structure leads to better outcomes — improving student readiness, placement quality, and long-term institutional credibility.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="mt-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">Key Benefits</h2>
            <p className="text-center text-white/70 mt-3">Why should we trust this system with our placements?</p>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">Guaranteed Operational Control</h3>
                <p className="text-white/80 text-sm mt-2">All placement data, decisions, and outcomes live in one system — no confusion, no dependency, no information loss.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">Predictable Placement Outcomes</h3>
                <p className="text-white/80 text-sm mt-2">Identify gaps early from the second year itself, reducing last-minute pressure and surprises during placement season.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">Lower Cost, Higher Efficiency</h3>
                <p className="text-white/80 text-sm mt-2">Cuts down manual effort across resumes, coordination, shortlisting, and reporting — saving hundreds of staff hours every year.</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6">
                <h3 className="text-lg font-semibold">Stronger Institutional Trust & Reputation</h3>
                <p className="text-white/80 text-sm mt-2">Transparent processes and auditable records build confidence among parents, recruiters, auditors, and accreditation bodies.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl">
                <button
                  id={`faq-trigger-${i}`}
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex justify-between items-center p-5 text-left"
                  aria-expanded={open === i}
                  aria-controls={`faq-panel-${i}`}
                >
                  <span className="font-medium">{f.q}</span>
                  <ChevronDown aria-hidden="true" className={`transition ${open === i ? "rotate-180" : ""}`} />
                </button>
                {open === i && (
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${i}`}
                    className="px-5 pb-5 text-white/80 text-sm"
                  >
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className="mt-20">
          <div className="max-w-xl mx-auto px-4">
            <h2 className="text-2xl font-semibold text-center">Get In Touch</h2>
            <p className="text-white/80 text-center mt-2 text-sm">Have questions or want a placement overview?<br />Share your details and we’ll get back to you.</p>
            <form className="mt-8 space-y-4" onSubmit={handleContactSubmit}>
              <label htmlFor="contact-name" className="sr-only">Name</label>
              <input 
                required
                id="contact-name"
                name="name"
                autoComplete="name"
                value={contactForm.name}
                onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                className="p-3 rounded-xl bg-white text-black w-full text-sm" placeholder="Name" 
              />
              <label htmlFor="contact-email" className="sr-only">Email</label>
              <input 
                required
                id="contact-email"
                name="email"
                autoComplete="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                className="p-3 rounded-xl bg-white text-black w-full text-sm" placeholder="Email" 
              />
              <label htmlFor="contact-college" className="sr-only">College or Department</label>
              <input 
                id="contact-college"
                name="college"
                value={contactForm.college}
                onChange={(e) => setContactForm({...contactForm, college: e.target.value})}
                className="p-3 rounded-xl bg-white text-black w-full text-sm" placeholder="College / Department (optional)" 
              />
              <label htmlFor="contact-message" className="sr-only">Message</label>
              <textarea 
                required
                id="contact-message"
                name="message"
                value={contactForm.message}
                onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                className="p-3 rounded-xl bg-white text-black w-full text-sm" placeholder="Message" rows={4} 
              />
              <div className="flex flex-col items-center gap-2">
                <button 
                  disabled={contactStatus === "submitting"}
                  type="submit" 
                  className="bg-[#6c5ce7] px-5 py-2.5 rounded-full font-semibold text-sm disabled:opacity-50"
                >
                  {contactStatus === "submitting" ? "Sending..." : "Contact Us"}
                </button>
                {contactStatus === "success" && <span role="status" className="text-green-400 text-sm">Message sent successfully!</span>}
                {contactStatus === "error" && <span role="status" className="text-red-400 text-sm">Failed to send message.</span>}
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-6 text-center text-white/60 text-sm">© 2026 STON Technology. All rights reserved.</footer>
    </div>
  )
}
