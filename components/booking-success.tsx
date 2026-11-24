"use client"

import { motion, useReducedMotion } from "framer-motion"
import { Mail, MessageCircle } from "lucide-react"

interface BookingSuccessProps {
    name?: string
    email?: string
    whatsapp?: string
    onDone: () => void
}

const CONFETTI_COLORS = ["#f97316", "#22c55e", "#3b82f6", "#eab308", "#ec4899", "#051036"]

// Pieces fly out from behind the check mark in a ring.
const confetti = Array.from({ length: 28 }, (_, i) => {
    const angle = (i / 28) * Math.PI * 2
    const distance = 110 + (i % 4) * 30
    return {
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        rotate: (i * 47) % 360,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
        delay: 0.35 + (i % 5) * 0.03,
    }
})

export function BookingSuccess({ name, email, whatsapp, onDone }: BookingSuccessProps) {
    const reduceMotion = useReducedMotion()
    const firstName = name?.trim().split(/\s+/)[0]

    return (
        <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 bg-[#051036]/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-success-title"
        >
            <motion.div
                className="relative w-full max-w-md my-auto bg-white rounded-3xl shadow-2xl px-8 pt-12 pb-8 text-center"
                initial={reduceMotion ? false : { scale: 0.85, y: 30, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
                {/* Check mark with confetti burst */}
                <div className="relative mx-auto mb-6 h-28 w-28">
                    {!reduceMotion && confetti.map((c, i) => (
                        <motion.span
                            key={i}
                            aria-hidden
                            className={`absolute left-1/2 top-1/2 h-2.5 ${c.round ? "w-2.5 rounded-full" : "w-1.5 rounded-sm"}`}
                            style={{ backgroundColor: c.color }}
                            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
                            animate={{ x: c.x, y: c.y, opacity: [0, 1, 1, 0], scale: 1, rotate: c.rotate }}
                            transition={{ duration: 1.1, delay: c.delay, ease: "easeOut" }}
                        />
                    ))}

                    {!reduceMotion && (
                        <motion.span
                            aria-hidden
                            className="absolute inset-0 rounded-full bg-green-400"
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 1.8, opacity: 0 }}
                            transition={{ duration: 1, delay: 0.35, ease: "easeOut" }}
                        />
                    )}

                    <motion.div
                        className="relative flex h-28 w-28 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-500/30"
                        initial={reduceMotion ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                    >
                        <svg viewBox="0 0 52 52" className="h-14 w-14" aria-hidden>
                            <motion.path
                                d="M14 27 l8 8 l16 -18"
                                fill="none"
                                stroke="white"
                                strokeWidth={5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                initial={reduceMotion ? false : { pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.45, delay: 0.4, ease: "easeOut" }}
                            />
                        </svg>
                    </motion.div>
                </div>

                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                >
                    <h2 id="booking-success-title" className="text-2xl font-bold text-[#051036]">
                        Booking confirmed!
                    </h2>
                    <p className="mt-2 text-gray-500">
                        {firstName ? `Thank you, ${firstName}. ` : "Thank you. "}
                        Your Rome experience is booked.
                    </p>

                    {(whatsapp || email) && (
                        <div className="mt-6 space-y-2 rounded-2xl bg-gray-50 p-4 text-left text-sm">
                            <p className="font-medium text-[#051036]">We'll send your booking details to:</p>
                            {whatsapp && (
                                <p className="flex items-center gap-2 text-gray-600">
                                    <MessageCircle className="h-4 w-4 shrink-0 text-green-600" />
                                    <span>WhatsApp <span className="font-medium text-[#051036]">{whatsapp}</span></span>
                                </p>
                            )}
                            {email && (
                                <p className="flex items-center gap-2 text-gray-600">
                                    <Mail className="h-4 w-4 shrink-0 text-orange-500" />
                                    <span className="font-medium text-[#051036] break-all">{email}</span>
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={onDone}
                        autoFocus
                        className="mt-8 w-full rounded-xl bg-orange-500 py-3 font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:bg-orange-600"
                    >
                        Back to home
                    </button>
                </motion.div>
            </motion.div>
        </motion.div>
    )
}
