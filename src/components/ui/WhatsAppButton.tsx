"use client";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/6583776492"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with PathPort support on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
      style={{ backgroundColor: "#25D366", color: "#fff" }}
    >
      {/* WhatsApp logo SVG */}
      <svg viewBox="0 0 32 32" className="w-5 h-5 flex-shrink-0" fill="currentColor" aria-hidden="true">
        <path d="M16.003 3C9.373 3 4 8.373 4 15.003c0 2.135.564 4.14 1.55 5.874L4 29l8.308-1.528A11.958 11.958 0 0016.003 28C22.627 28 28 22.627 28 15.997 28 9.373 22.627 3 16.003 3zm0 21.833a9.823 9.823 0 01-5.013-1.38l-.36-.213-3.726.684.709-3.63-.235-.373A9.829 9.829 0 016.167 15c0-5.43 4.41-9.833 9.836-9.833 5.432 0 9.83 4.403 9.83 9.833 0 5.43-4.398 9.833-9.83 9.833zm5.396-7.373c-.297-.148-1.754-.864-2.026-.963-.271-.099-.469-.148-.667.148-.198.296-.766.963-.939 1.161-.173.197-.346.222-.643.074-.297-.148-1.254-.463-2.386-1.475-.882-.786-1.477-1.756-1.65-2.052-.172-.296-.018-.456.13-.603.132-.133.296-.347.444-.52.148-.173.198-.297.297-.495.099-.198.05-.37-.025-.52-.074-.148-.667-1.61-.913-2.206-.24-.578-.484-.5-.667-.51-.173-.009-.37-.011-.568-.011-.197 0-.52.074-.792.37-.272.297-1.04 1.017-1.04 2.48s1.065 2.877 1.213 3.075c.148.198 2.097 3.201 5.08 4.487.71.307 1.263.49 1.695.627.712.227 1.36.195 1.872.118.57-.085 1.754-.716 2.002-1.408.247-.692.247-1.286.173-1.41-.074-.124-.272-.198-.568-.347z" />
      </svg>
      <span className="hidden sm:block font-body text-sm font-semibold leading-none">Chat with us</span>
    </a>
  );
}
