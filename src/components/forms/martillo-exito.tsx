"use client";

import * as React from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "framer-motion";
import { Gavel } from "lucide-react";
import { cn } from "@/lib/utils";

// Animación del martillo (mazo de juez) al confirmar el envío exitoso del
// alta de abogado. Golpe -55deg -> 0deg en ~450ms (ease-in pronunciado),
// rebote 5-8deg, shake de la tarjeta + pulso de sombra en el impacto, y
// mensaje de éxito con fade+slide-up 300ms después. Se saltea toda la
// coreografía si el usuario tiene prefers-reduced-motion activado.
export function MartilloExito({ mensaje }: { mensaje: string }) {
  const [scope, animate] = useAnimate();
  const reducedMotion = useReducedMotion();
  const [mostrarTexto, setMostrarTexto] = React.useState(false);
  const [pulso, setPulso] = React.useState(false);

  React.useEffect(() => {
    if (reducedMotion) {
      setMostrarTexto(true);
      return;
    }

    let cancelado = false;

    async function correr() {
      // Golpe: de -55deg a 0deg, acelerando hacia el final (simula el impacto).
      await animate(
        ".martillo-cabeza",
        { rotate: 0 },
        { duration: 0.45, ease: [0.7, 0, 0.84, 0] }
      );
      if (cancelado) return;

      // Impacto: shake de la tarjeta + pulso de sombra radial.
      setPulso(true);
      animate(".martillo-tarjeta", { x: [0, -4, 4, -3, 3, 0] }, { duration: 0.4 });

      // Rebote de 5-8 grados y vuelta a 0.
      await animate(".martillo-cabeza", { rotate: [-7, 0] }, { duration: 0.22, ease: "easeOut" });
      if (cancelado) return;

      setTimeout(() => !cancelado && setPulso(false), 350);
      setTimeout(() => !cancelado && setMostrarTexto(true), 300);
    }

    correr();
    return () => {
      cancelado = true;
    };
  }, [animate, reducedMotion]);

  return (
    <div
      ref={scope}
      className="martillo-tarjeta relative flex flex-col items-center gap-4 py-2 text-center"
    >
      <div className="relative flex h-20 items-end justify-center">
        <div
          className="martillo-cabeza text-primary"
          style={{
            transform: `rotate(${reducedMotion ? 0 : -55}deg)`,
            transformOrigin: "22% 85%",
          }}
        >
          <Gavel className="size-14" strokeWidth={1.5} />
        </div>
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 mx-auto h-3 w-16 rounded-full bg-primary/40 blur-md transition-all duration-300",
            pulso ? "scale-125 opacity-100" : "scale-100 opacity-0"
          )}
        />
      </div>

      <AnimatePresence>
        {mostrarTexto && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-sm text-sm text-muted-foreground"
          >
            {mensaje}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
