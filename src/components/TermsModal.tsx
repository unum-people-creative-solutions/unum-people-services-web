"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface TermsModalProps {
  email: string;
  onAccept: () => void;
}

export default function TermsModal({ email, onAccept }: TermsModalProps) {
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAccept = () => {
    setLoading(true);
    // Simula um pequeno delay para feedback visual
    setTimeout(() => {
      localStorage.setItem(`terms-accepted-${email}`, new Date().toISOString());
      onAccept();
      setLoading(false);
    }, 500);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-end md:items-center justify-center md:p-4 bg-gray-900/80 backdrop-blur-md"
    >
      <motion.div 
        initial={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: "100%" } : { scale: 0.9, opacity: 0 }}
        transition={isMobile ? { type: "spring", damping: 25, stiffness: 300 } : { duration: 0.3 }}
        drag={isMobile ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (isMobile && info.offset.y > 150) {
            handleAccept();
          }
        }}
        className="bg-white rounded-t-[32px] md:rounded-2xl max-w-lg w-full shadow-2xl border border-gray-100 max-h-[95vh] flex flex-col overflow-hidden"
      >
        <div className="shrink-0">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-4 md:hidden mt-4" />
        </div>
        
        <div className="overflow-y-auto flex-1 custom-scrollbar">
          <div className="bg-primary-600 p-8 text-white relative overflow-hidden">
            <ShieldCheck className="w-24 h-24 absolute -right-4 -bottom-4 opacity-10 rotate-12" />
            <h2 className="text-2xl font-bold mb-2 relative z-10">Atualização de Privacidade</h2>
            <p className="text-primary-100 text-sm relative z-10 leading-relaxed">
              Para continuar utilizando o CRM da Unum People, precisamos que você revise e aceite nossos novos Termos de Uso e Política de Privacidade em conformidade com a LGPD.
            </p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 transition-colors group">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-primary-600 transition-colors">
                  <ExternalLink size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">Termos de Uso</h3>
                  <p className="text-xs text-gray-500 mb-2">Regras de utilização, responsabilidades e níveis de serviço.</p>
                  <Link href="/terms" target="_blank" className="text-xs font-bold text-primary-600 hover:underline inline-flex items-center gap-1">
                    Ler Termos Completos <ArrowRight size={12} />
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 transition-colors group">
                <div className="bg-white p-2 rounded-lg shadow-sm group-hover:text-primary-600 transition-colors">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 text-sm">Política de Privacidade</h3>
                  <p className="text-xs text-gray-500 mb-2">Como tratamos seus dados e os dados dos seus leads.</p>
                  <Link href="/privacy" target="_blank" className="text-xs font-bold text-primary-600 hover:underline inline-flex items-center gap-1">
                    Ler Política Completa <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-4">
              <p className="text-[10px] text-gray-400 text-center leading-relaxed">
                Ao clicar no botão abaixo, você declara que leu e concorda com o processamento de seus dados pessoais conforme descrito nos documentos acima.
              </p>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="w-full bg-primary-600 text-white py-4 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? "Processando..." : "Concordar e Continuar"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
