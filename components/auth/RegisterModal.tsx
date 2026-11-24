"use client"

import { useState } from "react"
import { X, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { registerUser } from "@/services/authService"
import { WhatsAppInput } from "@/components/whatsapp-input"

interface RegisterModalProps {
    isOpen: boolean
    onClose: () => void
    onSwitchToLogin: () => void
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        first_name: "",
        last_name: "",
        password: "",
    })

    const [error, setError] = useState("")
    const [registered, setRegistered] = useState(false)

    if (!isOpen) return null

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        if (error) setError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        if (!formData.phone.trim()) {
            setError("Please enter your WhatsApp number.")
            return
        }
        setIsLoading(true)
        try {
            await registerUser(formData)
            setRegistered(true)
        } catch (err: any) {
            setError(
                err instanceof TypeError
                    ? "We couldn't reach the server. Check your internet connection and try again."
                    : err?.message || "Something went wrong. Please try again."
            )
        } finally {
            setIsLoading(false)
        }
    }

    const goToLogin = () => {
        setRegistered(false)
        onSwitchToLogin()
    }

    return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="relative w-full max-w-md my-auto bg-white rounded-2xl shadow-xl p-8 animate-in zoom-in-95 duration-200">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                    >
                        <X size={20} />
                    </button>

                    {registered ? (
                        <div className="text-center py-4" role="status">
                            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 mx-auto">
                                <CheckCircle2 className="text-green-600 w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#051036]">Account created!</h2>
                            <p className="text-gray-500 mt-2">
                                Welcome, {formData.first_name}. You can now log in with <span className="font-medium text-[#051036]">{formData.email}</span>.
                            </p>
                            <button
                                type="button"
                                onClick={goToLogin}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 mt-8"
                            >
                                Log In
                            </button>
                        </div>
                    ) : (
                    <>
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-[#051036]">Create an account</h2>
                        <p className="text-gray-500 mt-2">Join us to explore the world</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#051036]">First Name</label>
                                <input
                                    name="first_name"
                                    required
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="John"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-[#051036]">Last Name</label>
                                <input
                                    name="last_name"
                                    required
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-400"
                                    placeholder="Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#051036]">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-400"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="register-whatsapp" className="text-sm font-medium text-[#051036]">WhatsApp</label>
                            <WhatsAppInput
                                id="register-whatsapp"
                                value={formData.phone}
                                onChange={(phone) => setFormData((d) => ({ ...d, phone }))}
                                fieldClassName="rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                                activeItemClassName="bg-orange-50 text-orange-700"
                                popoverClassName="z-[10000]"
                            />
                            <p className="text-xs text-gray-500">We use it to send you booking details.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#051036]">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder:text-gray-400"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                                <p className="whitespace-pre-line">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Register"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-600 text-sm">
                            Already have an account?{" "}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-orange-500 font-bold hover:underline"
                            >
                                Log In
                            </button>
                        </p>
                    </div>
                    </>
                    )}
                </div>
            </div>
    )
}
