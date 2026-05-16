"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle, BarChart3, Users, Zap, ShieldCheck, FileText } from "lucide-react";

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Detecta se o app está rodando em modo standalone (PWA/TWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');

    if (isStandalone) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Navigation */}
      <nav className="border-b border-gray-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/images/logo_simbolo.png" alt="Unum People Logo" width={32} height={32} />
            <span className="text-xl font-black text-primary-900 tracking-tighter uppercase">Unum People <span className="text-primary-600">CRM</span></span>
          </div>
          <Link 
            href="/login" 
            className="bg-primary-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-primary-700 transition-all shadow-lg hover:shadow-primary-200"
          >
            Acessar Painel
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="py-20 lg:py-32 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-5">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary-600 rounded-full blur-[120px]" />
        </div>
        
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 leading-[1.1] mb-6">
            Gestão inteligente de <span className="text-primary-600 underline decoration-8 decoration-primary-100 underline-offset-8">leads e vendas</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 font-medium leading-relaxed mb-10 max-w-2xl mx-auto">
            O Unum People CRM é a plataforma definitiva para otimizar seu funil comercial, integrando dados do Google Ads para uma atribuição precisa e resultados reais.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-primary-600 text-white px-10 py-4 rounded-xl font-black text-lg hover:bg-primary-700 transition-all shadow-xl hover:shadow-primary-200"
            >
              Começar Agora
            </Link>
            <a 
              href="#features" 
              className="w-full sm:w-auto bg-gray-50 text-gray-600 px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all"
            >
              Ver Funcionalidades
            </a>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-sm font-black text-primary-600 uppercase tracking-widest mb-2">Funcionalidades Profissionais</h2>
            <p className="text-3xl font-black text-gray-900">Tudo o que você precisa para vender mais</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<BarChart3 className="text-primary-600" />}
              title="Atribuição Google Ads"
              description="Rastreie a origem dos seus leads e entenda quais campanhas estão gerando vendas reais com integração via OAuth."
            />
            <FeatureCard 
              icon={<Users className="text-primary-600" />}
              title="Kanban de Vendas"
              description="Visualize seu fluxo comercial de forma intuitiva, movendo leads entre etapas com facilidade e foco total."
            />
            <FeatureCard 
              icon={<Zap className="text-primary-600" />}
              title="Ações Rápidas"
              description="Automatize contatos via WhatsApp e registre vendas com um clique, mantendo a agilidade do seu time."
            />
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-12">Por que escolher o Unum People CRM?</h2>
          <div className="grid sm:grid-cols-2 gap-x-12 gap-y-8 text-left">
            <CheckItem text="Conformidade total com a LGPD e privacidade de dados." />
            <CheckItem text="Interface mobile-first para gestão de qualquer lugar." />
            <CheckItem text="Dashboards em tempo real com métricas de LTV." />
            <CheckItem text="Suporte dedicado à integração de anúncios pagos." />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center border-b border-primary-800 pb-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Image src="/images/logo_simbolo.png" alt="Unum People Logo" width={40} height={40} className="brightness-0 invert" />
                <span className="text-2xl font-black tracking-tighter uppercase">Unum People <span className="text-primary-400">CRM</span></span>
              </div>
              <p className="text-primary-200 font-medium max-w-sm">
                Transformando dados em lucro através de inteligência comercial e atribuição de marketing de alta precisão.
              </p>
            </div>
            <div className="flex flex-wrap gap-8 md:justify-end">
              <Link href="/login" className="font-bold hover:text-primary-400 transition-colors">Login</Link>
              <Link href="/terms" className="font-bold hover:text-primary-400 transition-colors flex items-center gap-2">
                <FileText size={18} /> Termos de Uso
              </Link>
              <Link href="/privacy" className="font-bold hover:text-primary-400 transition-colors flex items-center gap-2">
                <ShieldCheck size={18} /> Privacidade
              </Link>
            </div>
          </div>
          <div className="text-center text-primary-400 text-xs font-bold uppercase tracking-widest">
            © {new Date().getFullYear()} Unum People CRM. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
      <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 font-medium leading-relaxed">{description}</p>
    </div>
  );
}

function CheckItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle className="text-green-500 shrink-0 mt-1" size={20} />
      <span className="text-gray-600 font-bold">{text}</span>
    </div>
  );
}
