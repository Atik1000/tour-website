"use client"

import { useEffect, useState } from "react"
import { X, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { loginUser, setTokens } from "@/services/authService"

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
    onSwitchToRegister: () => void
    onLoginSuccess?: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister, onLoginSuccess }: LoginModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const [error, setError] = useState("")
    const [loggedIn, setLoggedIn] = useState(false)

    // After a successful login, show the confirmation briefly, then close.
    useEffect(() => {
        if (!loggedIn) return
        const timer = setTimeout(() => {
            setLoggedIn(false)
            onLoginSuccess?.()
            onClose()
        }, 1200)
        return () => clearTimeout(timer)
    }, [loggedIn]) // eslint-disable-line react-hooks/exhaustive-deps

    if (!isOpen) return null

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        if (error) setError("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)
        try {
            const data = await loginUser(formData)
            setTokens(data)
            setLoggedIn(true)
        } catch (err: any) {
            setError(
                err instanceof TypeError
                    ? "We couldn't reach the server. Check your internet connection and try again."
                    : err?.message || "Invalid email or password. Please try again."
            )
        } finally {
            setIsLoading(false)
        }
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

                    {loggedIn ? (
                        <div className="text-center py-6" role="status">
                            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4 mx-auto">
                                <CheckCircle2 className="text-green-600 w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#051036]">You're logged in</h2>
                            <p className="text-gray-500 mt-2">Welcome back!</p>
                        </div>
                    ) : (
                    <>
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-[#051036]">Welcome back</h2>
                        <p className="text-gray-500 mt-2">Log in to your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-[#051036]">Password</label>
                                <button type="button" className="text-xs text-orange-500 font-medium hover:underline">
                                    Forgot password?
                                </button>
                            </div>
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
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Log In"}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-gray-600 text-sm">
                            Don't have an account?{" "}
                            <button
                                onClick={onSwitchToRegister}
                                className="text-orange-500 font-bold hover:underline"
                            >
                                Sign Up
                            </button>
                        </p>
                    </div>
                    </>
                    )}
                </div>
            </div>
    )
}
